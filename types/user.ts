export interface User {
  name: string;
  userId: number;
  email: string;
  profilePic: string;
  isGoogle: boolean;
  accessToken: string;
  refreshToken: string;
  isAdmin: boolean;
  isMechanic: boolean;
  biography: string;
  accessTokenExpiresAt: Date; // Buffered expiration for proactive refresh
  refreshTokenExpiresAt: Date; // Buffered expiration
}