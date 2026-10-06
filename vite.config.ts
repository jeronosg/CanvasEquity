import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from the custom domain root (see public/CNAME)
export default defineConfig({ base: '/', plugins: [react(), tailwindcss()] })
