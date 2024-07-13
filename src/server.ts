import 'express-async-errors';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import cron from 'node-cron';
import express from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import mongoose from 'mongoose';
import morgan from 'morgan';
import admin from 'firebase-admin';

import V1Router from './v1/routes';
import { dispatchShipment } from './v1/utils/functions';

dotenv.config();

const app = express();

const jetLogger = logger;

app.use(express.json());
app.use(cors());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(helmet());
}

app.use('/api/v1', V1Router);

cron.schedule('* * * * *', () => {
  dispatchShipment(
    () => {},
    (error) => {
      console.error(error);
    },
  );
});

mongoose
  .connect(process.env.MONGO_DB_URL || '')
  .then(async () => {
    jetLogger.info('Connected to the database');
  })
  .catch((err) => {
    jetLogger.err('Connection error', err);
    process.exit();
  });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    privateKey: process.env.PRIVATE_KEY,
    clientEmail: process.env.CLIENT_EMAIL,
  }),
});

export default app;
