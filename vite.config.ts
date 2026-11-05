import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          /bot_database\.db.*/,
          /bot_memory\.db.*/,
          /.*\.db-journal/,
          /.*\.db-wal/,
          /.*\.db-shm/,
          /.*\.sqlite.*/,
          /.*\.log/,
          '**/bot_database.db*',
          '**/bot_memory.db*',
          '**/*-journal',
          '**/*.db-journal',
          '**/*.db-wal',
          '**/*.db-shm',
          '**/*.db*',
          '**/*.sqlite*',
          '**/storage_downloads/**',
          '**/*.log',
          '**/config.json',
          '**/sources.json',
          '**/state.json',
          '**/session_forwarder*',
          '**/__pycache__/**',
          '**/*.pyc',
        ],
      },
    },
  };
});
