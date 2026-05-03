import { AutoBreadcrumbs } from "./auto-breadcrumbs";

export function SiteHeader() {
  return (
    <header className="flex h-12 items-center border-b px-4">
      <AutoBreadcrumbs />
    </header>
  );
}
