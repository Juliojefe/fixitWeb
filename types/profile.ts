export type ProfileTabKey = 'posts' | 'liked' | 'saved';

export interface ProfilePublic {
  name?: string;
  profilePicUrl?: string;
  profilePic?: string;
  followerIds?: number[];
  followingIds?: number[];
  ownedPostIds?: number[];
  likedPostIds?: number[];
  followerCount?: number;
  followingCount?: number;
  isAdmin?: boolean;
  admin?: boolean;
  isMechanic?: boolean;
  mechanic?: boolean;
  biography?: string;
  businessAddress?: string;
  businessLat?: number;
  businessLon?: number;
  viewerFollowsUser?: boolean;
}

export interface ProfilePrivate extends ProfilePublic {
  savedPostIds?: number[];
  chatIds?: number[];
}

export interface UserNameAndPfp {
  userId: number;
  name: string;
  profilePic: string;
}

export interface SavedBusinessLocation {
  address: string;
  lat: number;
  lon: number;
}

export interface ProfileViewTab {
  key: ProfileTabKey;
  label: string;
  count: number;
}
