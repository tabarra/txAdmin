/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'txAdmin Docs',
  tagline: 'txAdmin is a full featured web panel to Manage & Monitor your FiveM Server remotely, in use by over five thousand servers worldwide at any given time.',
  url: 'https://docs.txadm.in',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'tabarra', // Usually your GitHub org/user name.
  projectName: 'txAdmin', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'txAdmin Docs',
      logo: {
        alt: 'Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          to: 'docs/building',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/tabarra/txAdmin/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Main Docs',
              to: 'docs/building',
            },
            {
              label: 'Basement',
              to: 'docs/feature-graveyard',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/FBPPm5bhvN',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/tabarra/txAdmin/',
            },
          ],
        },
      ],
      copyright: `This project is licensed under the MIT License <br> Copyright © 2019-${new Date().getFullYear()} André Tabarra.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/tabarra/txAdmin/tree/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        fromExtensions: ['html'],
        redirects: [
          {
            to: '/docs/building', // string
            from: ['/docs/'], // string | string[]
          },
        ],
      },
    ],
  ],
};
