"""Real py-libp2p network fabric for coordinator + embedded service nodes."""

from __future__ import annotations

import json
import random
import threading
import time
from collections.abc import Awaitable, Callable
from contextlib import AsyncExitStack
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal

import anyio
from anyio.from_thread import BlockingPortal, start_blocking_portal

from quantum_coordinator.domain.models import GateType
from quantum_coordinator.infra.libp2p.protocols import (
    GATE_EXEC_PROTOCOL_ID_DEFAULT,
    SERVICE_AD_TOPIC_DEFAULT,
)
from quantum_coordinator.infra.libp2p.pylibp2p import (
    PyLibp2pNode,
    build_libp2p_node,
    run_libp2p_services,
)
from quantum_coordinator.service_discovery.advertisement import (
    ServiceAdvertisement,
    validate_advertisement_payload,
)
from quantum_coordinator.service_discovery.registry import ServiceRegistry


@dataclass(frozen=True)
class _EmbeddedPeerBehavior:
    profile_name: str
    base_fidelity: float
    qubit_min: int
    qubit_max: int
    supported_gate_types: tuple[GateType, ...]
    base_availability: bool = True
    response_delay_seconds: float = 0.0
    transient_error_rate: float = 0.0
    availability_flap_period_seconds: float = 0.0


@dataclass(frozen=True)
class _EmbeddedService:
    index: int
    node: PyLibp2pNode
    behavior: _EmbeddedPeerBehavior
    advertisements: tuple[ServiceAdvertisement, ...]


class PyLibp2pFabric:
    """Manages a real libp2p topology and gate execution stream calls.

    The fabric runs on a dedicated Trio backend via ``BlockingPortal``.
    """

    def __init__(
        self,
        *,
        coordinator_listen_addrs: tuple[str, ...],
        topic: str = SERVICE_AD_TOPIC_DEFAULT,
        gate_protocol_id: str = GATE_EXEC_PROTOCOL_ID_DEFAULT,
        embedded_service_count: int = 3,
        embedded_service_base_port: int = 9200,
        embedded_ad_interval_seconds: float = 5.0,
        embedded_peer_behavior_mode: Literal["uniform", "production_like"] = "production_like",
        embedded_peer_random_seed: int = 42,
        enable_mdns: bool = False,
        registry: ServiceRegistry | None = None,
    ) -> None:
        if embedded_service_count < 1:
            raise ValueError("embedded_service_count must be >= 1")

        self._coordinator_listen_addrs = coordinator_listen_addrs
        self._topic = topic
        self._gate_protocol_id = gate_protocol_id
        self._embedded_service_count = embedded_service_count
        self._embedded_service_base_port = embedded_service_base_port
        self._embedded_ad_interval_seconds = embedded_ad_interval_seconds
        self._embedded_peer_behavior_mode = embedded_peer_behavior_mode
        self._embedded_peer_random_seed = embedded_peer_random_seed
        self._enable_mdns = enable_mdns
        self._registry = registry
        self._rng = random.Random(embedded_peer_random_seed)

        self._portal_cm: Any | None = None
        self._portal: BlockingPortal | None = None
        self._trio_thread: threading.Thread | None = None
        self._stop_event: Any = None  # trio.Event, set in Trio thread
        self._bootstrap_error: BaseException | None = None  # set if _trio_main_loop fails
        self._coordinator: PyLibp2pNode | None = None
        self._services: list[_EmbeddedService] = []
        self._service_addrs: dict[str, tuple[str, ...]] = {}
        self._advertise_tasks: list[Any] = []  # trio tasks

    async def start(self) -> None:
        """Start Trio portal, coordinator node, and embedded service nodes."""
        await anyio.to_thread.run_sync(self._start_sync)

    async def stop(self) -> None:
        """Stop advertise tasks and close all libp2p services."""
        await anyio.to_thread.run_sync(self._stop_sync)

    def available_advertisements(self) -> list[ServiceAdvertisement]:
        """Return currently configured embedded service advertisements."""
        ads: list[ServiceAdvertisement] = []
        for service in self._services:
            ads.extend(service.advertisements)
        return ads

    async def next_advertisement(
        self,
        timeout_seconds: float | None = None,
    ) -> ServiceAdvertisement | None:
        """Read one advertisement observed by coordinator pubsub subscriber."""
        return await anyio.to_thread.run_sync(
            self._next_advertisement_sync,
            timeout_seconds,
        )

    async def invoke_gate(
        self,
        node_id: str,
        payload: bytes,
        timeout_seconds: float,
    ) -> bytes:
        """Invoke remote gate execution protocol on target node."""
        return await anyio.to_thread.run_sync(
            self._invoke_gate_sync,
            node_id,
            payload,
            timeout_seconds,
        )

    async def connectivity_snapshot(self) -> dict[str, Any]:
        """Return a verbose topology snapshot of the live libp2p fabric."""
        return await anyio.to_thread.run_sync(self._connectivity_snapshot_sync)

    def _start_sync(self) -> None:
        if self._portal is not None:
            return

        ready_event = threading.Event()

        def run_trio_thread() -> None:
            self._bootstrap_error = None
            portal_cm = start_blocking_portal(backend="trio")
            portal = portal_cm.__enter__()
            self._portal_cm = portal_cm
            self._portal = portal
            try:
                portal.call(self._trio_main_loop, ready_event)
            except BaseException as e:
                self._bootstrap_error = e
                ready_event.set()
            finally:
                try:
                    portal_cm.__exit__(None, None, None)
                except Exception:
                    pass
                self._portal_cm = None
                self._portal = None

        self._trio_thread = threading.Thread(target=run_trio_thread, daemon=True)
        self._trio_thread.start()
        if not ready_event.wait(timeout=60.0):
            self._portal_cm = None
            self._portal = None
            self._trio_thread = None
            raise RuntimeError("libp2p fabric failed to become ready within 60s")
        if self._bootstrap_error is not None:
            raise RuntimeError(
                "libp2p fabric bootstrap failed"
            ) from self._bootstrap_error

    def _stop_sync(self) -> None:
        portal = self._portal
        if portal is None:
            return

        portal.call(self._trio_set_stop_and_cancel_tasks)
        thread = self._trio_thread
        if thread is not None:
            thread.join(timeout=10.0)
        self._trio_thread = None

        if self._portal_cm is not None:
            try:
                self._portal_cm.__exit__(None, None, None)
            except Exception:
                pass
            self._portal_cm = None
        self._portal = None
        self._stop_event = None
        self._coordinator = None
        self._services = []
        self._service_addrs = {}
        self._advertise_tasks = []

    async def _trio_main_loop(self, ready_event: threading.Event) -> None:
        import trio

        self._stop_event = trio.Event()
        stack = AsyncExitStack()
        await stack.__aenter__()
        try:
            coordinator = build_libp2p_node(
                listen_addrs=self._coordinator_listen_addrs,
                enable_mdns=self._enable_mdns,
            )
            await stack.enter_async_context(
                run_libp2p_services(coordinator.host, coordinator.pubsub)
            )
            await coordinator.pubsub_adapter.subscribe(self._topic)

            coordinator_addrs = coordinator.listen_addrs()
            if not coordinator_addrs:
                raise RuntimeError("coordinator has no listen addresses")

            services: list[_EmbeddedService] = []
            service_addrs: dict[str, tuple[str, ...]] = {}
            for idx in range(self._embedded_service_count):
                service_node = build_libp2p_node(
                    listen_addrs=_embedded_listen_addrs(
                        self._embedded_service_base_port + idx
                    ),
                    enable_mdns=self._enable_mdns,
                )
                await stack.enter_async_context(
                    run_libp2p_services(service_node.host, service_node.pubsub)
                )
                await _connect_with_retry(
                    connect_fn=service_node.stream_adapter.connect_to_peer,
                    target_addrs=coordinator_addrs,
                )

                resolved_service_addrs = service_node.listen_addrs()
                if not resolved_service_addrs:
                    raise RuntimeError(
                        f"service node {service_node.peer_id} has no listen addresses"
                    )

                behavior = self._build_peer_behavior(idx)
                advertisements = self._build_service_advertisements(service_node, behavior)
                service_addrs[service_node.peer_id] = resolved_service_addrs
                service_node.stream_adapter.set_request_handler(
                    self._gate_protocol_id,
                    self._build_gate_handler(
                        service_index=idx,
                        behavior=behavior,
                        advertisements=advertisements,
                    ),
                )
                services.append(
                    _EmbeddedService(
                        index=idx,
                        node=service_node,
                        behavior=behavior,
                        advertisements=advertisements,
                    )
                )

            self._coordinator = coordinator
            self._services = services
            self._service_addrs = service_addrs
            # Embedded services are local to this coordinator, so seed the
            # registry directly instead of blasting a startup pubsub burst.
            self._seed_registry_with_embedded_services(services)

            async with trio.open_nursery() as nursery:
                for idx in range(len(services)):
                    nursery.start_soon(self._trio_advertise_loop, idx)
                ready_event.set()
                await self._stop_event.wait()
                nursery.cancel_scope.cancel()
        finally:
            await stack.aclose()
            self._coordinator = None
            self._services = []
            self._service_addrs = {}

    async def _trio_set_stop_and_cancel_tasks(self) -> None:
        if self._stop_event is not None:
            self._stop_event.set()

    async def _trio_advertise_loop(self, service_index: int) -> None:
        import trio

        service = self._services[service_index]
        advertisement_count = len(service.advertisements)
        if advertisement_count == 0:
            await trio.sleep_forever()

        stagger_seconds = (
            self._embedded_ad_interval_seconds / max(len(self._services), 1)
        ) * service_index
        await trio.sleep(self._embedded_ad_interval_seconds + stagger_seconds)

        next_advertisement_index = service_index % advertisement_count
        while True:
            # Refresh one capability at a time to avoid pubsub rate-limit bursts.
            advertisement = service.advertisements[next_advertisement_index]
            await self._publish_service_advertisements(service, (advertisement,))
            next_advertisement_index = (
                next_advertisement_index + 1
            ) % advertisement_count
            await trio.sleep(self._embedded_ad_interval_seconds)

    def _seed_registry_with_embedded_services(
        self,
        services: list[_EmbeddedService],
    ) -> None:
        if self._registry is None:
            return

        now = datetime.now(timezone.utc)
        for service in services:
            availability = self._is_service_available(service.index, service.behavior)
            for advertisement in service.advertisements:
                refreshed = advertisement.model_copy(
                    update={
                        "availability": availability,
                        "updated_at": now,
                    }
                )
                self._registry.upsert(refreshed)

    async def _publish_service_advertisements(
        self,
        service: _EmbeddedService,
        advertisements: tuple[ServiceAdvertisement, ...] | None = None,
    ) -> None:
        now = datetime.now(timezone.utc)
        ads_to_publish = advertisements or service.advertisements
        availability = self._is_service_available(service.index, service.behavior)
        for advertisement in ads_to_publish:
            refreshed = advertisement.model_copy(
                update={
                    "availability": availability,
                    "updated_at": now,
                }
            )
            await service.node.pubsub_adapter.publish(
                self._topic,
                refreshed.to_wire_bytes(),
            )

    def _next_advertisement_sync(
        self,
        timeout_seconds: float | None,
    ) -> ServiceAdvertisement | None:
        portal = self._portal
        if portal is None:
            return None
        return portal.call(self._trio_next_advertisement, timeout_seconds)

    async def _trio_next_advertisement(
        self,
        timeout_seconds: float | None,
    ) -> ServiceAdvertisement | None:
        coordinator = self._coordinator
        if coordinator is None:
            return None

        message = await coordinator.pubsub_adapter.next_message(
            self._topic,
            timeout_seconds=timeout_seconds,
        )
        if message is None:
            return None
        advertisement, _ = validate_advertisement_payload(message.payload)
        return advertisement

    def _invoke_gate_sync(
        self,
        node_id: str,
        payload: bytes,
        timeout_seconds: float,
    ) -> bytes:
        portal = self._portal
        if portal is None:
            raise RuntimeError("py-libp2p fabric is not started")
        return portal.call(self._trio_invoke_gate, node_id, payload, timeout_seconds)

    def _connectivity_snapshot_sync(self) -> dict[str, Any]:
        portal = self._portal
        if portal is None:
            return {
                "fabric_running": False,
                "topic": self._topic,
                "gate_protocol_id": self._gate_protocol_id,
                "embedded_service_count_configured": self._embedded_service_count,
                "embedded_peer_behavior_mode": self._embedded_peer_behavior_mode,
                "embedded_peer_random_seed": self._embedded_peer_random_seed,
                "generated_at": datetime.now(timezone.utc),
                "coordinator": None,
                "services": [],
                "directed_edges": [],
                "undirected_edges": [],
                "registry_snapshot": [],
                "known_service_addresses": {},
            }
        return portal.call(self._trio_connectivity_snapshot)

    async def _trio_connectivity_snapshot(self) -> dict[str, Any]:
        coordinator = self._coordinator
        services = list(self._services)

        roles_by_peer: dict[str, str] = {}
        connected_by_peer: dict[str, list[str]] = {}
        listen_addrs_by_peer: dict[str, list[str]] = {}

        coordinator_payload: dict[str, Any] | None = None
        if coordinator is not None:
            coordinator_peer_id = coordinator.peer_id
            coordinator_connected = sorted(
                str(peer_id) for peer_id in coordinator.host.get_connected_peers()
            )
            coordinator_addrs = list(coordinator.listen_addrs())
            roles_by_peer[coordinator_peer_id] = "coordinator"
            connected_by_peer[coordinator_peer_id] = coordinator_connected
            listen_addrs_by_peer[coordinator_peer_id] = coordinator_addrs
            coordinator_payload = {
                "peer_id": coordinator_peer_id,
                "listen_addrs": coordinator_addrs,
                "connected_peer_ids": coordinator_connected,
                "connected_peer_count": len(coordinator_connected),
            }

        service_payloads: list[dict[str, Any]] = []
        for service in services:
            service_peer_id = service.node.peer_id
            service_connected = sorted(
                str(peer_id) for peer_id in service.node.host.get_connected_peers()
            )
            service_addrs = list(service.node.listen_addrs())
            roles_by_peer[service_peer_id] = "service"
            connected_by_peer[service_peer_id] = service_connected
            listen_addrs_by_peer[service_peer_id] = service_addrs
            behavior = service.behavior
            current_availability = self._is_service_available(service.index, behavior)
            service_payloads.append(
                {
                    "index": service.index,
                    "peer_id": service_peer_id,
                    "listen_addrs": service_addrs,
                    "connected_peer_ids": service_connected,
                    "connected_peer_count": len(service_connected),
                    "current_availability": current_availability,
                    "behavior": {
                        "profile_name": behavior.profile_name,
                        "base_fidelity": behavior.base_fidelity,
                        "qubit_min": behavior.qubit_min,
                        "qubit_max": behavior.qubit_max,
                        "supported_gate_types": [
                            gate_type.value for gate_type in behavior.supported_gate_types
                        ],
                        "base_availability": behavior.base_availability,
                        "response_delay_seconds": behavior.response_delay_seconds,
                        "transient_error_rate": behavior.transient_error_rate,
                        "availability_flap_period_seconds": behavior.availability_flap_period_seconds,
                    },
                    "advertisements": [
                        {
                            "node_id": ad.node_id,
                            "listen_addrs": list(ad.listen_addrs),
                            "service_type": ad.service_type.value,
                            "fidelity": ad.fidelity,
                            "qubit_min": ad.qubit_min,
                            "qubit_max": ad.qubit_max,
                            "availability": ad.availability,
                            "updated_at": ad.updated_at,
                        }
                        for ad in service.advertisements
                    ],
                }
            )

        directed_edges: list[dict[str, Any]] = []
        undirected_edges_by_pair: dict[tuple[str, str], dict[str, Any]] = {}

        for source_peer_id, target_peer_ids in connected_by_peer.items():
            for target_peer_id in target_peer_ids:
                directed_edges.append(
                    {
                        "source_peer_id": source_peer_id,
                        "target_peer_id": target_peer_id,
                        "source_role": roles_by_peer.get(source_peer_id, "unknown"),
                        "target_role": roles_by_peer.get(target_peer_id, "unknown"),
                        "source_listen_addrs": listen_addrs_by_peer.get(source_peer_id, []),
                        "target_listen_addrs": listen_addrs_by_peer.get(
                            target_peer_id,
                            list(self._service_addrs.get(target_peer_id, ())),
                        ),
                        "is_coordinator_edge": roles_by_peer.get(source_peer_id)
                        == "coordinator"
                        or roles_by_peer.get(target_peer_id) == "coordinator",
                        "observed_direction": f"{source_peer_id}->{target_peer_id}",
                    }
                )

                ordered_pair = tuple(sorted((source_peer_id, target_peer_id)))
                pair_entry = undirected_edges_by_pair.get(ordered_pair)
                if pair_entry is None:
                    pair_entry = {
                        "peer_a": ordered_pair[0],
                        "peer_b": ordered_pair[1],
                        "peer_a_role": roles_by_peer.get(ordered_pair[0], "unknown"),
                        "peer_b_role": roles_by_peer.get(ordered_pair[1], "unknown"),
                        "peer_a_listen_addrs": listen_addrs_by_peer.get(ordered_pair[0], []),
                        "peer_b_listen_addrs": listen_addrs_by_peer.get(
                            ordered_pair[1],
                            list(self._service_addrs.get(ordered_pair[1], ())),
                        ),
                        "a_observes_b": False,
                        "b_observes_a": False,
                        "mutual": False,
                    }
                    undirected_edges_by_pair[ordered_pair] = pair_entry

                if source_peer_id == ordered_pair[0]:
                    pair_entry["a_observes_b"] = True
                elif source_peer_id == ordered_pair[1]:
                    pair_entry["b_observes_a"] = True

                pair_entry["mutual"] = bool(
                    pair_entry["a_observes_b"] and pair_entry["b_observes_a"]
                )

        registry_snapshot: list[dict[str, Any]] = []
        if self._registry is not None:
            registry_snapshot = [
                {
                    "node_id": entry.advertisement.node_id,
                    "service_type": entry.advertisement.service_type.value,
                    "listen_addrs": list(entry.advertisement.listen_addrs),
                    "fidelity": entry.advertisement.fidelity,
                    "qubit_min": entry.advertisement.qubit_min,
                    "qubit_max": entry.advertisement.qubit_max,
                    "availability": entry.advertisement.availability,
                    "updated_at": entry.advertisement.updated_at,
                    "expires_at": entry.expires_at,
                }
                for entry in self._registry.all_entries()
            ]

        return {
            "fabric_running": coordinator is not None,
            "topic": self._topic,
            "gate_protocol_id": self._gate_protocol_id,
            "embedded_service_count_configured": self._embedded_service_count,
            "embedded_peer_behavior_mode": self._embedded_peer_behavior_mode,
            "embedded_peer_random_seed": self._embedded_peer_random_seed,
            "generated_at": datetime.now(timezone.utc),
            "coordinator": coordinator_payload,
            "services": service_payloads,
            "directed_edges": directed_edges,
            "undirected_edges": list(undirected_edges_by_pair.values()),
            "registry_snapshot": registry_snapshot,
            "known_service_addresses": {
                peer_id: list(addrs) for peer_id, addrs in self._service_addrs.items()
            },
        }

    async def _trio_invoke_gate(
        self,
        node_id: str,
        payload: bytes,
        timeout_seconds: float,
    ) -> bytes:
        coordinator = self._coordinator
        if coordinator is None:
            raise RuntimeError("coordinator node unavailable")

        await self._ensure_service_connection(coordinator, node_id)
        try:
            return await coordinator.stream_adapter.request(
                node_id,
                self._gate_protocol_id,
                payload,
                timeout_seconds=timeout_seconds,
            )
        except Exception:
            await self._ensure_service_connection(coordinator, node_id, reconnect=True)
            return await coordinator.stream_adapter.request(
                node_id,
                self._gate_protocol_id,
                payload,
                timeout_seconds=timeout_seconds,
            )

    async def _ensure_service_connection(
        self,
        coordinator: PyLibp2pNode,
        node_id: str,
        reconnect: bool = False,
    ) -> None:
        connected_peers = {str(peer_id) for peer_id in coordinator.host.get_connected_peers()}
        if node_id in connected_peers and not reconnect:
            return

        target_addrs = self._service_addrs.get(node_id)
        if not target_addrs and self._registry is not None:
            for entry in self._registry.all_entries():
                if entry.advertisement.node_id == node_id and entry.advertisement.listen_addrs:
                    target_addrs = tuple(entry.advertisement.listen_addrs)
                    break
        if not target_addrs:
            raise RuntimeError(f"No listen addresses known for peer {node_id}")

        await _connect_with_retry(
            connect_fn=coordinator.stream_adapter.connect_to_peer,
            target_addrs=target_addrs,
        )

    def _build_service_advertisements(
        self,
        node: PyLibp2pNode,
        behavior: _EmbeddedPeerBehavior,
    ) -> tuple[ServiceAdvertisement, ...]:
        updated_at = datetime.now(timezone.utc)
        supported = behavior.supported_gate_types or tuple(GateType)
        return tuple(
            ServiceAdvertisement(
                node_id=node.peer_id,
                listen_addrs=node.listen_addrs(),
                service_type=gate_type,
                fidelity=behavior.base_fidelity,
                qubit_min=behavior.qubit_min,
                qubit_max=behavior.qubit_max,
                availability=behavior.base_availability,
                updated_at=updated_at,
            )
            for gate_type in supported
        )

    def _build_gate_handler(
        self,
        *,
        service_index: int,
        behavior: _EmbeddedPeerBehavior,
        advertisements: tuple[ServiceAdvertisement, ...],
    ) -> Callable[[bytes], Awaitable[bytes]]:
        supported = {ad.service_type: ad for ad in advertisements}

        async def handler(raw: bytes) -> bytes:
            try:
                payload = json.loads(raw.decode("utf-8"))
                service_type = GateType(str(payload.get("service_type")))
            except Exception:
                return _encode_gate_response(
                    success=False,
                    observed_fidelity=0.0,
                    error="invalid_request",
                )

            ad = supported.get(service_type)
            is_available = self._is_service_available(service_index, behavior)
            if ad is None or not is_available:
                return _encode_gate_response(
                    success=False,
                    observed_fidelity=0.0,
                    error="unsupported_service",
                )

            if behavior.response_delay_seconds > 0.0:
                import trio

                await trio.sleep(behavior.response_delay_seconds)

            if (
                behavior.transient_error_rate > 0.0
                and self._rng.random() < behavior.transient_error_rate
            ):
                return _encode_gate_response(
                    success=False,
                    observed_fidelity=ad.fidelity,
                    error="transient_peer_failure",
                )

            min_fidelity = float(payload.get("min_fidelity", 0.0))
            if ad.fidelity < min_fidelity:
                return _encode_gate_response(
                    success=False,
                    observed_fidelity=ad.fidelity,
                    error="fidelity_below_threshold",
                )

            return _encode_gate_response(
                success=True,
                observed_fidelity=ad.fidelity,
                error=None,
            )

        return handler

    def _build_peer_behavior(self, index: int) -> _EmbeddedPeerBehavior:
        if self._embedded_peer_behavior_mode == "uniform":
            return _EmbeddedPeerBehavior(
                profile_name="uniform",
                base_fidelity=max(0.80, 0.97 - (index * 0.01)),
                qubit_min=1,
                qubit_max=32,
                supported_gate_types=tuple(GateType),
            )
        return self._build_production_like_behavior(index)

    def _build_production_like_behavior(self, index: int) -> _EmbeddedPeerBehavior:
        profiles = (
            _EmbeddedPeerBehavior(
                profile_name="stable-premium",
                base_fidelity=0.985,
                qubit_min=1,
                qubit_max=64,
                supported_gate_types=tuple(GateType),
            ),
            _EmbeddedPeerBehavior(
                profile_name="high-throughput",
                base_fidelity=0.955,
                qubit_min=1,
                qubit_max=128,
                supported_gate_types=tuple(GateType),
                response_delay_seconds=0.01,
            ),
            _EmbeddedPeerBehavior(
                profile_name="specialized-qec",
                base_fidelity=0.94,
                qubit_min=2,
                qubit_max=48,
                supported_gate_types=(
                    GateType.SYNDROME_EXTRACTION,
                    GateType.DISTILLATION,
                    GateType.MEASUREMENT_FEEDFORWARD,
                    GateType.CNOT,
                    GateType.CZ,
                ),
                response_delay_seconds=0.025,
            ),
            _EmbeddedPeerBehavior(
                profile_name="legacy-latent",
                base_fidelity=0.91,
                qubit_min=1,
                qubit_max=24,
                supported_gate_types=tuple(GateType),
                response_delay_seconds=0.08,
            ),
            _EmbeddedPeerBehavior(
                profile_name="flaky-edge",
                base_fidelity=0.89,
                qubit_min=1,
                qubit_max=16,
                supported_gate_types=(
                    GateType.HADAMARD,
                    GateType.CNOT,
                    GateType.CZ,
                    GateType.BELL_PAIR,
                    GateType.TELEPORTATION,
                ),
                transient_error_rate=0.2,
                availability_flap_period_seconds=20.0,
            ),
            _EmbeddedPeerBehavior(
                profile_name="noisy-lab",
                base_fidelity=0.84,
                qubit_min=1,
                qubit_max=8,
                supported_gate_types=(
                    GateType.HADAMARD,
                    GateType.CNOT,
                    GateType.PROGRAMMABLE_GATE,
                ),
                transient_error_rate=0.1,
            ),
        )
        return profiles[index % len(profiles)]

    def _is_service_available(
        self,
        service_index: int,
        behavior: _EmbeddedPeerBehavior,
    ) -> bool:
        if not behavior.base_availability:
            return False
        period = behavior.availability_flap_period_seconds
        if period <= 0:
            return True
        bucket = int((time.time() + service_index) / period)
        return bucket % 3 != 0


def _encode_gate_response(
    *,
    success: bool,
    observed_fidelity: float,
    error: str | None,
) -> bytes:
    payload = {
        "success": success,
        "observed_fidelity": observed_fidelity,
        "error": error,
    }
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


async def _connect_with_retry(
    connect_fn: Callable[[str], Awaitable[None]],
    target_addrs: tuple[str, ...],
    attempts: int = 20,
    delay_seconds: float = 0.1,
) -> None:
    import trio

    if not target_addrs:
        raise RuntimeError("No target addresses available for libp2p connection")

    last_error: Exception | None = None
    for _ in range(attempts):
        for target_addr in target_addrs:
            try:
                await connect_fn(target_addr)
                return
            except Exception as exc:
                last_error = exc
        await trio.sleep(delay_seconds)

    if last_error is None:
        raise RuntimeError(f"Unable to connect to any address in {target_addrs!r}")
    raise RuntimeError(f"Unable to connect to {target_addrs!r}: {last_error}") from last_error


def _embedded_listen_addrs(port: int) -> tuple[str, ...]:
    from libp2p.utils.address_validation import get_available_interfaces

    addrs = get_available_interfaces(port)
    # Prefer single ip4 loopback for predictable local testing
    for addr in addrs:
        if "/ip4/127.0.0.1/" in str(addr):
            return (str(addr),)
    return tuple(str(addr) for addr in addrs)
