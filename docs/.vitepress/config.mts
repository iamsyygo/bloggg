import { defineConfig, UserConfig } from 'vitepress';
import unocss from 'unocss/vite';
import { withMagicMove } from 'vitepress-plugin-magic-move';
import { fileURLToPath, URL } from 'node:url';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { blogMetaPlugin } from './plugins/blogMetaPlugin';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.resolve(__dirname, '../blog');

// https://vitepress.dev/reference/site-config

const config = defineConfig({
  title: 'Web Design...',
  description: '...',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    codeTransformers: [transformerTwoslash()],
  },
  themeConfig: {
    logo: '/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '<div class="i-fluent-emoji:growing-heart text-20px v-middle"></div>', link: '/' },
      { text: '<div class="i-fluent-emoji:green-book text-20px v-middle"></div>', link: '/blog' },
      { text: '<div class="i-fluent-emoji:abacus text-20px v-middle"></div>', link: '/planning' },
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
    returnToTopLabel: '🚀 Take Me to the Top!!!',
    // lastUpdated: {
    //   text: '最后更新',
    // },
    outline: {
      label: '导航指南',
    },
    // search: {
    //   provider: 'local',
    // },
  },
  vite: {
    plugins: [unocss(), blogMetaPlugin(blogDir)],
    server: {
      port: 3080,
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

export default withMagicMove(config);
