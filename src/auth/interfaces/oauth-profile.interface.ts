export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}