// https://vitepress.dev/guide/custom-theme
import { h, onMounted } from 'vue';
import 'shiki-magic-move/style.css';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import DefaultThemeLayout from './Layout.vue';
import 'aos/dist/aos.css';
import 'virtual:uno.css';
import './style/index.css';
import { Content } from './components/Content';
// import aos from 'aos';
// aos.init();

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
  enhanceApp({ app, router, siteData }) {
    app.component('Content', Content);
  },
} satisfies Theme;
