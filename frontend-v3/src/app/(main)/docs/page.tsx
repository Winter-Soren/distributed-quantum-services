import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { Code2, Map, Database, Layers, FileText } from "lucide-react";

const DOC_SECTIONS = [
  { title: "API Reference", href: ROUTES.DOCS_API, icon: Code2, desc: "All backend endpoints, request/response schemas, and auth headers." },
  { title: "Roadmap", href: ROUTES.DOCS_ROADMAP, icon: Map, desc: "Upcoming features, milestones, and the H2 Autonomous Labs vision." },
  { title: "Schemas", href: ROUTES.DOCS_SCHEMAS, icon: Database, desc: "TypeScript types and Zod schemas for all platform data models." },
  { title: "Examples", href: ROUTES.DOCS_EXAMPLES, icon: Layers, desc: "Code examples for circuit submission, options pricing, and risk analysis." },
  { title: "Playbooks", href: ROUTES.DOCS_PLAYBOOKS, icon: FileText, desc: "Operational runbooks for common tasks and incident response." },
];

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Documentation</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Platform guides, API reference, and operational playbooks.
        </p>
      </div>
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {DOC_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full cursor-pointer border-hairline transition-colors hover:border-border-strong hover:bg-surface-soft">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center gap-2">
                  <s.icon size={16} className="text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
