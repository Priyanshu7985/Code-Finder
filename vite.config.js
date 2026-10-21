import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Monaco is lazy-loaded into its own chunk and is large by nature.
    chunkSizeWarningLimit: 4000,
  },
})
