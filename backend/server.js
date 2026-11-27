import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import apiRouter from './routes/api.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Set JWT_SECRET to at least 32 characters before starting in production.');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : ['http://127.0.0.1:5173', 'http://localhost:5173'],
}));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));
app.use('/api', apiRouter);
app.use((error, _request, response, _next) => {
  if (error?.type === 'entity.parse.failed') {
    response.status(400).json({ error: 'Request body contains invalid JSON.' });
    return;
  }
  if (error?.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large.' });
    return;
  }
  if (error?.name === 'ValidationError') {
    response.status(400).json({ error: 'Some of the submitted information is invalid.' });
    return;
  }
  if (error?.code === 11000) {
    response.status(409).json({ error: 'An account with that phone number already exists.' });
    return;
  }
  console.error('API request failed:', error);
  response.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('Connected to MongoDB.');
  } else {
    console.warn('MongoDB is not configured. Using demo-only in-memory data.');
  }
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => console.info(`Apna Khata API listening on http://${host}:${port}`));
}

start().catch((error) => {
  console.error('Unable to start the API:', error);
  process.exitCode = 1;
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
