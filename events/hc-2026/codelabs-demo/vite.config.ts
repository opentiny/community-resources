/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { TinyVueResolver } from '@opentiny/unplugin-tiny-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [TinyVueResolver]
    }),
    AutoImport({
      resolvers: [TinyVueResolver]
    })
  ],
  server: {
    port: 8089,
    host: true
  },
  resolve: {
    mainFields: ['browser', 'module', 'jsnext:main', 'jsnext', 'main']
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    fsModuleCache: true,
    server: {
      deps: {
        inline: [/@opentiny\//]
      }
    }
  }
})
