// used when displaying a post
export interface DisplayPostType {
  postId: number,
  authorId: number | null;
  description: string;
  createdBy: string | null;
  createdByProfilePicUrl: string | null;
  createdAt: string; // ISO date string
  likeCount: number;
  imageUrls: string[];
  hasLiked: boolean;
  hasSaved: boolean;
  followingAuthor: boolean;
  authorIsMechanic: boolean;
}