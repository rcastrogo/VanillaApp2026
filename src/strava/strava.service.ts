
import { STRAVA_CONFIG, STRAVA_STORAGE_KEYS } from './strava.config';

import { RQ, createApiRequest } from '@/core/services/http-client.service';
import type { WrappedFetchResponse } from '@/core/services/http-client.utils';
import { storage } from '@/core/storageUtil';

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  kudos_count: number;
  comment_count: number;
  achievement_count: number;
  map?: { summary_polyline: string };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: StravaAthlete;
}

class StravaService {

  /**
   * Returns the URL to redirect the user to for Strava OAuth authorization.
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: STRAVA_CONFIG.clientId,
      redirect_uri: STRAVA_CONFIG.redirectUri,
      response_type: 'code',
      scope: STRAVA_CONFIG.scope,
      approval_prompt: 'auto',
    });
    return `${STRAVA_CONFIG.authorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens.
   */
  async exchangeToken(code: string): Promise<WrappedFetchResponse<TokenResponse> | string> {
    const result = await createApiRequest<TokenResponse>()
      .postTo(STRAVA_CONFIG.tokenUrl)
      .useLog('Strava token exchange')
      .usePayload({
        client_id: STRAVA_CONFIG.clientId,
        client_secret: STRAVA_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
      })
      .invoke();
    if (typeof result !== 'string') {
      this.storeTokens(result.data);
    }
    return result;
  }

  /**
   * Refresh the access token using the stored refresh token.
   */
  async refreshToken(): Promise<void> {
    const refreshToken = storage.readValue(STRAVA_STORAGE_KEYS.refreshToken, '');
    if (!refreshToken) throw new Error('No refresh token available');

    const result = await createApiRequest<TokenResponse>()
      .postTo(STRAVA_CONFIG.tokenUrl)
      .useLog('Strava token refresh')
      .usePayload({
        client_id: STRAVA_CONFIG.clientId,
        client_secret: STRAVA_CONFIG.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
      .invoke();

    if (typeof result === 'string') {
      this.clearTokens();
      throw new Error(`Token refresh failed: ${result}`);
    }

    const data = result.data;
    this.storeTokens(data);
  }

  /**
   * Check if the user is authenticated and tokens are valid.
   */
  isAuthenticated(): boolean {
    const token = storage.readValue(STRAVA_STORAGE_KEYS.accessToken, '');
    const expiresAt = storage.readValue(STRAVA_STORAGE_KEYS.expiresAt, 0);
    if (!token || !expiresAt) return false;
    return Date.now() / 1000 < Number(expiresAt);
  }

  /**
   * Get a valid access token, refreshing if necessary.
   */
  async getValidToken(): Promise<string> {
    const expiresAt = Number(storage.readValue(STRAVA_STORAGE_KEYS.expiresAt, 0));
    if (Date.now() / 1000 >= expiresAt) {
      await this.refreshToken();
    }
    const token = storage.readValue(STRAVA_STORAGE_KEYS.accessToken, '');
    if (!token) throw new Error('No access token');
    return token;
  }

  /**
   * Fetch authenticated athlete info.
   */
  async getAthlete(): Promise<WrappedFetchResponse<StravaAthlete> | string> {
    const token = await this.getValidToken();
    return await createApiRequest<StravaAthlete>()
      .useBase(STRAVA_CONFIG.apiBase)
      .useToken(token)
      .useLog('Fetching Strava athlete')
      .getFrom('athlete')
      .invoke();
  }

  /**
   * Fetch athlete activities with pagination.
   */
  async getActivities(page = 1, perPage = 3): Promise<WrappedFetchResponse<StravaActivity[]> | string> {
    const token = await this.getValidToken();
    return await createApiRequest<StravaActivity[]>()
      .useBase(STRAVA_CONFIG.apiBase)
      .useToken(token)
      .useLog('Fetching Strava activities')
      .getFrom(`athlete/activities?page=${page}&per_page=${perPage}`)
      .invoke();
  }

  /**
   * Get cached athlete from localStorage.
   */
  getCachedAthlete(): StravaAthlete | null {
    return storage.readValue<StravaAthlete | null>(STRAVA_STORAGE_KEYS.athlete, null);
  }

  /**
   * Logout: clear all stored tokens and data.
   */
  logout(): void {
    const token = storage.readValue(STRAVA_STORAGE_KEYS.accessToken, '');
    const payload = new URLSearchParams({ access_token: token });
    if (token) {    
      RQ.create()
        .withHeader('Content-Type', 'application/x-www-form-urlencoded')
        .usePayload(payload)
        .postTo(STRAVA_CONFIG.deauthorizeUrl)
        .invoke();
    }
    this.clearTokens();
    storage.removeValue(STRAVA_STORAGE_KEYS.activitiesCache);
  }

  private storeTokens(data: TokenResponse): void {
    storage
      .writeValue(STRAVA_STORAGE_KEYS.accessToken, data.access_token)
      .writeValue(STRAVA_STORAGE_KEYS.refreshToken, data.refresh_token)
      .writeValue(STRAVA_STORAGE_KEYS.expiresAt, data.expires_at);
    if (data.athlete)
      storage.writeValue(STRAVA_STORAGE_KEYS.athlete, data.athlete);
  }

  private clearTokens(): void {
    storage
      .removeValue(STRAVA_STORAGE_KEYS.accessToken)
      .removeValue(STRAVA_STORAGE_KEYS.refreshToken)
      .removeValue(STRAVA_STORAGE_KEYS.expiresAt)
      .removeValue(STRAVA_STORAGE_KEYS.athlete);
  }


}

export const stravaService = new StravaService();
