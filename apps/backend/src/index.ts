import dotenv from 'dotenv';
import path from 'path';

// Force override environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import { buildApp } from './app.js';

const port = Number(process.env.PORT_BACKEND) || 4000;
const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
