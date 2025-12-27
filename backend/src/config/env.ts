import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),

  KEYCLOAK_ISSUER: Joi.string().uri().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
  KEYCLOAK_REDIRECT_URI: Joi.string().uri().required(),

  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().default(86400000),
  SESSION_SECURE: Joi.boolean().default(false),
  SESSION_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  REDIS_URL: Joi.string().uri().optional(),
  USE_REDIS_SESSIONS: Joi.boolean().default(false),

  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  CSRF_ENABLED: Joi.boolean().default(false),

  CONFIG_PATH: Joi.string().default('./config/apps.yaml'),
  CONFIG_WATCH: Joi.boolean().default(true),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  logLevel: envVars.LOG_LEVEL as string,

  keycloak: {
    issuer: envVars.KEYCLOAK_ISSUER as string,
    clientId: envVars.KEYCLOAK_CLIENT_ID as string,
    clientSecret: envVars.KEYCLOAK_CLIENT_SECRET as string,
    redirectUri: envVars.KEYCLOAK_REDIRECT_URI as string,
  },

  session: {
    secret: envVars.SESSION_SECRET as string,
    maxAge: envVars.SESSION_MAX_AGE as number,
    secure: envVars.SESSION_SECURE as boolean,
    sameSite: envVars.SESSION_SAME_SITE as 'lax' | 'strict' | 'none',
  },

  redis: {
    url: envVars.REDIS_URL as string | undefined,
    useRedis: envVars.USE_REDIS_SESSIONS as boolean,
  },

  security: {
    corsOrigin: envVars.CORS_ORIGIN as string,
    csrfEnabled: envVars.CSRF_ENABLED as boolean,
  },

  app: {
    configPath: path.resolve(envVars.CONFIG_PATH as string),
    configWatch: envVars.CONFIG_WATCH as boolean,
  },
};
