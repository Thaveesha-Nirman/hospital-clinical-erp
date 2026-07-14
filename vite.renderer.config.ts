import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig(async () => {
  // 🪄 MAGIC: Dynamically import the React plugin to avoid "ESM require" errors
  const { default: react } = await import('@vitejs/plugin-react');
  
  return {
    plugins: [react()],
  };
});