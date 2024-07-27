import { defineConfig, UserConfig } from 'vitepress';
import unocss from 'unocss/vite';
import { withMagicMove } from 'vitepress-plugin-magic-move';
import { fileURLToPath, URL } from 'node:url';
// https://vitepress.dev/reference/site-config

const config = defineConfig({
  title: 'Web Design...',
  description: '...',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap',
        rel: 'stylesheet',
      },
    ],
  ],
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '🏠', link: '/' },
      { text: '📖', link: '/blog' },
    ],
    docFooter: {
      prev: 'cd ..',
    },
    // sidebar: [
    //   {
    //     text: 'Examples',
    //     items: [
    //       { text: 'Markdown Examples', link: '' },
    //       { text: 'Runtime API Examples', link: '' },
    //     ],
    //   },
    // ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/iamsyygo' }],
    returnToTopLabel: '飞回顶部～',
    outline: {
      label: '导航指南',
    },
  },
  vite: {
    plugins: [unocss()],
    server: {
      host: true,
    },
    resolve: {
      alias: [
        {
          find: /^.*\/VPNavBar\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/VPNavBar.vue', import.meta.url)),
        },
        {
          find: /^.*\/VPSwitchAppearance\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/VPSwitchAppearance.vue', import.meta.url)),
        },
        {
          find: /^.*\/VPHome\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/VPHome.vue', import.meta.url)),
        },
        {
          find: /^.*\/VPContent\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/VPContent.vue', import.meta.url)),
        },
        {
          find: /^.*\/VPDoc\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/VPDoc.vue', import.meta.url)),
        },
        {
          find: /^.*\/Content\.js$/,
          replacement: fileURLToPath(new URL('./theme/components/Content.js', import.meta.url)),
        },
      ],
    },
  },
});

// @ts-expect-error
export default withMagicMove(config);
