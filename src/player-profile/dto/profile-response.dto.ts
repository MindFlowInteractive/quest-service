export class ProfileResponseDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  bannerTheme?: string;
  bio?: string;
  badges?: string[];
  isProfilePublic: boolean;
  // Other fields as needed, but filtered in service
}