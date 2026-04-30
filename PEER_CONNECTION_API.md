# Peer Connection API Documentation

## Overview
This document describes the backend API endpoint needed to connect user-added peer nodes to the quantum network.

## Endpoint

### `POST /api/v1/peers/connect`

Connects a user's peer node to the distributed quantum network via libp2p.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "address": "string",          // IP address or hostname of the peer
  "port": number,               // Port number the peer is listening on
  "peer_id": "string",          // libp2p Peer ID (e.g., "QmXxXxXx..." or "12D3...")
  "label": "string",            // Human-readable label for the node
  "services": ["string"],       // Array of quantum services offered (optional)
  "max_qubits": number,         // Maximum qubits the node supports (optional)
  "description": "string"       // Additional node description (optional)
}
```

#### Example Request
```bash
curl -X POST http://localhost:8081/api/v1/peers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "192.168.1.100",
    "port": 8080,
    "peer_id": "QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N",
    "label": "My Quantum Node",
    "services": ["bell_pair", "teleport", "swap"],
    "max_qubits": 4,
    "description": "Development quantum processing node"
  }'
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Peer connected successfully",
  "peer": {
    "peer_id": "QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N",
    "address": "192.168.1.100:8080",
    "label": "My Quantum Node",
    "connection_status": "connected",
    "services_advertised": 3,
    "connected_at": "2024-04-30T12:34:56Z"
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid request data
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid peer_id format",
  "details": {
    "field": "peer_id",
    "issue": "Must start with 'Qm' or '12D3'"
  }
}
```

**409 Conflict** - Peer already connected
```json
{
  "success": false,
  "error": "peer_already_connected",
  "message": "This peer is already part of the network",
  "peer_id": "QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
}
```

**503 Service Unavailable** - Connection failed
```json
{
  "success": false,
  "error": "connection_failed",
  "message": "Unable to establish connection to peer",
  "details": {
    "reason": "connection_timeout",
    "attempted_address": "192.168.1.100:8080"
  }
}
```

## Backend Implementation Requirements

### 1. **libp2p Connection**
The backend must use py-libp2p to establish a connection to the peer:

```python
from libp2p import new_host
from libp2p.peer.id import ID

async def connect_peer(peer_data):
    host = await new_host()
    peer_id = ID.from_base58(peer_data['peer_id'])
    
    # Build multiaddr
    multiaddr = f"/ip4/{peer_data['address']}/tcp/{peer_data['port']}/p2p/{peer_data['peer_id']}"
    
    # Connect to peer
    await host.connect(peer_id, [multiaddr])
    
    # Register peer in coordinator
    await register_peer_in_coordinator(peer_data)
    
    return {"success": True, "peer_id": peer_data['peer_id']}
```

### 2. **Peer Registry**
Store connected peers in a registry for tracking:

```python
{
    "peer_id": str,
    "address": str,
    "port": int,
    "label": str,
    "services": list[str],
    "max_qubits": int,
    "description": str,
    "connected_at": datetime,
    "last_seen": datetime,
    "connection_status": "connected" | "disconnected",
    "is_user_added": bool  # Flag to identify user-added nodes
}
```

### 3. **Service Discovery**
After connection, query the peer for available services:

```python
async def discover_peer_services(peer_id):
    # Query peer's advertised quantum services
    services = await query_peer_capabilities(peer_id)
    
    # Update service registry
    await update_service_registry(peer_id, services)
    
    return services
```

### 4. **Health Monitoring**
Periodically check peer connectivity:

```python
async def monitor_peer_health(peer_id):
    while True:
        try:
            # Ping peer
            response = await ping_peer(peer_id, timeout=5)
            update_peer_status(peer_id, "connected")
        except TimeoutError:
            update_peer_status(peer_id, "disconnected")
        
        await asyncio.sleep(30)  # Check every 30 seconds
```

### 5. **Network Topology Update**
Update the network graph when a new peer connects:

```python
async def update_network_topology(peer_id):
    # Add node to network graph
    network_graph.add_node(peer_id)
    
    # Discover edges (connections to other peers)
    connected_peers = await discover_peer_connections(peer_id)
    
    for connected_peer in connected_peers:
        network_graph.add_edge(peer_id, connected_peer)
    
    # Broadcast topology update to frontend
    await broadcast_topology_update()
```

## Frontend Integration

### Calling the API
```typescript
const connectPeer = async (peerData: PeerConnectionData) => {
  const response = await fetch('/api/v1/peers/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(peerData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};
```

### Real-time Updates
Use WebSocket or polling to get real-time updates about peer status:

```typescript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8081/api/v1/peers/updates');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'peer_connected') {
    refreshNetworkData();
  }
};
```

## Data Flow

```
User (Frontend)
    ↓
[Add Node Form]
    ↓
POST /api/v1/peers/connect
    ↓
[Backend Coordinator]
    ↓
libp2p.connect(peer_id, multiaddr)
    ↓
[Service Discovery]
    ↓
[Network Topology Update]
    ↓
[Broadcast to Dashboard]
    ↓
Frontend updates (3D graph, tables, stats)
```

## Testing

### Manual Testing
1. Start a local quantum node:
   ```bash
   python -m quantum_node --port 8080
   ```

2. Note the peer ID from the logs

3. Use the frontend "Add Node" button to connect

4. Verify the node appears in:
   - `/network/nodes` (All Network Nodes table)
   - `/network/services` (Services offered by your node)
   - `/network/dag` (Visual graph showing connections)
   - `/network/fidelity` (Your node's fidelity metrics)

### Automated Testing
```python
import pytest
from app import connect_peer

@pytest.mark.asyncio
async def test_connect_valid_peer():
    peer_data = {
        "address": "localhost",
        "port": 8080,
        "peer_id": "QmTest1234567890",
        "label": "Test Node",
        "services": ["bell_pair"],
        "max_qubits": 2
    }
    
    result = await connect_peer(peer_data)
    assert result["success"] == True
    assert result["peer_id"] == peer_data["peer_id"]

@pytest.mark.asyncio
async def test_connect_invalid_peer_id():
    peer_data = {
        "address": "localhost",
        "port": 8080,
        "peer_id": "invalid_id",
        "label": "Test Node"
    }
    
    with pytest.raises(ValidationError):
        await connect_peer(peer_data)
```

## Security Considerations

1. **Authentication**: Consider adding authentication to prevent unauthorized nodes
2. **Rate Limiting**: Limit connection attempts to prevent DoS
3. **Peer Verification**: Verify peer identity using libp2p's built-in authentication
4. **Firewall Rules**: Document required firewall configurations
5. **TLS/Encryption**: Use secure transports for peer communication

## Next Steps

1. Implement the backend endpoint in your Python coordinator
2. Add WebSocket support for real-time peer status updates
3. Create peer health monitoring background task
4. Add peer disconnection handling
5. Implement filtered views on frontend network pages
