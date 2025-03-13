import { and, count, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { head } from "effect/Array";
import type { z } from "zod";
import type { reviewFilterDto } from "../dto/review.dto";
import { runDrizzleQuery } from "../libs/query.helpers";
import { reviewsTable } from "../migrations/schema";
import { DrizzleRepo } from "../services/repository/RepoHelper";
import type { PaginationQuery } from "../services/search/primitives";

export class ReviewRepository extends DrizzleRepo(reviewsTable, "id") {
  reviewCount(filters: z.infer<typeof reviewFilterDto>) {
    return runDrizzleQuery((db) => {
      return db
        .select({ count: count() })
        .from(reviewsTable)
        .where(
          and(
            ...Object.entries(filters).map(([key, value]) => {
              if (key === "revieweeId")
                return eq(reviewsTable.revieweeId, value as string);
              if (key === "rating")
                return eq(reviewsTable.rating, value as number);
              if (key === "escrowId")
                return eq(reviewsTable.escrowId, value as string);
            }),
          ),
        );
    }).pipe(
      Effect.map((d) => d),
      Effect.flatMap(head),
    );
  }

  getReviews(filters: z.infer<typeof reviewFilterDto> & PaginationQuery) {
    return runDrizzleQuery((db) => {
      return db.query.reviewsTable.findMany({
        where: and(
          ...Object.entries(filters).map(([key, value]) => {
            if (key === "revieweeId")
              return eq(reviewsTable.revieweeId, value as string);
            if (key === "rating")
              return eq(reviewsTable.rating, value as number);
            if (key === "escrowId")
              return eq(reviewsTable.escrowId, value as string);
          }),
        ),
        with: {
          comments: true,
        },
        limit: filters.pageSize,
        offset: filters.pageSize * filters.pageNumber,
      });
    });
  }
}

export class ReviewRepo extends Context.Tag("ReviewRepo")<
  ReviewRepo,
  ReviewRepository
>() {}

export const ReviewRepoLive = Layer.succeed(ReviewRepo, new ReviewRepository());
