
import { STRAVA_CONFIG, STRAVA_STORAGE_KEYS } from './strava.config';

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
  async exchangeToken(code: string): Promise<TokenResponse> {
    const response = await fetch(STRAVA_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CONFIG.clientId,
        client_secret: STRAVA_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || `Token exchange failed: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    this.storeTokens(data);
    return data;
  }

  /**
   * Refresh the access token using the stored refresh token.
   */
  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem(STRAVA_STORAGE_KEYS.refreshToken);
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(STRAVA_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CONFIG.clientId,
        client_secret: STRAVA_CONFIG.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data: TokenResponse = await response.json();
    this.storeTokens(data);
  }

  /**
   * Check if the user is authenticated and tokens are valid.
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STRAVA_STORAGE_KEYS.accessToken);
    const expiresAt = localStorage.getItem(STRAVA_STORAGE_KEYS.expiresAt);
    if (!token || !expiresAt) return false;
    return Date.now() / 1000 < Number(expiresAt);
  }

  /**
   * Get a valid access token, refreshing if necessary.
   */
  async getValidToken(): Promise<string> {
    const expiresAt = Number(localStorage.getItem(STRAVA_STORAGE_KEYS.expiresAt) || 0);
    if (Date.now() / 1000 >= expiresAt) {
      await this.refreshToken();
    }
    const token = localStorage.getItem(STRAVA_STORAGE_KEYS.accessToken);
    if (!token) throw new Error('No access token');
    return token;
  }

  /**
   * Fetch authenticated athlete info.
   */
  async getAthlete(): Promise<StravaAthlete> {
    const token = await this.getValidToken();
    const response = await fetch(`${STRAVA_CONFIG.apiBase}athlete`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch athlete: ${response.status}`);
    return response.json();
  }

  /**
   * Fetch athlete activities with pagination.
   */
  async getActivities(page = 1, perPage = 20): Promise<StravaActivity[]> {
    const token = await this.getValidToken();
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    const response = await fetch(`${STRAVA_CONFIG.apiBase}athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch activities: ${response.status}`);
    return response.json();
  }

  /**
   * Get cached athlete from localStorage.
   */
  getCachedAthlete(): StravaAthlete | null {
    const data = localStorage.getItem(STRAVA_STORAGE_KEYS.athlete);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Logout: clear all stored tokens and data.
   */
  logout(): void {
    this.clearTokens();
    localStorage.removeItem(STRAVA_STORAGE_KEYS.activitiesCache);
  }

  private storeTokens(data: TokenResponse): void {
    localStorage.setItem(STRAVA_STORAGE_KEYS.accessToken, data.access_token);
    localStorage.setItem(STRAVA_STORAGE_KEYS.refreshToken, data.refresh_token);
    localStorage.setItem(STRAVA_STORAGE_KEYS.expiresAt, String(data.expires_at));
    if (data.athlete) {
      localStorage.setItem(STRAVA_STORAGE_KEYS.athlete, JSON.stringify(data.athlete));
    }
  }

  private clearTokens(): void {
    localStorage.removeItem(STRAVA_STORAGE_KEYS.accessToken);
    localStorage.removeItem(STRAVA_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STRAVA_STORAGE_KEYS.expiresAt);
    localStorage.removeItem(STRAVA_STORAGE_KEYS.athlete);
  }
}

export const stravaService = new StravaService();
