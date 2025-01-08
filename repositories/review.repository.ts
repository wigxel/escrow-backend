import { and, eq, isNotNull, not, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import {
  countWhere,
  paginateQuery,
  runDrizzleQuery,
} from "~/libs/query.helpers";
import {
  type Review,
  commentsTable,
  productTable,
  reviewsTable,
} from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";
import { SearchOps } from "~/services/search/sql-search-resolver";

export class ReviewRepository extends DrizzleRepo(reviewsTable, "id") {
  findProductReviews(filters: Partial<Review> = {}) {
    return runDrizzleQuery((db) => {
      return db.query.reviewsTable.findMany({
        where: and(
          ...Object.entries(filters).map(([key, value]) => {
            if (key === "id") return eq(reviewsTable.id, value as string);
            if (key === "rating")
              return eq(reviewsTable.rating, value as number);
            if (key === "productId")
              return eq(reviewsTable.productId, value as string);
          }),
        ),
        with: {
          comments: {
            where: not(
              isNotNull(commentsTable.parentCommentId),
            ) /** Only load comments with no parent comment, user has to click to read replies [See Instagram Example] */,
            with: {
              user: {
                columns: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  emailVerified: true,
                  id: true,
                },
              },
            },
          },
          user: {
            columns: {
              firstName: true,
              lastName: true,
              profilePicture: true,
              emailVerified: true,
              id: true,
            },
          },
        },
      });
    });
  }

  sellersReviewPaginated(params: {
    sellerId: string;
  }) {
    const sellerProductIds = sql`SELECT id FROM ${productTable} WHERE ${productTable.ownerId} = ${params.sellerId}`;
    const where = sql`${reviewsTable.productId} in (${sellerProductIds})`;
    const getAll = this.all({
      ...params,
      where: SearchOps.and(SearchOps.raw(() => where)),
    });

    const searchQuery = Effect.gen(function* (_) {
      const count = yield* countWhere(
        reviewsTable,
        SearchOps.raw(() => where),
      );

      const reviews = yield* getAll;

      return [count, reviews] as const;
    });

    return paginateQuery((params) => searchQuery);
  }
}

export class ReviewRepo extends Context.Tag("ReviewRepo")<
  ReviewRepo,
  ReviewRepository
>() {}

export const ReviewRepoLive = Layer.succeed(ReviewRepo, new ReviewRepository());
