'use client';

import * as React from 'react';
import {
	AlertCircleIcon,
	CheckCircleIcon,
	CpuIcon,
	Loader2Icon,
	NetworkIcon,
	PlusIcon,
	ServerIcon,
	TagIcon,
	WifiIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type AddNodeFormData = {
	nodeAddress: string;
	port: string;
	peerId: string;
	nodeLabel: string;
	services: string;
	maxQubits: string;
	description: string;
};

type AddNodeModalProps = {
	onNodeAdded?: (nodeData: AddNodeFormData) => void;
	trigger?: React.ReactNode;
};

const INITIAL_FORM_STATE: AddNodeFormData = {
	nodeAddress: '',
	port: '8080',
	peerId: '',
	nodeLabel: '',
	services: '',
	maxQubits: '4',
	description: ''
};

function SectionHeader({
	icon: Icon,
	label,
	tag,
	tagVariant = 'required'
}: {
	icon: React.ElementType;
	label: string;
	tag?: string;
	tagVariant?: 'required' | 'optional';
}) {
	return (
		<div className='flex items-center gap-2.5 pb-1'>
			<div className='flex size-6 items-center justify-center rounded-md bg-primary/10'>
				<Icon className='size-3.5 text-primary' />
			</div>
			<span className='text-sm font-semibold text-foreground'>{label}</span>
			{tag && (
				<span
					className={cn(
						'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
						tagVariant === 'required'
							? 'bg-primary/10 text-primary'
							: 'bg-muted text-muted-foreground'
					)}
				>
					{tag}
				</span>
			)}
		</div>
	);
}

function FieldHint({ children }: { children: React.ReactNode }) {
	return <p className='text-[11px] text-muted-foreground'>{children}</p>;
}

export function AddNodeModal({ onNodeAdded, trigger }: AddNodeModalProps) {
	const [open, setOpen] = React.useState(false);
	const [formData, setFormData] = React.useState<AddNodeFormData>(INITIAL_FORM_STATE);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [submitStatus, setSubmitStatus] = React.useState<{
		type: 'success' | 'error' | null;
		message: string;
	}>({ type: null, message: '' });

	const handleInputChange = (field: keyof AddNodeFormData, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		if (submitStatus.type === 'error') {
			setSubmitStatus({ type: null, message: '' });
		}
	};

	const validateForm = (): { isValid: boolean; errors: string[] } => {
		const errors: string[] = [];
		if (!formData.nodeAddress.trim()) errors.push('Node address is required');
		if (!formData.port.trim() || isNaN(Number(formData.port))) errors.push('Valid port number is required');
		if (!formData.peerId.trim()) errors.push('Peer ID is required');
		if (!formData.nodeLabel.trim()) errors.push('Node label is required');
		if (!formData.maxQubits.trim() || isNaN(Number(formData.maxQubits))) errors.push('Valid max qubits number is required');
		return { isValid: errors.length === 0, errors };
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const validation = validateForm();
		if (!validation.isValid) {
			setSubmitStatus({ type: 'error', message: validation.errors[0] });
			return;
		}

		setIsSubmitting(true);
		setSubmitStatus({ type: null, message: '' });

		try {
			const response = await fetch('/api/v1/peers/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					address: formData.nodeAddress,
					port: Number(formData.port),
					peer_id: formData.peerId,
					label: formData.nodeLabel,
					services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
					max_qubits: Number(formData.maxQubits),
					description: formData.description
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to connect peer node');
			}

			await response.json();

			setSubmitStatus({
				type: 'success',
				message: 'Node successfully added to the network!'
			});

			if (onNodeAdded) onNodeAdded(formData);

			setTimeout(() => {
				setOpen(false);
				setFormData(INITIAL_FORM_STATE);
				setSubmitStatus({ type: null, message: '' });
			}, 2000);
		} catch (error) {
			setSubmitStatus({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to add node. Please check your configuration.'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setOpen(false);
		setFormData(INITIAL_FORM_STATE);
		setSubmitStatus({ type: null, message: '' });
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button size='sm'>
						<PlusIcon className='size-4' />
						Add Node
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='max-w-2xl p-0 gap-0 overflow-hidden'>
				{/* Branded header strip */}
				<div className='relative px-6 pt-6 pb-5 border-b border-border bg-muted/40'>
					<DialogHeader>
						<div className='flex items-center gap-3.5 pr-8'>
							<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15'>
								<NetworkIcon className='size-5 text-primary' />
							</div>
							<div>
								<DialogTitle className='text-base font-semibold'>
									Add Node to Network
								</DialogTitle>
								<p className='mt-0.5 text-xs text-muted-foreground'>
									Connect your peer to the distributed quantum mesh
								</p>
							</div>
						</div>
					</DialogHeader>
				</div>

				{/* Scrollable form body */}
				<form onSubmit={handleSubmit}>
					<div className='max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6'>

						{/* Status banner */}
						{submitStatus.type && (
							<div
								className={cn(
									'flex items-start gap-3 rounded-xl px-4 py-3 text-sm',
									submitStatus.type === 'success'
										? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/40'
										: 'bg-destructive/8 text-destructive ring-1 ring-destructive/20'
								)}
							>
								{submitStatus.type === 'success' ? (
									<CheckCircleIcon className='size-4 mt-0.5 shrink-0' />
								) : (
									<AlertCircleIcon className='size-4 mt-0.5 shrink-0' />
								)}
								<span>{submitStatus.message}</span>
							</div>
						)}

						{/* Section: Connection Details */}
						<div className='space-y-3.5'>
							<SectionHeader icon={WifiIcon} label='Connection Details' tag='Required' tagVariant='required' />
							<div className='rounded-xl ring-1 ring-border bg-card p-4 space-y-4'>
								<div className='grid gap-4 sm:grid-cols-[1fr_7rem]'>
									<div className='space-y-1.5'>
										<Label htmlFor='nodeAddress' className='text-xs font-medium'>
											Node Address
										</Label>
										<Input
											id='nodeAddress'
											placeholder='192.168.1.100 or node.example.com'
											value={formData.nodeAddress}
											onChange={e => handleInputChange('nodeAddress', e.target.value)}
											required
										/>
									</div>
									<div className='space-y-1.5'>
										<Label htmlFor='port' className='text-xs font-medium'>
											Port
										</Label>
										<Input
											id='port'
											type='number'
											placeholder='8080'
											value={formData.port}
											onChange={e => handleInputChange('port', e.target.value)}
											required
										/>
									</div>
								</div>

								<div className='space-y-1.5'>
									<Label htmlFor='peerId' className='text-xs font-medium'>
										Peer ID
									</Label>
									<Input
										id='peerId'
										placeholder='QmXxXxXxXxXxXxXxXx… or 12D3KooW…'
										value={formData.peerId}
										onChange={e => handleInputChange('peerId', e.target.value)}
										className='font-mono text-xs'
										required
									/>
									<FieldHint>Your libp2p peer ID — starts with Qm or 12D3</FieldHint>
								</div>
							</div>
						</div>

						{/* Section: Identity */}
						<div className='space-y-3.5'>
							<SectionHeader icon={TagIcon} label='Identity' tag='Required' tagVariant='required' />
							<div className='rounded-xl ring-1 ring-border bg-card p-4'>
								<div className='space-y-1.5'>
									<Label htmlFor='nodeLabel' className='text-xs font-medium'>
										Node Label
									</Label>
									<Input
										id='nodeLabel'
										placeholder='My Quantum Node'
										value={formData.nodeLabel}
										onChange={e => handleInputChange('nodeLabel', e.target.value)}
										required
									/>
									<FieldHint>A human-readable name shown in the network mesh view</FieldHint>
								</div>
							</div>
						</div>

						{/* Section: Capabilities */}
						<div className='space-y-3.5'>
							<SectionHeader icon={CpuIcon} label='Capabilities' tag='Optional' tagVariant='optional' />
							<div className='rounded-xl ring-1 ring-border bg-card p-4 space-y-4'>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='space-y-1.5'>
										<Label htmlFor='services' className='text-xs font-medium'>
											Services Offered
										</Label>
										<Input
											id='services'
											placeholder='bell_pair, teleport, swap'
											value={formData.services}
											onChange={e => handleInputChange('services', e.target.value)}
										/>
										<FieldHint>Comma-separated quantum gate services</FieldHint>
									</div>
									<div className='space-y-1.5'>
										<Label htmlFor='maxQubits' className='text-xs font-medium'>
											Max Qubits
										</Label>
										<Input
											id='maxQubits'
											type='number'
											min={1}
											max={128}
											placeholder='4'
											value={formData.maxQubits}
											onChange={e => handleInputChange('maxQubits', e.target.value)}
										/>
										<FieldHint>Maximum qubit capacity of this node</FieldHint>
									</div>
								</div>

								<div className='space-y-1.5'>
									<Label htmlFor='description' className='text-xs font-medium'>
										Description
										<span className='ml-1 text-muted-foreground font-normal'>(optional)</span>
									</Label>
									<Textarea
										id='description'
										placeholder='Additional context about this node…'
										value={formData.description}
										onChange={e => handleInputChange('description', e.target.value)}
										rows={2}
										className='resize-none text-xs'
									/>
								</div>
							</div>
						</div>

						{/* Requirements checklist */}
						<div className='rounded-xl bg-muted/50 ring-1 ring-border px-4 py-3 space-y-1.5'>
							<p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
								<ServerIcon className='size-3' />
								Before connecting
							</p>
							<ul className='space-y-1'>
								{[
									'Node must be running and reachable at the specified address',
									'Firewall rules must allow incoming connections on the port',
									'Peer ID must match your node\'s actual libp2p identity',
									'Connection may take 10–30 seconds to establish',
								].map((req) => (
									<li key={req} className='flex items-start gap-2 text-[11px] text-muted-foreground'>
										<span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
										{req}
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Footer */}
					<div className='px-6 py-4 border-t border-border bg-muted/20'>
						<DialogFooter className='gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={handleCancel}
								disabled={isSubmitting}
								className='min-w-[80px]'
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isSubmitting || submitStatus.type === 'success'}
								className='min-w-[120px]'
							>
								{isSubmitting ? (
									<>
										<Loader2Icon className='size-4 animate-spin' />
										Connecting…
									</>
								) : submitStatus.type === 'success' ? (
									<>
										<CheckCircleIcon className='size-4' />
										Connected
									</>
								) : (
									<>
										<NetworkIcon className='size-4' />
										Add Node
									</>
								)}
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
