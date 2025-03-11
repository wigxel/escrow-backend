import { z } from "zod";

export const createReviewDto = z.object({
  escrowId: z.string({ required_error: "Escrow transaction id is required" }),
  comment: z.string({ required_error: "Comment is required" }).min(3).max(20),
  rating: z
    .number({
      coerce: true,
      required_error: "Rating is required",
      message: "Rating must be a number",
    })
    .min(1)
    .max(5),
});

export const updateReviewDto = z.object({
  reviewId: z.string({ required_error: "Review id is required" }),
  productId: z.string().optional(),
  comment: z.string().min(3).optional(),
  rating: z.number().optional(),
  images: z.string().array().optional(),
}).parse;

export const deleteReviewDto = z.object({
  reviewId: z.string({ required_error: "Review is required" }),
}).parse;

export const reviewFilterDto = z
  .object({
    escrowId: z.string().uuid().optional(),
    revieweeId: z.string().uuid().optional(),
    rating: z.number({ coerce: true }).min(0).optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return data.escrowId || data.revieweeId || data.rating !== undefined;
    },
    {
      message:
        "At least one of escrowId, revieweeId, or rating must be provided",
    },
  );
