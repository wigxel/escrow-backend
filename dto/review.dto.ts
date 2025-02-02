import { z } from "zod";

export const createReviewDto = z.object({
  escrowId: z.string(),
  comment: z.string().min(3).max(20),
  rating: z.number({coerce:true}),
})

export const updateReviewDto = z.object({
  reviewId: z.string(),
  productId: z.string().optional(),
  comment: z.string().min(3).optional(),
  rating: z.number().optional(),
  images: z.string().array().optional(),
}).parse;

export const deleteReviewDto = z.object({
  reviewId: z.string(),
}).parse;
