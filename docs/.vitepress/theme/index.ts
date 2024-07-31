// https://vitepress.dev/guide/custom-theme
// https://mermaid.js.org/intro/
import { h, onMounted } from 'vue';
import 'shiki-magic-move/style.css';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import DefaultThemeLayout from './Layout.vue';
import 'aos/dist/aos.css';
import 'virtual:uno.css';
import './style/index.scss';
import { Content } from './components/Content';
import vitepressNprogress from 'vitepress-plugin-nprogress';
import 'vitepress-plugin-nprogress/lib/css/index.css';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import '@shikijs/vitepress-twoslash/style.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    // @ts-expect-error
    if (!import.meta.env.SSR) {
      import('aos').then(({ default: aos }) => {
        aos.init();
      });
    }

    return h(DefaultThemeLayout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp(ctx) {
    const { app, router, siteData } = ctx;
    vitepressNprogress(ctx);
    app.component('Content', Content);
    app.use(TwoslashFloatingVue);
  },
} satisfies Theme;
