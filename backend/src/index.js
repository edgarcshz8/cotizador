import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/index.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import servicesRouter from './routes/services.js';
import quotesRouter from './routes/quotes.js';
import settingsRouter from './routes/settings.js';
import clientsRouter from './routes/clients.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rutas públicas
app.use('/api/auth', authRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Rutas protegidas
app.use('/api/services', requireAuth, servicesRouter);
app.use('/api/quotes',   requireAuth, quotesRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/clients',  requireAuth, clientsRouter);

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
