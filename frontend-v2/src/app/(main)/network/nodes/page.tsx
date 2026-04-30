'use client';

import { useState } from 'react';
import {
	CheckCircle2Icon,
	CodeIcon,
	CopyIcon,
	DownloadIcon,
	PlayCircleIcon,
	ServerIcon,
	TerminalIcon
} from 'lucide-react';

import { AddNodeModal } from '@/components/add-node-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

type UserNode = {
	peerId: string;
	address: string;
	port: number;
	label: string;
	services: string[];
	maxQubits: number;
	connectionStatus: 'connected' | 'disconnected' | 'connecting';
	addedAt: Date;
	fidelity: number;
	requestsHandled: number;
};

export default function NodesPage() {
	const [userNodes, setUserNodes] = useState<UserNode[]>([]);
	const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

	const handleNodeAdded = (nodeData: any) => {
		const newNode: UserNode = {
			peerId: nodeData.peerId,
			address: nodeData.nodeAddress,
			port: Number(nodeData.port),
			label: nodeData.nodeLabel,
			services: nodeData.services.split(',').map((s: string) => s.trim()).filter(Boolean),
			maxQubits: Number(nodeData.maxQubits),
			connectionStatus: 'connected',
			addedAt: new Date(),
			fidelity: 0.95,
			requestsHandled: 0
		};

		setUserNodes(prev => [...prev, newNode]);
	};

	const copyToClipboard = async (text: string, commandId: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedCommand(commandId);
		setTimeout(() => setCopiedCommand(null), 2000);
	};

	const downloadScript = () => {
		// In production, this would fetch the actual script from /node-starter-template.py
		const scriptUrl = '/node-starter-template.py';
		const link = document.createElement('a');
		link.href = scriptUrl;
		link.download = 'quantum-node.py';
		link.click();
	};

	// Empty state - no nodes added yet
	if (userNodes.length === 0) {
		return (
			<div className='flex flex-col gap-6 py-6'>
				{/* Header */}
				<div className='flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6'>
					<div className='space-y-1'>
						<h1 className='text-lg font-semibold tracking-tight'>Your Network Nodes</h1>
						<p className='text-sm text-muted-foreground'>
							Connect your quantum processing nodes to the distributed network
						</p>
					</div>
					<AddNodeModal onNodeAdded={handleNodeAdded} />
				</div>

				{/* Empty State */}
				<div className='px-4 lg:px-6'>
					<Card className='border-dashed'>
						<CardContent className='py-12'>
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant='icon'>
										<ServerIcon />
									</EmptyMedia>
									<EmptyTitle>No nodes added yet</EmptyTitle>
									<EmptyDescription className='max-w-md'>
										Start a quantum node on your machine and connect it to the network to begin
										processing quantum circuits
									</EmptyDescription>
								</EmptyHeader>
								<div className='flex flex-wrap gap-2'>
									<AddNodeModal
										onNodeAdded={handleNodeAdded}
										trigger={
											<Button>
												<ServerIcon className='size-4' />
												Add Existing Node
											</Button>
										}
									/>
								</div>
							</Empty>
						</CardContent>
					</Card>
				</div>

				{/* Setup Guide */}
				<div className='px-4 lg:px-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center gap-3'>
								<div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
									<TerminalIcon className='size-5 text-primary' />
								</div>
								<div>
									<CardTitle className='text-base'>Quick Start Guide</CardTitle>
									<CardDescription>
										Set up your first quantum node in under 5 minutes
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue='starter' className='w-full'>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger value='starter'>Starter Script</TabsTrigger>
									<TabsTrigger value='manual'>Manual Setup</TabsTrigger>
								</TabsList>

								{/* Starter Script Tab */}
								<TabsContent value='starter' className='space-y-4'>
									<Alert>
										<DownloadIcon className='size-4' />
										<AlertTitle>Python Starter Template</AlertTitle>
										<AlertDescription>
											We've created a ready-to-use Python script that handles all the libp2p
											configuration for you
										</AlertDescription>
									</Alert>

									<div className='space-y-4'>
										<div className='space-y-2'>
											<div className='flex items-center justify-between'>
												<h4 className='text-sm font-semibold'>Step 1: Download Template</h4>
												<Button
													variant='outline'
													size='sm'
													onClick={downloadScript}
												>
													<DownloadIcon className='size-4' />
													Download Script
												</Button>
											</div>
											<p className='text-sm text-muted-foreground'>
												Download our pre-configured quantum node template
											</p>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 2: Install Dependencies</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>pip install py-libp2p numpy qiskit</code>
												</pre>
												<Button
													variant='ghost'
													size='icon-sm'
													className='absolute right-2 top-2'
													onClick={() => copyToClipboard('pip install py-libp2p numpy qiskit', 'install')}
												>
													{copiedCommand === 'install' ? (
														<CheckCircle2Icon className='size-4 text-green-500' />
													) : (
														<CopyIcon className='size-4' />
													)}
												</Button>
											</div>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 3: Start Your Node</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>{`python quantum-node.py \\
  --port 8080 \\
  --label "My Quantum Node" \\
  --max-qubits 4 \\
  --services bell_pair teleport swap`}</code>
												</pre>
												<Button
													variant='ghost'
													size='icon-sm'
													className='absolute right-2 top-2'
													onClick={() => copyToClipboard(
														'python quantum-node.py --port 8080 --label "My Quantum Node" --max-qubits 4 --services bell_pair teleport swap',
														'start'
													)}
												>
													{copiedCommand === 'start' ? (
														<CheckCircle2Icon className='size-4 text-green-500' />
													) : (
														<CopyIcon className='size-4' />
													)}
												</Button>
											</div>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 4: Connect to Network</h4>
											<p className='text-sm text-muted-foreground'>
												Once your node is running, copy the Peer ID from the terminal output and click
												"Add Node" above to connect it to the network
											</p>
										</div>

										<Alert variant='default'>
											<CodeIcon className='size-4' />
											<AlertTitle>Customize Your Node</AlertTitle>
											<AlertDescription className='space-y-2 text-xs'>
												<p>Edit the script to customize:</p>
												<ul className='ml-4 list-disc space-y-1'>
													<li>Quantum services offered (bell_pair, teleport, swap, cnot, hadamard)</li>
													<li>Maximum qubits your hardware can handle</li>
													<li>Service fidelity and execution times</li>
													<li>Custom quantum gate implementations</li>
												</ul>
											</AlertDescription>
										</Alert>
									</div>
								</TabsContent>

								{/* Manual Setup Tab */}
								<TabsContent value='manual' className='space-y-4'>
									<div className='space-y-4'>
										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 1: Install py-libp2p</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>pip install py-libp2p</code>
												</pre>
												<Button
													variant='ghost'
													size='icon-sm'
													className='absolute right-2 top-2'
													onClick={() => copyToClipboard('pip install py-libp2p', 'manual-install')}
												>
													{copiedCommand === 'manual-install' ? (
														<CheckCircle2Icon className='size-4 text-green-500' />
													) : (
														<CopyIcon className='size-4' />
													)}
												</Button>
											</div>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 2: Create libp2p Host</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>{`from libp2p import new_host

host = await new_host(port=8080)
peer_id = host.get_id()
print(f"Peer ID: {peer_id.pretty()}")`}</code>
												</pre>
											</div>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 3: Register Service Handlers</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>{`async def bell_pair_handler(stream):
    request = await stream.read()
    result = process_bell_pair(request)
    await stream.write(result)

host.set_stream_handler(
    "/quantum/bell_pair/1.0.0",
    bell_pair_handler
)`}</code>
												</pre>
											</div>
										</div>

										<div className='space-y-2'>
											<h4 className='text-sm font-semibold'>Step 4: Keep Node Running</h4>
											<div className='relative'>
												<pre className='overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs'>
													<code>{`await asyncio.Event().wait()  # Run forever`}</code>
												</pre>
											</div>
										</div>

										<Alert>
											<AlertTitle>Full Implementation</AlertTitle>
											<AlertDescription>
												See{' '}
												<code className='rounded bg-muted px-1 py-0.5 text-xs'>
													node-starter-template.py
												</code>{' '}
												for a complete implementation with service discovery and error handling
											</AlertDescription>
										</Alert>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>

				{/* Requirements Card */}
				<div className='px-4 lg:px-6'>
					<Card className='border-border/50 bg-muted/20'>
						<CardHeader>
							<CardTitle className='text-base'>System Requirements</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3 text-sm text-muted-foreground'>
							<div className='grid gap-3 sm:grid-cols-2'>
								<div>
									<h4 className='mb-1 font-semibold text-foreground'>Software</h4>
									<ul className='ml-4 list-disc space-y-1'>
										<li>Python 3.8 or higher</li>
										<li>py-libp2p library</li>
										<li>Open firewall port (default: 8080)</li>
									</ul>
								</div>
								<div>
									<h4 className='mb-1 font-semibold text-foreground'>Hardware (Recommended)</h4>
									<ul className='ml-4 list-disc space-y-1'>
										<li>2+ CPU cores</li>
										<li>4GB+ RAM</li>
										<li>Stable internet connection</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// User has nodes - show statistics
	return (
		<div className='flex flex-col gap-6 py-6'>
			{/* Header */}
			<div className='flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6'>
				<div className='space-y-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<h1 className='text-lg font-semibold tracking-tight'>Your Network Nodes</h1>
						<Badge variant='secondary'>{userNodes.length} active</Badge>
					</div>
					<p className='text-sm text-muted-foreground'>
						Monitor and manage your quantum processing nodes
					</p>
				</div>
				<AddNodeModal onNodeAdded={handleNodeAdded} />
			</div>

			{/* Node Statistics Grid */}
			<div className='grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6'>
				<Card>
					<CardHeader className='pb-3'>
						<CardDescription>Total Nodes</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-semibold'>{userNodes.length}</div>
						<p className='text-xs text-muted-foreground'>
							{userNodes.filter(n => n.connectionStatus === 'connected').length} connected
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-3'>
						<CardDescription>Total Qubits</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-semibold'>
							{userNodes.reduce((sum, node) => sum + node.maxQubits, 0)}
						</div>
						<p className='text-xs text-muted-foreground'>Across all nodes</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-3'>
						<CardDescription>Avg Fidelity</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-semibold'>
							{((userNodes.reduce((sum, node) => sum + node.fidelity, 0) / userNodes.length) * 100).toFixed(1)}%
						</div>
						<p className='text-xs text-muted-foreground'>Network-wide average</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-3'>
						<CardDescription>Requests Handled</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-semibold'>
							{userNodes.reduce((sum, node) => sum + node.requestsHandled, 0)}
						</div>
						<p className='text-xs text-muted-foreground'>Total processed</p>
					</CardContent>
				</Card>
			</div>

			{/* Node List */}
			<div className='px-4 lg:px-6'>
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Active Nodes</CardTitle>
						<CardDescription>Detailed status of each node</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{userNodes.map(node => (
							<div
								key={node.peerId}
								className='flex items-start gap-4 rounded-lg border border-border/60 bg-muted/20 p-4'
							>
								<div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
									<ServerIcon className='size-5 text-primary' />
								</div>
								<div className='min-w-0 flex-1 space-y-2'>
									<div className='flex items-start justify-between gap-2'>
										<div>
											<h4 className='font-semibold'>{node.label}</h4>
											<p className='text-xs text-muted-foreground font-mono'>{node.peerId}</p>
										</div>
										<Badge
											variant={node.connectionStatus === 'connected' ? 'secondary' : 'destructive'}
										>
											{node.connectionStatus}
										</Badge>
									</div>

									<div className='grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4'>
										<div>
											<span className='text-muted-foreground'>Address:</span>{' '}
											<span className='font-mono'>{node.address}:{node.port}</span>
										</div>
										<div>
											<span className='text-muted-foreground'>Max Qubits:</span> {node.maxQubits}
										</div>
										<div>
											<span className='text-muted-foreground'>Fidelity:</span>{' '}
											{(node.fidelity * 100).toFixed(2)}%
										</div>
										<div>
											<span className='text-muted-foreground'>Requests:</span> {node.requestsHandled}
										</div>
									</div>

									<div className='flex flex-wrap gap-1'>
										{node.services.map(service => (
											<Badge key={service} variant='outline' className='text-xs'>
												{service}
											</Badge>
										))}
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
