import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      // ⚠️ THIS FIXES THE "CANNOT FIND MODULE" ERROR
      external: ['better-sqlite3', 'electron'], 
    },
  },
  resolve: {
    // Helps locate the correct files
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});