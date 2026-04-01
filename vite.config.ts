import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Actions에서 빌드될 때(GitHub Pages)만 서브경로를 사용하고, 그 외(Vercel 등)는 루트를 사용합니다.
  base: process.env.GITHUB_ACTIONS ? '/room-prep-dashboard/' : '/',
  plugins: [react(), tailwindcss()],
})
