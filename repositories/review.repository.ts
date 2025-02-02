import { Context, Layer } from "effect";
import { reviewsTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class ReviewRepository extends DrizzleRepo(reviewsTable, "id") {}

export class ReviewRepo extends Context.Tag("ReviewRepo")<
  ReviewRepo,
  ReviewRepository
>() {}

export const ReviewRepoLive = Layer.succeed(ReviewRepo, new ReviewRepository());
