import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { MessageCircleIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const hasAISearch = Boolean(process.env.OPENROUTER_API_KEY);

  return (
    <DocsLayout
      tree={source.getPageTree()}
      sidebar={{
        defaultOpenLevel: 1,
      }}
      {...baseOptions()}
    >
      {hasAISearch ? (
        <AISearch>
          <AISearchPanel />
          <AISearchTrigger
            position="float"
            className={cn(
              buttonVariants({
                variant: 'secondary',
                className: 'rounded-2xl text-fd-muted-foreground',
              }),
            )}
          >
            <MessageCircleIcon className="size-4.5" />
            Ask AI
          </AISearchTrigger>
        </AISearch>
      ) : null}
      {children}
    </DocsLayout>
  );
}
