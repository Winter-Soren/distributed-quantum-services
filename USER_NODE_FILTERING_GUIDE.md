# User Node Filtering Implementation Guide

## Overview
This guide explains how to implement filtered views for user-added nodes across the network pages (`/network/services`, `/network/fidelity`, `/network/dag`).

## Architecture

### User Node Tracking
User-added nodes are tracked in localStorage and passed through React Context for global access.

## Step 1: Create User Nodes Context

### File: `frontend-v2/src/contexts/user-nodes-context.tsx`

```tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserNode = {
  peerId: string;
  label: string;
  addedAt: string;
};

type UserNodesContextType = {
  userNodes: UserNode[];
  addUserNode: (node: UserNode) => void;
  removeUserNode: (peerId: string) => void;
  isUserNode: (peerId: string) => boolean;
};

const UserNodesContext = createContext<UserNodesContextType | undefined>(undefined);

const STORAGE_KEY = 'quantum-network-user-nodes';

export function UserNodesProvider({ children }: { children: React.ReactNode }) {
  const [userNodes, setUserNodes] = useState<UserNode[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserNodes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user nodes from storage', e);
      }
    }
  }, []);

  // Save to localStorage whenever userNodes changes
  useEffect(() => {
    if (userNodes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userNodes));
    }
  }, [userNodes]);

  const addUserNode = (node: UserNode) => {
    setUserNodes(prev => {
      // Prevent duplicates
      if (prev.some(n => n.peerId === node.peerId)) {
        return prev;
      }
      return [...prev, node];
    });
  };

  const removeUserNode = (peerId: string) => {
    setUserNodes(prev => prev.filter(n => n.peerId !== peerId));
  };

  const isUserNode = (peerId: string) => {
    return userNodes.some(n => n.peerId === peerId);
  };

  return (
    <UserNodesContext.Provider value={{ userNodes, addUserNode, removeUserNode, isUserNode }}>
      {children}
    </UserNodesContext.Provider>
  );
}

export function useUserNodes() {
  const context = useContext(UserNodesContext);
  if (!context) {
    throw new Error('useUserNodes must be used within UserNodesProvider');
  }
  return context;
}
```

## Step 2: Wrap App with Provider

### File: `frontend-v2/src/app/(main)/layout.tsx`

```tsx
import { UserNodesProvider } from '@/contexts/user-nodes-context';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserNodesProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserNodesProvider>
  );
}
```

## Step 3: Update /network/nodes to Use Context

### File: `frontend-v2/src/app/(main)/network/nodes/page.tsx`

```tsx
import { useUserNodes } from '@/contexts/user-nodes-context';

export default function NodesPage() {
  const { userNodes, addUserNode } = useUserNodes();

  const handleNodeAdded = (nodeData: any) => {
    // Add to context (persisted in localStorage)
    addUserNode({
      peerId: nodeData.peerId,
      label: nodeData.nodeLabel,
      addedAt: new Date().toISOString()
    });
  };

  // Rest of component...
}
```

## Step 4: Implement /network/services Filtering

### File: `frontend-v2/src/app/(main)/network/services/page.tsx`

```tsx
'use client';

import { useUserNodes } from '@/contexts/user-nodes-context';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicesPage() {
  const { snapshot, isLoading } = useDashboardData();
  const { userNodes, isUserNode } = useUserNodes();

  if (!snapshot) {
    return <div>Loading...</div>;
  }

  // Filter services by user nodes
  const userServices = snapshot.services.filter(service =>
    isUserNode(service.nodeId)
  );

  const allServices = snapshot.services;

  return (
    <div className='flex flex-col gap-6 py-6'>
      <div className='px-4 lg:px-6'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold tracking-tight'>Network Services</h1>
            {userNodes.length > 0 && (
              <Badge variant='secondary'>{userServices.length} from your nodes</Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            Quantum gate services advertised across the network
          </p>
        </div>
      </div>

      <div className='px-4 lg:px-6'>
        <Tabs defaultValue='all' className='w-full'>
          <TabsList>
            <TabsTrigger value='all'>
              All Services ({allServices.length})
            </TabsTrigger>
            <TabsTrigger value='mine' disabled={userNodes.length === 0}>
              My Services ({userServices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>All Network Services</CardTitle>
                <CardDescription>
                  Complete list of quantum services from all peers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesTable services={allServices} isUserNode={isUserNode} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='mine' className='mt-6'>
            <Card className='border-primary/20 bg-primary/5'>
              <CardHeader>
                <CardTitle>Your Services</CardTitle>
                <CardDescription>
                  Services offered by nodes you've added to the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesTable services={userServices} highlightAll />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ServicesTable({
  services,
  isUserNode,
  highlightAll = false
}: {
  services: any[];
  isUserNode?: (id: string) => boolean;
  highlightAll?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service Type</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>Fidelity</TableHead>
          <TableHead>Qubit Range</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map(service => {
          const isOwned = highlightAll || (isUserNode && isUserNode(service.nodeId));
          return (
            <TableRow
              key={service.id}
              className={isOwned ? 'bg-primary/5' : ''}
            >
              <TableCell className='font-medium'>
                {service.serviceType}
                {isOwned && (
                  <Badge variant='secondary' className='ml-2 text-xs'>
                    Your Node
                  </Badge>
                )}
              </TableCell>
              <TableCell>{service.nodeLabel}</TableCell>
              <TableCell>{service.fidelityLabel}</TableCell>
              <TableCell>{service.qubitRangeLabel}</TableCell>
              <TableCell>
                <Badge variant={service.availability ? 'secondary' : 'destructive'}>
                  {service.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

## Step 5: Implement /network/fidelity Filtering

### File: `frontend-v2/src/app/(main)/network/fidelity/page.tsx`

```tsx
'use client';

import { useUserNodes } from '@/contexts/user-nodes-context';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function FidelityPage() {
  const { snapshot } = useDashboardData();
  const { userNodes, isUserNode } = useUserNodes();

  if (!snapshot) {
    return <div>Loading...</div>;
  }

  // Get fidelity data for user nodes
  const userNodeFidelity = snapshot.nodes
    .filter(node => isUserNode(node.nodeId))
    .map(node => ({
      nodeId: node.nodeId,
      label: node.nodeLabel,
      fidelity: node.averageFidelity,
      services: node.totalServices,
      availableServices: node.availableServices
    }));

  return (
    <div className='flex flex-col gap-6 py-6'>
      <div className='px-4 lg:px-6'>
        <div className='space-y-1'>
          <h1 className='text-lg font-semibold tracking-tight'>Network Fidelity</h1>
          <p className='text-sm text-muted-foreground'>
            Quantum gate fidelity metrics across the network
          </p>
        </div>
      </div>

      {/* Your Nodes Section */}
      {userNodeFidelity.length > 0 && (
        <div className='px-4 lg:px-6'>
          <Card className='border-primary/20 bg-primary/5'>
            <CardHeader>
              <CardTitle className='text-base'>Your Nodes Fidelity</CardTitle>
              <CardDescription>
                Average fidelity of services on your nodes
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {userNodeFidelity.map(node => (
                <div key={node.nodeId} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>{node.label}</p>
                      <p className='text-xs text-muted-foreground'>
                        {node.availableServices}/{node.services} services active
                      </p>
                    </div>
                    <Badge variant='secondary'>
                      {(node.fidelity * 100).toFixed(2)}%
                    </Badge>
                  </div>
                  <Progress value={node.fidelity * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network-wide Fidelity */}
      <div className='px-4 lg:px-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Network-wide Fidelity</CardTitle>
            <CardDescription>
              Fidelity distribution across all peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add network-wide fidelity chart/stats here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Step 6: Implement /network/dag Highlighting

### File: `frontend-v2/src/app/(main)/network/dag/page.tsx`

```tsx
'use client';

import { useUserNodes } from '@/contexts/user-nodes-context';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { DashboardNetwork3D } from '@/components/dashboard-network-3d';

export default function DagPage() {
  const { snapshot } = useDashboardData();
  const { userNodes, isUserNode } = useUserNodes();

  // Enhance network data to highlight user nodes
  const enhancedNetwork = snapshot?.network
    ? {
        ...snapshot.network,
        nodes: snapshot.network.nodes.map(node => ({
          ...node,
          // Add custom styling for user nodes
          isUserNode: isUserNode(node.nodeId),
          color: isUserNode(node.nodeId) ? '#3b82f6' : node.color // Blue for user nodes
        }))
      }
    : null;

  return (
    <div className='flex flex-col gap-6 py-6'>
      <div className='px-4 lg:px-6'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold tracking-tight'>Network DAG</h1>
            {userNodes.length > 0 && (
              <Badge variant='secondary'>
                Your nodes highlighted in blue
              </Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            Directed acyclic graph showing peer connections
          </p>
        </div>
      </div>

      <div className='px-4 lg:px-6'>
        <DashboardNetwork3D
          network={enhancedNetwork}
          isLoading={!snapshot}
          selectedNodeId={null}
          onSelectNode={() => {}}
        />
      </div>

      {userNodes.length > 0 && (
        <div className='px-4 lg:px-6'>
          <Card className='border-primary/20 bg-primary/5'>
            <CardHeader>
              <CardTitle className='text-base'>Your Nodes in the Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {userNodes.map(node => (
                  <div key={node.peerId} className='flex items-center gap-2 text-sm'>
                    <div className='size-3 rounded-full bg-primary' />
                    <span className='font-medium'>{node.label}</span>
                    <span className='text-muted-foreground font-mono text-xs'>
                      {node.peerId}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

## Step 7: Enhance DashboardNetwork3D Component

### File: `frontend-v2/src/components/dashboard-network-3d.tsx`

Update the component to support custom node styling:

```tsx
// In nodeColor callback
const nodeColor = React.useCallback(
  (node: GraphNode) => {
    // Check if this is a user node and apply custom color
    if (node.isUserNode) {
      return '#3b82f6'; // Primary blue for user nodes
    }
    
    // Default color logic
    const fallback = node.kind === 'coordinator'
      ? mixHex(themePalette.chart2, '#ffffff', 0.08)
      : mixHex(themePalette.primary, '#ffffff', 0.06);
    return resolveGraphPaintColor(node.color, fallback);
  },
  [themePalette]
);
```

## Implementation Checklist

- [ ] Create `user-nodes-context.tsx` with localStorage persistence
- [ ] Wrap app in `UserNodesProvider`
- [ ] Update `/network/nodes` to use context
- [ ] Implement `/network/services` with tabs (All/Mine)
- [ ] Implement `/network/fidelity` with user nodes section
- [ ] Implement `/network/dag` with blue highlighting
- [ ] Enhance `DashboardNetwork3D` to support custom node colors
- [ ] Test localStorage persistence across page reloads
- [ ] Test adding/removing nodes updates all filtered views

## Benefits

1. **Persistent Tracking**: User nodes persist across sessions via localStorage
2. **Global Access**: Context makes user node data available anywhere
3. **Automatic Filtering**: All network pages automatically filter/highlight user nodes
4. **Visual Distinction**: User nodes highlighted in blue across all visualizations
5. **Tabbed Views**: Clean separation between "All" and "Mine" on relevant pages

## Testing

1. Add a node via `/network/nodes`
2. Navigate to `/network/services` → See node highlighted, check "My Services" tab
3. Navigate to `/network/fidelity` → See your node's metrics in top section
4. Navigate to `/network/dag` → See your node highlighted in blue
5. Refresh page → Verify nodes persist via localStorage
6. Add multiple nodes → Verify all are tracked and highlighted

## Future Enhancements

- Real-time connection status updates via WebSocket
- Node performance metrics over time
- Comparison charts (user nodes vs network average)
- Export user node configuration
- Node health monitoring alerts
