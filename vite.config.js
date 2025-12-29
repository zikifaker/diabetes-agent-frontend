import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    svgLoader(svgLoaderConfig),
  ],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

const svgLoaderConfig = {
  defaultImport: 'component',
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            cleanupIDs: false,
          },
        },
      },
    ],
  },
}