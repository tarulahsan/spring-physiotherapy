import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const config = {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'staging'
    }
  }

  return config
})
