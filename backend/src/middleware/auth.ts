import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { oidcService } from '../services/oidc.service';
import logger from '../utils/logger';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.session.accessToken || !req.session.tokenExpiry) {
      logger.debug('No session found', { path: req.path });
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const isValid = authService.validateToken(
      req.session.accessToken,
      req.session.tokenExpiry
    );

    if (!isValid) {
      logger.debug('Invalid or expired token', { path: req.path });
      return res.status(401).json({ error: 'Token expired or invalid' });
    }

    if (
      authService.isTokenExpiringSoon(req.session.tokenExpiry) &&
      req.session.refreshToken
    ) {
      try {
        logger.info('Token expiring soon, attempting refresh');

        const newTokenSet = await oidcService.refreshAccessToken(
          req.session.refreshToken
        );

        req.session.accessToken = newTokenSet.access_token;
        req.session.refreshToken = newTokenSet.refresh_token || req.session.refreshToken;
        req.session.tokenExpiry = newTokenSet.expires_at || 0;

        if (newTokenSet.id_token) {
          req.session.idToken = newTokenSet.id_token;
        }

        logger.info('Token refreshed successfully');
      } catch (error) {
        logger.error('Failed to refresh token', { error });
        req.session.destroy((err) => {
          if (err) logger.error('Failed to destroy session', { error: err });
        });
        return res.status(401).json({ error: 'Session expired' });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in auth middleware', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.accessToken && req.session.tokenExpiry) {
    const isValid = authService.validateToken(
      req.session.accessToken,
      req.session.tokenExpiry
    );

    if (!isValid) {
      req.session.destroy((err) => {
        if (err) logger.error('Failed to destroy session', { error: err });
      });
    }
  }

  next();
}
