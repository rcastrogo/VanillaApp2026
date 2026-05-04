
/**
 * Strava OAuth configuration.
 * 
 * To use this module, register your application at https://www.strava.com/settings/api
 * and set the Authorization Callback Domain to your app's domain.
 * 
 * Client ID and Secret are loaded from environment variables (set in .env):
 *   VITE_STRAVA_CLIENT_ID
 *   VITE_STRAVA_CLIENT_SECRET
 */
export const STRAVA_CONFIG = {
  clientId: import.meta.env.VITE_STRAVA_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_STRAVA_CLIENT_SECRET || '',
  authorizeUrl: 'https://www.strava.com/oauth/authorize',
  tokenUrl: 'https://www.strava.com/oauth/token',
  apiBase: 'https://www.strava.com/api/v3/',
  redirectUri: `${window.location.origin}/strava/auth`,
  scope: 'read,activity:read_all,profile:read_all',
};

export const STRAVA_STORAGE_KEYS = {
  accessToken: 'strava_access_token',
  refreshToken: 'strava_refresh_token',
  expiresAt: 'strava_expires_at',
  athlete: 'strava_athlete',
  activitiesCache: 'strava_activities_cache',
};
