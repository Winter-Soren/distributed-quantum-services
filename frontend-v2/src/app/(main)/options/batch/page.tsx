import { Suspense } from 'react';

import { BatchBenchmarkClient } from '@/components/options/batch-benchmark-client';

export const metadata = { title: 'Options Batch Benchmark' };

export default function BatchBenchmarkPage() {
	return (
		<Suspense>
			<BatchBenchmarkClient />
		</Suspense>
	);
}
