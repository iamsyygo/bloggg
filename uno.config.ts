import { defineConfig, presetUno, presetAttributify } from 'unocss';
import presetIcons from '@unocss/preset-icons';

// unocss animation https://animate.zyob.top/

export default defineConfig({
  // ...unocss options
  presets: [
    presetUno({
      // ...preset options
    }),
    presetAttributify({}),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        width: '1em',
        height: '1em',
        'vertical-align': '-0.15em',
      },
    }),
  ],
});
