import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'JSS Docs',
  tagline: 'A minimal, fast, JSON-LD native Solid server',
  favicon: 'img/favicon.ico',

  url: 'https://javascriptsolidserver.github.io',
  baseUrl: '/docs/',
  organizationName: 'JavaScriptSolidServer',
  projectName: 'docs',

  onBrokenLinks: 'warn',

  future: {
    v4: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/JavaScriptSolidServer/docs/tree/main/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',

    metadata: [
      {name: 'keywords', content: 'solid, server, json-ld, nostr, decentralized, git, linked data'},
      {name: 'description', content: 'Documentation for JavaScript Solid Server - a minimal, fast, JSON-LD native Solid server'},
      {property: 'og:type', content: 'website'},
    ],

    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },

    announcementBar: {
      id: 'contribute',
      content: 'Help improve these docs! <a href="https://github.com/JavaScriptSolidServer/docs">Contribute on GitHub</a>',
      backgroundColor: '#7C4DFF',
      textColor: '#fff',
      isCloseable: true,
    },

    navbar: {
      title: 'JSS Docs',
      logo: {
        alt: 'JSS Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/getting-started/introduction',
          label: 'Getting Started',
          position: 'left',
        },
        {
          to: '/features/overview',
          label: 'Features',
          position: 'left',
        },
        {
          to: '/guides/overview',
          label: 'Guides',
          position: 'left',
        },
        {
          to: '/reference/cli',
          label: 'Reference',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Ecosystem',
          position: 'left',
          items: [
            {label: 'JSS Server', href: 'https://github.com/JavaScriptSolidServer/JavaScriptSolidServer'},
            {label: 'git-credential-nostr', href: 'https://github.com/JavaScriptSolidServer/git-credential-nostr'},
            {type: 'html', value: '<hr style="margin: 0.5rem 0;">'},
            {label: 'Solid Project', href: 'https://solidproject.org'},
            {label: 'Nostr', href: 'https://nostr.com'},
          ],
        },
        {
          href: 'https://github.com/JavaScriptSolidServer/JavaScriptSolidServer',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Getting Started', to: '/getting-started/introduction'},
            {label: 'Features', to: '/features/overview'},
            {label: 'Guides', to: '/guides/overview'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'CLI Commands', to: '/reference/cli'},
            {label: 'Configuration', to: '/reference/configuration'},
            {label: 'API', to: '/reference/api'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub', href: 'https://github.com/JavaScriptSolidServer'},
            {label: 'Solid Project', href: 'https://solidproject.org'},
            {label: 'Nostr', href: 'https://nostr.com'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} JavaScript Solid Server. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'turtle'],
    },

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
