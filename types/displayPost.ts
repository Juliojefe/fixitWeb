// used when displaying a post
export interface DisplayPostType {
  postId: number,
  authorId: number;
  description: string;
  createdBy: string;
  createdByProfilePicUrl: string;
  createdAt: string; // ISO date string
  likeCount: number;
  imageUrls: string[];
  hasLiked: boolean;
  hasSaved: boolean;
}