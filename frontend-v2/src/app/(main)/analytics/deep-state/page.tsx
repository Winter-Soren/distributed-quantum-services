'use client';

import { BlochSphere } from '@/components/bloch-sphere';

export default function DeepStatePage() {
	return (
		<div className='flex flex-col gap-6 p-6'>
			<div className='flex flex-col gap-2'>
				<h1 className='text-2xl font-semibold tracking-tight'>Deep State Analysis</h1>
				<p className='text-sm text-muted-foreground'>
					Quantum state visualization and deep analysis using Bloch sphere representation
				</p>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
				<BlochSphere vector={[1, 0, 0]} label='|0⟩ State' />
				<BlochSphere vector={[0, 1, 0]} label='|+⟩ State' />
				<BlochSphere vector={[0, 0, 1]} label='|+i⟩ State' />
			</div>
		</div>
	);
}
