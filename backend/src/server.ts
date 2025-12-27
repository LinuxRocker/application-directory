import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { config, initializeOidcClient } from './config';
import { configService } from './services/config.service';
import {
  createSessionStore,
  createSessionMiddleware,
  closeRedisConnection,
} from './middleware/session';
import {
  helmetMiddleware,
  corsMiddleware,
  compressionMiddleware,
  apiRateLimiter,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error';
import routes from './routes';
import logger from './utils/logger';

const app = express();

// Generate self-signed certificate for dev if it doesn't exist
const certDir = path.join(process.cwd(), '.certs');
const certPath = path.join(certDir, 'cert.pem');
const keyPath = path.join(certDir, 'key.pem');

function ensureDevCertificates() {
  if (config.env === 'production') return null;

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    // Generate self-signed cert using Node's built-in crypto
    const { execSync } = require('child_process');
    try {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' ` +
        `-keyout "${keyPath}" -out "${certPath}" -days 365`,
        { stdio: 'ignore' }
      );
      logger.info('Generated self-signed certificate for HTTPS');
    } catch (error) {
      logger.warn('Could not generate certificate, falling back to HTTP');
      return null;
    }
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

const httpsOptions = ensureDevCertificates();

async function startServer() {
  try {
    logger.info('Starting server initialization...');

    await initializeOidcClient();
    logger.info('OIDC client initialized');

    await configService.loadConfig();
    logger.info('Application config loaded');

    const sessionStore = await createSessionStore();
    const sessionMiddleware = createSessionMiddleware(sessionStore);

    // Trust proxy - trust only the first proxy (Traefik)
    app.set('trust proxy', 1);

    app.use(helmetMiddleware);
    app.use(corsMiddleware);
    app.use(compressionMiddleware);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(sessionMiddleware);

    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
      });
    });

    app.use('/api', apiRateLimiter, routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    const server = httpsOptions
      ? https.createServer(httpsOptions, app).listen(config.port, '0.0.0.0', () => {
          logger.info(`HTTPS server is running`, {
            port: config.port,
            host: '0.0.0.0',
            environment: config.env,
            protocol: 'https',
          });
        })
      : app.listen(config.port, '0.0.0.0', () => {
          logger.info(`HTTP server is running`, {
            port: config.port,
            host: '0.0.0.0',
            environment: config.env,
            protocol: 'http',
          });
        });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await configService.close();
        await closeRedisConnection();

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });
  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error?.message || error,
      errorName: error?.name,
      errorCode: error?.code,
      errorStack: error?.stack,
    });
    process.exit(1);
  }
}

startServer();
