import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: "../",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mengo-logo.png'],
      manifest: {
        name: 'Mengo Connect Hub',
        short_name: 'Mengo Hub',
        description: 'Mengo Senior School Student Council Platform',
        theme_color: '#6e112d', // primary red
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/mengo-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/mengo-logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/mengo-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
