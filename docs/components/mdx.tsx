import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import type { MDXComponents } from 'mdx/types';
import {
  CheckItem,
  Checklist,
  Definition,
  DefinitionGrid,
  LayerCard,
  LayerGrid,
  SignalCard,
  SignalGrid,
  Spotlight,
  Timeline,
  TimelineItem,
} from './docs-kit';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    Spotlight,
    SignalGrid,
    SignalCard,
    Timeline,
    TimelineItem,
    DefinitionGrid,
    Definition,
    LayerGrid,
    LayerCard,
    Checklist,
    CheckItem,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
