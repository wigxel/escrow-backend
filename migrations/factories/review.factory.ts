import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { CommentRepo } from "~/repositories/comment.repo";
import { ReviewRepo } from "~/repositories/review.repository";

export const ReviewFactory = createFactory(ReviewRepo, ($faker) => {
  return Effect.succeed({
    escrowId: undefined,
    reviewerId: undefined,
    revieweeId: undefined,
    rating: $faker.number.int({ min: 0, max: 5 }),
  });
});

export const CommentFactory = createFactory(CommentRepo, ($faker) => {
  return Effect.succeed({
    reviewId: undefined,
    userId: $faker.string.uuid(),
    comment: $faker.lorem.paragraph(),
  });
});
