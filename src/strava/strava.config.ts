
/**
 * Strava OAuth configuration.
 * 
 * To use this module, register your application at https://www.strava.com/settings/api
 * and set the Authorization Callback Domain to your app's domain.
 * 
 * Replace CLIENT_ID and CLIENT_SECRET with your own values.
 */
export const STRAVA_CONFIG = {
  clientId: '16293',
  clientSecret: '1b1a9f1f2e554dab2dfdaf1e5182f406bb5a2291',
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
