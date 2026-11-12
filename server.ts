import express, { Request, Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const PYTHON_BACKEND_PORT = 5000;

// Spawn Python Flask backend as the single authority for database, business logic & analytics
let pythonProcess: ChildProcess | null = null;

function startFlaskBackend() {
  const backendScript = path.resolve(__dirname, 'backend', 'app.py');
  console.log(`[Chips MRP] Spawning Python Flask backend (${backendScript})...`);

  pythonProcess = spawn('py', [backendScript], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      FLASK_HOST: '127.0.0.1',
      FLASK_PORT: String(PYTHON_BACKEND_PORT),
      PYTHONUNBUFFERED: '1',
    },
  });

  pythonProcess.on('error', (err) => {
    console.error('[Chips MRP] Failed to start Python Flask backend:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[Chips MRP] Python Flask backend exited with code ${code}, signal ${signal}`);
  });
}

// Clean termination handling
process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit(0);
});

// Start Flask backend immediately
startFlaskBackend();

// Reverse proxy /api requests to the Python Flask backend on port 5000
app.use('/api', (req: Request, res: Response) => {
  const targetPath = `/api${req.url}`;
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: PYTHON_BACKEND_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${PYTHON_BACKEND_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Chips MRP Proxy Error] ${req.method} ${targetPath} ->`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Python Flask backend is initializing or unreachable on port 5000.',
        detail: err.message,
      });
    }
  });

  req.pipe(proxyReq, { end: true });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chips MRP] Vite Development & Proxy Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Chips MRP] Failed to start server:', err);
  process.exit(1);
});
