import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', 'VITE_')
  if (mode === 'production' && !environment.VITE_API_BASE_URL?.trim()) {
    throw new Error(
      'VITE_API_BASE_URL must be set to the deployed backend API URL before building for production.'
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 3000, strictPort: true },
  }
})