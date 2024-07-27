import { defineConfig, presetUno, presetAttributify } from 'unocss'
import presetIcons from '@unocss/preset-icons'
export default defineConfig({
  // ...unocss options
  presets: [
    presetUno({
      // ...preset options
    }),
    presetAttributify({}),
    presetIcons(),
  ],
})
