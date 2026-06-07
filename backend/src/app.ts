import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/error';
import customersRouter from './routes/customers';
import appointmentsRouter from './routes/appointments';
import waitlistRouter from './routes/waitlist';
import recoveryJobsRouter from './routes/recoveryJobs';
import analyticsRouter from './routes/analytics';
import settingsRouter from './routes/settings';
import personasRouter from './routes/personas';
import webhooksRouter from './routes/webhooks';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/customers',     customersRouter);
app.use('/api/appointments',  appointmentsRouter);
app.use('/api/waitlist',      waitlistRouter);
app.use('/api/recovery-jobs', recoveryJobsRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/settings',      settingsRouter);
app.use('/api/personas',      personasRouter);
app.use('/api/webhooks',      webhooksRouter);

app.use(errorHandler);
