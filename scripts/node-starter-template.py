#!/usr/bin/env python3
"""
Quantum Network Node Starter Template
======================================

This script sets up a quantum processing node that connects to the
distributed quantum network via libp2p.

Usage:
    python node-starter-template.py --port 8080 --label "My Node"

Requirements:
    pip install py-libp2p numpy qiskit

Customize the SERVICES dictionary below to define your node's capabilities.
"""

import asyncio
import argparse
import logging
import sys
from typing import Dict, List, Optional
from dataclasses import dataclass

try:
    from libp2p import new_host
    from libp2p.peer.id import ID
    from libp2p.network.stream.net_stream_interface import INetStream
except ImportError:
    print("Error: py-libp2p not installed. Run: pip install py-libp2p")
    sys.exit(1)

# ============================================================================
# CONFIGURATION - Customize these values for your node
# ============================================================================

@dataclass
class NodeConfig:
    """Configuration for your quantum node"""
    port: int = 8080
    label: str = "My Quantum Node"
    max_qubits: int = 4
    services: List[str] = None
    coordinator_address: str = "/ip4/127.0.0.1/tcp/8081"

    def __post_init__(self):
        if self.services is None:
            self.services = ["bell_pair", "teleport", "swap"]


# Define the quantum services your node can provide
SERVICES = {
    "bell_pair": {
        "description": "Creates entangled Bell pairs",
        "qubits_required": 2,
        "fidelity": 0.98,
        "avg_execution_time_ms": 50
    },
    "teleport": {
        "description": "Quantum teleportation protocol",
        "qubits_required": 3,
        "fidelity": 0.95,
        "avg_execution_time_ms": 120
    },
    "swap": {
        "description": "Entanglement swapping",
        "qubits_required": 4,
        "fidelity": 0.93,
        "avg_execution_time_ms": 150
    },
    "cnot": {
        "description": "Controlled-NOT gate",
        "qubits_required": 2,
        "fidelity": 0.99,
        "avg_execution_time_ms": 30
    },
    "hadamard": {
        "description": "Hadamard gate (superposition)",
        "qubits_required": 1,
        "fidelity": 0.995,
        "avg_execution_time_ms": 20
    }
}

# ============================================================================
# QUANTUM NODE IMPLEMENTATION
# ============================================================================

class QuantumNode:
    """
    A quantum processing node in the distributed network.

    This node advertises quantum gate services and processes requests
    from the coordinator.
    """

    def __init__(self, config: NodeConfig):
        self.config = config
        self.host = None
        self.peer_id = None
        self.logger = self._setup_logger()
        self.active_services = {
            svc: SERVICES[svc]
            for svc in config.services
            if svc in SERVICES
        }

    def _setup_logger(self) -> logging.Logger:
        """Configure logging for the node"""
        logger = logging.getLogger("QuantumNode")
        logger.setLevel(logging.INFO)

        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
        logger.addHandler(handler)
        return logger

    async def start(self):
        """Initialize and start the quantum node"""
        self.logger.info(f"Starting quantum node: {self.config.label}")

        # Create libp2p host
        self.host = await new_host(port=self.config.port)
        self.peer_id = self.host.get_id()

        self.logger.info(f"Node started successfully!")
        self.logger.info(f"Peer ID: {self.peer_id.pretty()}")
        self.logger.info(f"Listening on port: {self.config.port}")
        self.logger.info(f"Services offered: {', '.join(self.config.services)}")

        # Print connection instructions
        self._print_connection_info()

        # Start service handlers
        await self._start_service_handlers()

        # Keep node running
        await self._run_forever()

    def _print_connection_info(self):
        """Print information needed to connect this node to the network"""
        print("\n" + "="*70)
        print("CONNECTION INFORMATION")
        print("="*70)
        print(f"\nTo add this node to the quantum network:")
        print(f"\n1. Open the web interface: http://localhost:3000/network/nodes")
        print(f"2. Click 'Add Node' and enter these details:")
        print(f"\n   Node Address: 127.0.0.1 (or your public IP)")
        print(f"   Port: {self.config.port}")
        print(f"   Peer ID: {self.peer_id.pretty()}")
        print(f"   Label: {self.config.label}")
        print(f"   Services: {', '.join(self.config.services)}")
        print(f"   Max Qubits: {self.config.max_qubits}")
        print(f"\n3. Click 'Add Node' to connect")
        print("\n" + "="*70 + "\n")

    async def _start_service_handlers(self):
        """Register handlers for quantum service requests"""
        for service_name in self.active_services:
            protocol = f"/quantum/{service_name}/1.0.0"
            self.host.set_stream_handler(
                protocol,
                self._create_service_handler(service_name)
            )
            self.logger.info(f"Registered handler for: {protocol}")

    def _create_service_handler(self, service_name: str):
        """Create a handler function for a specific quantum service"""
        async def handler(stream: INetStream):
            self.logger.info(f"Received {service_name} request")

            # Read request data
            request_data = await stream.read()

            # Process quantum operation (stub - implement your logic here)
            result = await self._process_quantum_operation(
                service_name,
                request_data
            )

            # Send response
            await stream.write(result.encode())
            await stream.close()

            self.logger.info(f"Completed {service_name} request")

        return handler

    async def _process_quantum_operation(
        self,
        service_name: str,
        request_data: bytes
    ) -> str:
        """
        Process a quantum operation request.

        This is where you implement your actual quantum gate logic.
        You can use Qiskit, Cirq, or your own quantum simulator.
        """
        service = self.active_services[service_name]

        # Simulate processing time
        await asyncio.sleep(service["avg_execution_time_ms"] / 1000)

        # TODO: Implement actual quantum operation
        # Example with Qiskit:
        # from qiskit import QuantumCircuit
        # qc = QuantumCircuit(service["qubits_required"])
        # ... build circuit based on service_name
        # result = qc.execute()

        return f'{{"status": "success", "service": "{service_name}", "fidelity": {service["fidelity"]}}}'

    async def _run_forever(self):
        """Keep the node running indefinitely"""
        try:
            await asyncio.Event().wait()  # Wait forever
        except KeyboardInterrupt:
            self.logger.info("\nShutting down node...")
            await self.shutdown()

    async def shutdown(self):
        """Clean shutdown of the node"""
        if self.host:
            await self.host.close()
        self.logger.info("Node stopped")


# ============================================================================
# CLI INTERFACE
# ============================================================================

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Start a quantum processing node for the distributed network"
    )

    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Port to listen on (default: 8080)"
    )

    parser.add_argument(
        "--label",
        type=str,
        default="My Quantum Node",
        help="Human-readable label for your node"
    )

    parser.add_argument(
        "--max-qubits",
        type=int,
        default=4,
        help="Maximum qubits your node can handle (default: 4)"
    )

    parser.add_argument(
        "--services",
        type=str,
        nargs="+",
        default=["bell_pair", "teleport", "swap"],
        help="Quantum services to offer (default: bell_pair teleport swap)"
    )

    parser.add_argument(
        "--coordinator",
        type=str,
        default="/ip4/127.0.0.1/tcp/8081",
        help="Coordinator multiaddr (default: /ip4/127.0.0.1/tcp/8081)"
    )

    return parser.parse_args()


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

async def main():
    """Main entry point for the quantum node"""
    args = parse_args()

    config = NodeConfig(
        port=args.port,
        label=args.label,
        max_qubits=args.max_qubits,
        services=args.services,
        coordinator_address=args.coordinator
    )

    node = QuantumNode(config)
    await node.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nNode stopped by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
