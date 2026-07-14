import {defineConfig} from 'vite';

export default defineConfig( {
  build: {
    lib: {
      entry: 'src/main.ts',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      // This Fixes The "CANNOT FIND MODULE" Error
      external: ['better-sqlite3', 'electron'], 
    },
  },
  resolve: {
    // Helps to locate the correct files
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
