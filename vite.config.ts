import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8000,
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
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // Increase limit to 5MB to handle larger bundles
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
      },
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
  build: {
    // rollupOptions: {
    //   output: {
    //     manualChunks(id) {
    //       if (id.includes('node_modules')) {
    //         // Group core React libraries together to avoid circularities between them
    //         if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@remix-run')) {
    //           return 'vendor-react';
    //         }
    //         // Group heavy editor libraries
    //         if (id.includes('@blocknote') || id.includes('@mantine') || id.includes('@emotion')) {
    //           return 'vendor-editor';
    //         }
    //         // Group visualization libraries
    //         if (id.includes('recharts') || id.includes('d3')) {
    //            return 'vendor-charts';
    //         }
    //         // Group UI/Icon libraries
    //         if (id.includes('lucide-react') || id.includes('@radix-ui')) {
    //           return 'vendor-ui';
    //         }
    //         // Group document processing libraries
    //         if (id.includes('xlsx') || id.includes('docx') || id.includes('jspdf') || id.includes('html2canvas')) {
    //           return 'vendor-docs';
    //         }
    //         // Group animation libraries
    //         if (id.includes('framer-motion') || id.includes('@react-spring') || id.includes('@use-gesture')) {
    //           return 'vendor-animation';
    //         }
    //         // Everything else in node_modules goes to vendor
    //         return 'vendor';
    //       }
    //     },
    //   },
    // },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
