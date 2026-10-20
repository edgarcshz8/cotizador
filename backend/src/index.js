import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/index.js';
import servicesRouter from './routes/services.js';
import quotesRouter from './routes/quotes.js';
import settingsRouter from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/services', servicesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/settings', settingsRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
