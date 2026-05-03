"use client";

export function WorkspaceSwitcher() {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-label="Switch workspace"
    >
      <span className="text-xs font-semibold">QG</span>
    </button>
  );
}
