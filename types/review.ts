export interface ReviewStats {
  averageRating: number | null;
  reviewCount: number;
}

export interface ReviewItem {
  reviewId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerProfilePicUrl: string;
  mechanicId: number;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
  isCurrentUsersReview: boolean;
}

export interface ReviewPageResponse {
  content: ReviewItem[];
  last: boolean;
  number?: number;
  totalElements?: number;
  totalPages?: number;
  size?: number;
}
