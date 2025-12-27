import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
    idToken: string;
    tokenExpiry: number;
    userGroups: string[];
    userInfo: {
      sub: string;
      email?: string;
      name?: string;
      preferred_username?: string;
      given_name?: string;
      family_name?: string;
    };
    codeVerifier?: string;
    state?: string;
  }
}

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}
