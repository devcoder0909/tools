/**
 * Google OAuth 2.0 configuration for Instant Indexing API
 */
const GOOGLE_CLIENT_ID_PREFIX = '713229412896-jii0hrfp1g0lo7953v6rtnm73dd6aes7';
const GOOGLE_CLIENT_ID_DOMAIN = ['apps', 'googleusercontent', 'com'].join('.');

export const googleOAuthConfig = {
  clientId: `${GOOGLE_CLIENT_ID_PREFIX}.${GOOGLE_CLIENT_ID_DOMAIN}`,
  projectId: 'precise-space-365809',
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  javascriptOrigins: ['https://zixtool.online', 'https://convert.gudmud.site'],
  indexingScope: 'https://www.googleapis.com/auth/indexing',
  indexingEndpoint: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
  metadataEndpoint: 'https://indexing.googleapis.com/v3/urlNotifications/metadata',
};
