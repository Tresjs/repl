import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace'
import UnoCSS from 'unocss/vite'
import { presetUno, presetIcons, presetWebFonts, transformerDirectives } from 'unocss'
import { lightGreen, yellow, gray, bold } from 'kolorist'
import banner from 'vite-plugin-banner'
import { templateCompilerOptions } from '@tresjs/core'
import pkg from './package.json'

console.log(`${lightGreen('▲')} ${gray('■')} ${yellow('⛫')} ${bold('Tres/repl')} v${pkg.version}`)

export default defineConfig({
  plugins: [
    vue(templateCompilerOptions),
    banner({
      content: `/**\n * name: ${pkg.name}\n * version: v${
        pkg.version
      }\n * (c) ${new Date().getFullYear()}\n * description: ${pkg.description}\n * author: ${pkg.author}\n */`,
    }),
    UnoCSS({
      /* options */
      presets: [
        presetUno(),
        presetIcons({
          scale: 1.2,
          warn: true,
          extraProperties: {
            display: 'inline-block',
            'vertical-align': 'middle',
            // ...
          },
        }),

        presetWebFonts({
          fonts: {
            sans: 'Inter',
          },
        }),
      ],
      transformers: [transformerDirectives()],
    }),
  ],
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
  build: {
    commonjsOptions: {
      ignore: ['typescript'],
    },
  },
  worker: {
    format: 'es',
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      }),
    ],
  },
})
