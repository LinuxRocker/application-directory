import { Router, Request, Response } from 'express';
import { oidcService } from '../services/oidc.service';
import { authRateLimiter } from '../middleware/security';
import { optionalAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.get('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { url, codeVerifier, state } = await oidcService.getAuthorizationUrl();

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    // Save session before redirect to ensure state is persisted
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session', { error: err });
        return res.status(500).json({ error: 'Failed to initiate login' });
      }

      logger.info('Redirecting to Keycloak for authentication');
      return res.redirect(url);
    });
    return; // Explicitly return after async callback
  } catch (error) {
    logger.error('Error in login route', { error });
    return res.status(500).json({ error: 'Failed to initiate login' });
  }
});

router.get('/callback', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description, iss, session_state } = req.query;

    // Check for errors from Keycloak
    if (error) {
      logger.error('Keycloak returned error in callback', {
        error,
        error_description,
      });
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=${error}`);
    }

    if (!code || typeof code !== 'string') {
      logger.warn('No authorization code in callback');
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    if (!state || state !== req.session.state) {
      logger.warn('State mismatch in callback', {
        receivedState: state,
        sessionState: req.session.state,
      });
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    if (!req.session.codeVerifier) {
      logger.warn('No code verifier in session');
      return res.status(400).json({ error: 'No code verifier in session' });
    }

    logger.info('Processing callback with valid state and code verifier', {
      hasIss: !!iss,
      hasSessionState: !!session_state,
    });

    const { tokenSet, userInfo, groups } = await oidcService.handleCallback(
      req.query,
      req.session.codeVerifier
    );

    req.session.userId = userInfo.sub;
    req.session.accessToken = tokenSet.access_token;
    req.session.refreshToken = tokenSet.refresh_token || '';
    req.session.idToken = tokenSet.id_token || '';
    req.session.tokenExpiry = tokenSet.expires_at || 0;
    req.session.userGroups = groups;
    req.session.userInfo = userInfo;

    delete req.session.codeVerifier;
    delete req.session.state;

    logger.info('User authenticated successfully', {
      userId: userInfo.sub,
      groupsCount: groups.length,
    });

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/`);
  } catch (error) {
    logger.error('Error in callback route', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

router.get('/logout', async (req: Request, res: Response) => {
  try {
    const idToken = req.session.idToken;
    const userId = req.session.userId;

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Failed to destroy session', { error: err });
      }
    });
    res.clearCookie('homelab.sid');

    // Redirect to Keycloak logout
    if (idToken) {
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      const postLogoutRedirectUri = `${frontendUrl}/login`;
      const logoutUrl = oidcService.getLogoutUrl(idToken, postLogoutRedirectUri);

      logger.info('Redirecting to Keycloak logout', {
        userId,
        postLogoutRedirectUri,
      });

      return res.redirect(logoutUrl);
    } else {
      logger.warn('No ID token found in session, redirecting to login directly');
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login`);
    }
  } catch (error) {
    logger.error('Error in logout route', { error });
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login`);
  }
});

router.get('/status', optionalAuth, (req: Request, res: Response) => {
  const isAuthenticated = !!(
    req.session.accessToken && req.session.tokenExpiry
  );

  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated ? req.session.userInfo : null,
  });
});

export default router;
