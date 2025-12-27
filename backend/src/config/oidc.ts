import { Issuer, Client, generators } from 'openid-client';
import { config } from './env';
import logger from '../utils/logger';

let oidcClient: Client | null = null;

export async function initializeOidcClient(): Promise<Client> {
  try {
    logger.info('Discovering OIDC issuer...', {
      issuer: config.keycloak.issuer,
    });

    const issuer = await Issuer.discover(config.keycloak.issuer);

    logger.info('OIDC issuer discovered', {
      issuer: issuer.issuer,
      authorizationEndpoint: issuer.metadata.authorization_endpoint,
      tokenEndpoint: issuer.metadata.token_endpoint,
    });

    oidcClient = new issuer.Client({
      client_id: config.keycloak.clientId,
      client_secret: config.keycloak.clientSecret,
      redirect_uris: [config.keycloak.redirectUri],
      response_types: ['code'],
    });

    logger.info('OIDC client initialized successfully');

    return oidcClient;
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

export function getOidcClient(): Client {
  if (!oidcClient) {
    throw new Error('OIDC client not initialized. Call initializeOidcClient() first.');
  }
  return oidcClient;
}

export function generatePKCE() {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return generators.state();
}
