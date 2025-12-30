import * as client from 'openid-client';
import { getOidcClient, generatePKCE, generateState } from '../config/oidc';
import { TokenSet, UserInfo } from '../types';
import logger from '../utils/logger';

export class OidcService {
  async getAuthorizationUrl(): Promise<{ url: string; codeVerifier: string; state: string }> {
    const config = getOidcClient();
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = generateState();

    const redirectUri = config.clientMetadata().redirect_uri;
    if (!redirectUri) {
      throw new Error('Redirect URI not configured');
    }

    const url = client.buildAuthorizationUrl(config, {
      redirect_uri: String(redirectUri),
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    logger.info('Generated authorization URL', { state });

    return { url: url.toString(), codeVerifier, state };
  }

  async handleCallback(
    params: any,
    codeVerifier: string
  ): Promise<{ tokenSet: TokenSet; userInfo: UserInfo; groups: string[] }> {
    try {
      const config = getOidcClient();

      logger.info('Exchanging authorization code for tokens', {
        redirectUri: config.clientMetadata().redirect_uri,
        issuer: config.serverMetadata().issuer,
        hasIss: !!params.iss,
        issValue: params.iss,
        hasCode: !!params.code,
        hasState: !!params.state,
        hasSessionState: !!params.session_state,
      });

      // Build the current URL from params
      const redirectUri = config.clientMetadata().redirect_uri!;
      const currentUrl = new URL(redirectUri);
      Object.entries(params).forEach(([key, value]) => {
        currentUrl.searchParams.set(key, String(value));
      });

      const tokenSet = await client.authorizationCodeGrant(
        config,
        currentUrl,
        {
          pkceCodeVerifier: codeVerifier,
          expectedState: params.state,
        }
      );

      logger.info('Successfully obtained tokens');

      const userInfo = await this.getUserInfo(tokenSet.access_token!);
      const groups = this.extractGroups(tokenSet);

      return {
        tokenSet: this.convertTokenSet(tokenSet),
        userInfo,
        groups,
      };
    } catch (error) {
      logger.error('Failed to handle OIDC callback', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: (error as any)?.name,
        errorParams: (error as any)?.params,
        errorResponse: (error as any)?.response,
      });
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const config = getOidcClient();
      const userInfo = await client.fetchUserInfo(config, accessToken, client.skipSubjectCheck);

      logger.debug('Retrieved user info', { sub: userInfo.sub });

      return userInfo as UserInfo;
    } catch (error) {
      logger.error('Failed to fetch user info', { error });
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    try {
      const config = getOidcClient();

      logger.info('Refreshing access token');

      const tokenSet = await client.refreshTokenGrant(config, refreshToken);

      logger.info('Successfully refreshed access token');

      return this.convertTokenSet(tokenSet);
    } catch (error) {
      logger.error('Failed to refresh access token', { error });
      throw error;
    }
  }

  getLogoutUrl(idToken: string, postLogoutRedirectUri: string): string {
    try {
      const config = getOidcClient();
      const endSessionEndpoint = config.serverMetadata().end_session_endpoint;

      if (!endSessionEndpoint) {
        logger.warn('No end_session_endpoint found in OIDC metadata');
        return postLogoutRedirectUri;
      }

      const logoutUrl = new URL(endSessionEndpoint);
      logoutUrl.searchParams.set('id_token_hint', idToken);
      logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);

      logger.info('Generated logout URL', {
        endpoint: endSessionEndpoint,
        postLogoutRedirectUri,
      });

      return logoutUrl.toString();
    } catch (error) {
      logger.error('Failed to generate logout URL', { error });
      return postLogoutRedirectUri;
    }
  }

  async revokeToken(_token: string): Promise<void> {
    try {
      logger.info('Revoking token');

      // Token revocation is not directly supported in openid-client v6
      // Tokens will naturally expire based on their configured lifetime
      logger.warn('Token revocation is not implemented in openid-client v6 - token will expire naturally');
    } catch (error) {
      logger.error('Failed to revoke token', { error });
    }
  }

  extractGroups(tokenSet: client.TokenEndpointResponse & { claims(): client.IDToken | undefined }): string[] {
    try {
      const claims = tokenSet.claims();
      const groups = claims?.groups as string[] | undefined;

      if (Array.isArray(groups)) {
        logger.debug('Extracted groups from token', { count: groups.length });
        return groups;
      }

      logger.warn('No groups found in token claims');
      return [];
    } catch (error) {
      logger.error('Failed to extract groups from token', { error });
      return [];
    }
  }

  private convertTokenSet(tokenSet: client.TokenEndpointResponse): TokenSet {
    return {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token,
      id_token: tokenSet.id_token,
      expires_at: tokenSet.expires_in ? Math.floor(Date.now() / 1000) + tokenSet.expires_in : undefined,
      token_type: tokenSet.token_type,
      scope: tokenSet.scope,
    };
  }
}

export const oidcService = new OidcService();
