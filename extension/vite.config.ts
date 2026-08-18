import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * Vite config for Chrome Extension Manifest V3.
 *
 * Build produces:
 *   dist/
 *     manifest.json          (from public/)
 *     icons/                 (from public/)
 *     popup/popup.html       (entry)
 *     popup/popup.js         (chunk)
 *     options/options.html   (entry)
 *     options/options.js     (chunk)
 *     background/service-worker.js
 *     content/content-script.js
 *     assets/                (shared chunks + CSS)
 */

function fixHtmlPaths() {
  return {
    name: 'fix-html-paths',
    closeBundle() {
      // Move HTML files from dist/src/popup/ to dist/popup/
      const fixes = [
        {
          src: 'dist/src/popup/popup.html',
          dest: 'dist/popup/popup.html',
          scriptFix: (html: string) => html
            .replace(/src=["'][^"']*index\.tsx["']/g, 'src="./popup.js"')
            .replace(/href=["'][^"']*popup\.css["']/g, '')
        },
        {
          src: 'dist/src/options/options.html',
          dest: 'dist/options/options.html',
          scriptFix: (html: string) => html
            .replace(/src=["'][^"']*index\.tsx["']/g, 'src="./options.js"')
            .replace(/href=["'][^"']*popup\.css["']/g, '')
        },
      ];

      for (const fix of fixes) {
        try {
          let content = readFileSync(fix.src, 'utf-8');
          // Fix absolute paths to relative for Chrome Extension compatibility
          content = content.replace(/src="\/popup\//g, 'src="./');
          content = content.replace(/src="\/options\//g, 'src="./');
          content = content.replace(/href="\/assets\//g, 'href="../assets/');
          content = content.replace(/src="\/assets\//g, 'src="../assets/');
          content = fix.scriptFix(content);
          writeFileSync(fix.dest, content, 'utf-8');
          console.log(`✓ Wrote ${fix.dest}`);
        } catch (e) {
          // File may already be correct
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), fixHtmlPaths()],
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,

    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          const map: Record<string, string> = {
            background: 'background/service-worker.js',
            content: 'content/content-script.js',
            popup: 'popup/popup.js',
            options: 'options/options.js',
          };
          return map[chunk.name] || `assets/[name].js`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // esbuild minification (built-in, no extra dep)
    minify: 'esbuild',
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
