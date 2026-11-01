import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Agent } from 'node:https';
import tls from 'node:tls';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'NEXA_');
  const target = process.env.NEXA_API_URL || env.NEXA_API_URL || 'https://localhost:44388';
  const certificatePath = resolve(process.cwd(), process.env.NEXA_CA_CERT || env.NEXA_CA_CERT || '.certificates/nexaback.local.pem');
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(target).hostname);
  const localCertificate = mode === 'development' && localHost && existsSync(certificatePath)
    ? [readFileSync(certificatePath)] : [];
  // Node también debe confiar en los certificados de desarrollo instalados en Windows.
  // Se mantiene la validación TLS; no se utiliza secure:false.
  const httpsAgent = new Agent({
    ca: [...tls.rootCertificates, ...(tls.getCACertificates?.('system') || []), ...localCertificate],
  });
  return {
    build: { outDir: 'dist/client' },
    optimizeDeps: { include: ['react', 'react-dom/client'] },
    server: {
      host: '127.0.0.1',
      allowedHosts: ['terminal.local'],
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          agent: target.startsWith('https:') ? httpsAgent : undefined,
          configure(proxy) {
            proxy.on('error', (_error, _request, response) => {
              if (!response || typeof response.writeHead !== 'function' || response.headersSent) return;
              response.writeHead(502, { 'Content-Type': 'application/problem+json; charset=utf-8' });
              response.end(JSON.stringify({
                title: 'NexaBack no disponible',
                status: 502,
                detail: `No se pudo conectar con NexaBack en ${target}. Iniciá el proyecto NexaBack o revisá NEXA_API_URL.`,
              }));
            });
          },
        },
      },
      warmup: { clientFiles: ['./src/main.tsx'] },
    },
    plugins: [react(), tailwindcss()],
  };
});
