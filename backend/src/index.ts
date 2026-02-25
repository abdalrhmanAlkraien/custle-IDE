import express, { type Request, type Response } from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import workspaceRouter from './routes/workspace';
import filesRouter from './routes/files';
import modelRouter from './routes/model';
import agentRouter from './routes/agent';
import gitRouter from './routes/git';
import githubRouter from './routes/github';
import completionRouter from './routes/completion';
import { initWebSocketServer } from './websocket/wsServer';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/workspace', workspaceRouter);
app.use('/api/files', filesRouter);
app.use('/api/model', modelRouter);
app.use('/api/agent', agentRouter);
app.use('/api/git', gitRouter);
app.use('/api/github', githubRouter);
app.use('/api/completion', completionRouter);

// Initialize WebSocket server
initWebSocketServer(server);

// Start server
server.listen(config.PORT, () => {
  console.log(`Custle IDE backend running on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
