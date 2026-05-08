import { Suspense } from 'react';

import { RiskAnalyticsClient } from '@/components/risk/risk-analytics-client';

export const metadata = { title: 'Quantum Risk Engine — VaR / CVaR' };

export default function RiskPage() {
  return (
    <Suspense>
      <RiskAnalyticsClient />
    </Suspense>
  );
}
