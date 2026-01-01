import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/swe': {
        target: 'https://questionnaire-148920.appspot.com',
        changeOrigin: true,
        secure: false,      
      }
    }
  }
})