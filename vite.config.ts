import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import checker from 'vite-plugin-checker'
import path from 'path'
import fs from 'fs'

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;

function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'docs'); // Adjust this if your outDir is different
      const indexPath = path.join(outDir, 'index.html');
      const notFoundPath = path.join(outDir, '404.html');

      // Copy index.html to 404.html
      fs.copyFileSync(indexPath, notFoundPath);
    },
  };
}


function reactVirtualized() {
  return {
    name: 'my:react-virtualized',
    configResolved() {
      const file = require
        .resolve('react-virtualized')
        .replace(
          path.join('dist', 'commonjs', 'index.js'),
          path.join('dist', 'es', 'WindowScroller', 'utils', 'onScroll.js')
        );
      const code = fs.readFileSync(file, 'utf-8');
      const modified = code.replace(WRONG_CODE, '');
      fs.writeFileSync(file, modified);
    },
  };
}

// https://vitejs.dev/config/
// monacoEditorPlugin({
//   forceBuildCDN: false,
// }), reactVirtualized(), checker({
//   typescript: false
// }), 
export default defineConfig({
  base: '/DataWink/',
  plugins: [react(), copyIndexTo404()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api/mimo': {
        target: 'https://token-plan-cn.xiaomimimo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mimo/, '/anthropic'),
      }
    }
  },
  build: {
    outDir: 'docs'
  }
})
