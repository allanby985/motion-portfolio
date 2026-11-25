import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages 部署在子路径时，用 VITE_BASE=/仓库名/ 构建
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
