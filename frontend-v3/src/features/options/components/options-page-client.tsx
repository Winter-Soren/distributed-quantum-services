"use client";

import { OptionsPricingForm } from "./options-pricing-form";

export function OptionsPageClient() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-normal text-foreground">Options Pricing</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Submit a quantum options pricing job. Results use IQAE for quadratic
        speedup over classical Monte Carlo.
      </p>
      <OptionsPricingForm />
    </div>
  );
}
