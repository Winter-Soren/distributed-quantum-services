import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'Winter-Soren',
  repo: 'pylibp2p-nodes-as-quantum-gates',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    themeSwitch: {
      mode: 'light-dark-system',
    },
    nav: {
      title: 'Distributed Quantum Services',
      transparentMode: 'top',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        type: 'main',
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        type: 'main',
        text: 'Quickstart',
        url: '/docs/getting-started/quickstart',
      },
      {
        type: 'main',
        text: 'API',
        url: '/docs/reference/api-reference',
      },
      {
        type: 'main',
        text: 'Contribute',
        url: '/docs/contributing/contributor-guide',
      },
    ],
  };
}
