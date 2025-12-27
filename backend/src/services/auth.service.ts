import logger from '../utils/logger';

export class AuthService {
  isTokenExpired(expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt;
  }

  isTokenExpiringSoon(expiresAt: number, thresholdSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    return timeUntilExpiry < thresholdSeconds;
  }

  validateToken(accessToken: string, expiresAt: number): boolean {
    if (!accessToken) {
      logger.debug('Token validation failed: no access token');
      return false;
    }

    if (this.isTokenExpired(expiresAt)) {
      logger.debug('Token validation failed: token expired');
      return false;
    }

    return true;
  }
}

export const authService = new AuthService();
