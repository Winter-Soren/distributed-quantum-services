'use client';

import { memo, useEffect, useRef, useState } from 'react';
import VisualizerEntryPoint from '@qctrl/visualizer';

type BlochSphereProps = {
	/** Bloch vector [x, y, z] in range -1 to 1 */
	vector: [number, number, number];
	/** Optional label (e.g. qubit name) */
	label?: string;
	/** Size in pixels; omit to use `var(--ds-bloch-preview-size)` from globals */
	size?: number;
	className?: string;
};

function previewBoxStyle(size: number | undefined) {
	return typeof size === 'number'
		? { width: size, height: size, minWidth: size, minHeight: size }
		: {
				width: 'var(--ds-bloch-preview-size)',
				height: 'var(--ds-bloch-preview-size)',
				minWidth: 'var(--ds-bloch-preview-size)',
				minHeight: 'var(--ds-bloch-preview-size)'
			};
}

export const BlochSphere = memo(function BlochSphere({
	vector,
	label,
	size,
	className
}: BlochSphereProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<{ key: string; message: string } | null>(null);
	const vectorKey = vector.join(',');
	const activeError = error?.key === vectorKey ? error.message : null;

	useEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}
		let isActive = true;

		el.innerHTML = '';

		const [x, y, z] = vector;
		const visualizationData = {
			data: {
				segmentIndexes: [0],
				vectors: [[x, y, z]]
			}
		};

		try {
			const viz = new VisualizerEntryPoint({
				wrapper: el,
				visualizationData,
				instantGates: true,
				progress: 1,
				useExternalProgress: true
			});

			return () => {
				isActive = false;
				viz.cleanup();
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to render Bloch sphere';

			queueMicrotask(() => {
				if (!isActive) {
					return;
				}

				setError({
					key: vectorKey,
					message
				});
			});

			return () => {
				isActive = false;
			};
		}
	}, [vector, vectorKey]);

	return (
		<div className={className}>
			{label ? <div className='mb-2 text-sm font-medium text-foreground/80'>{label}</div> : null}
			{activeError ? (
				<div
					className='flex items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-sm text-muted-foreground dark:bg-muted/25'
					style={previewBoxStyle(size)}
				>
					{activeError}
				</div>
			) : (
				<div
					ref={containerRef}
					className='rounded-2xl border border-border/80 bg-muted/40 dark:bg-muted/25'
					style={previewBoxStyle(size)}
				/>
			)}
		</div>
	);
});
