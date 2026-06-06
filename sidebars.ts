import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/first-run',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: true,
      items: [
        'core-concepts/json-ld-first',
        'core-concepts/pods-and-resources',
        'core-concepts/content-negotiation',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: true,
      items: [
        'features/overview',
        'features/ldp-crud',
        'features/patching',
        'features/access-control',
        'features/authentication',
        'features/account-management',
        'features/lws',
        'features/websocket-notifications',
        'features/multi-user-pods',
        'features/quotas-and-invites',
        'features/inbox-and-spam-mitigation',
        'features/live-reload',
        'features/mashlib-ui',
        'features/git-integration',
        'features/app-install',
        'features/mcp',
        'features/charlie',
        'features/activitypub',
        'features/nostr',
        'features/e2ee',
        'features/payments',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/overview',
        'guides/deploy-production',
        'guides/git-on-solid',
        'guides/git-push-nostr',
        'guides/jss-on-android',
        'guides/solid-apps',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/cli',
        'reference/configuration',
        'reference/api',
        'reference/pod-structure',
      ],
    },
  ],
};

export default sidebars;
