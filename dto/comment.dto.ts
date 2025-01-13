import { z } from "zod";

export const createCommentDto = z.object({
  reviewId: z.string(),
  parentCommentId: z.string().optional(),
  comment: z.string(),
});

export const updateCommentDto = z.object({
  comment: z.string(),
  commentId: z.string(),
}).parse;

export const deleteCommentDto = z.object({
  commentId: z.string(),
}).parse;
