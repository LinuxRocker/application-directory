import * as client from 'openid-client';
import { config } from './env';
import logger from '../utils/logger';

let oidcConfig: client.Configuration | null = null;

export async function initializeOidcClient(): Promise<client.Configuration> {
  try {
    logger.info('Discovering OIDC issuer...', {
      issuer: config.keycloak.issuer,
    });

    const issuerUrl = new URL(config.keycloak.issuer);

    oidcConfig = await client.discovery(
      issuerUrl,
      config.keycloak.clientId,
      {
        client_secret: config.keycloak.clientSecret,
        redirect_uri: config.keycloak.redirectUri,
      },
      client.ClientSecretPost(config.keycloak.clientSecret)
    );

    logger.info('OIDC issuer discovered', {
      issuer: oidcConfig.serverMetadata().issuer,
      authorizationEndpoint: oidcConfig.serverMetadata().authorization_endpoint,
      tokenEndpoint: oidcConfig.serverMetadata().token_endpoint,
    });

    logger.info('OIDC client initialized successfully');

    return oidcConfig;
  } catch (error: any) {
    logger.error('Failed to initialize OIDC client', {
      error: error?.message || error,
      errorName: error?.name,
      errorCode: error?.code,
      errorStack: error?.stack,
      issuerUrl: config.keycloak.issuer,
    });
    throw error;
  }
}

export function getOidcClient(): client.Configuration {
  if (!oidcConfig) {
    throw new Error('OIDC client not initialized. Call initializeOidcClient() first.');
  }
  return oidcConfig;
}

export async function generatePKCE() {
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return client.randomState();
}
