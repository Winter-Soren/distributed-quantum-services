import { Suspense } from 'react';

import { FinancialAnalyticsClient } from '@/components/financial/financial-analytics-client';

export default function FinancePage() {
	return (
		<Suspense
			fallback={
				<div className='flex flex-col items-center justify-center gap-3 px-4 py-24 text-muted-foreground'>
					<p className='text-sm'>Loading financial analytics…</p>
				</div>
			}
		>
			<FinancialAnalyticsClient />
		</Suspense>
	);
}
