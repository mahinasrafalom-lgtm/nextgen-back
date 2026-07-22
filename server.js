import 'dotenv/config';
import http from 'http';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { env, validateEnvironment } from './config/env.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { notFound, sanitizePayload } from './middleware/securityMiddleware.js';
import { initSocket } from './socket.js';

validateEnvironment();
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not permitted by CORS policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'অনেক বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।' } }));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizePayload);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', environment: env.nodeEnv, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString() }));
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(notFound);

app.use((err, _req, res, _next) => {
  if (!env.isProduction) console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'ফাইলের আকার অনুমোদিত সীমার চেয়ে বড়।' });
  if (err.name === 'MulterError') return res.status(400).json({ message: 'ফাইল আপলোডে সমস্যা হয়েছে।' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'সঠিক রিসোর্স আইডি দিন।' });
  const status = err.status || (err.message === 'Origin is not permitted by CORS policy.' ? 403 : 500);
  res.status(status).json({ message: status >= 500 && env.isProduction ? 'সার্ভারে একটি সমস্যা হয়েছে।' : err.message || 'সার্ভারে একটি সমস্যা হয়েছে।' });
});

async function start() {
  await connectDatabase();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () => console.log(`API + realtime ready at http://localhost:${env.port} (${env.nodeEnv})`));
  const shutdown = (signal) => server.close(async () => { console.log(`${signal} received. Closing gracefully.`); await mongoose.connection.close(); process.exit(0); });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => { console.error(error.message); process.exit(1); });

export default app;
