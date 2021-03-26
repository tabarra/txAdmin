/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'txAdmin Docs',
  tagline: 'Remotely Manage & Monitor your GTA5 FiveM Server',
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
        alt: 'txAdmin Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/',
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
              label: 'Getting Started',
              to: 'docs/',
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
};
