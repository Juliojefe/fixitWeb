export interface comment {
  commentId: number;
  authorId: number;
  createdBy: string;
  createdByProfilePicUrl: string;
  content: string;
  imageUrls: string[];
  createdAt: string; // ISO date string
}