import { eq, like, or } from "drizzle-orm";
import { Context, Effect, Layer, pipe } from "effect";
import { head } from "effect/Array";
import { notNil, queryEqualMap, runDrizzleQuery } from "~/libs/query.helpers";
import { type NewUser, User, userTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";
import { createRepoHelpers } from "~/services/repository/drizzle-repo-helper";
import {
  FindArg1,
  FindArg2,
  RepoModel,
  RepoModelIdType,
  SearchableParams,
} from "~/services/repository/repo.types";
import type {
  FilterQuery,
  PaginationQuery,
} from "~/services/search/primitives";

export class UserRepository extends DrizzleRepo(userTable, "id") {
  getUserById(id: string) {
    return runDrizzleQuery((db) => {
      return db.query.userTable.findFirst({
        where: eq(userTable.id, id),
      });
    }).pipe(Effect.flatMap(notNil));
  }

  searchByQuery(query: Partial<PaginationQuery & FilterQuery>) {
    return runDrizzleQuery((db) => {
      return db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .where(
          or(
            like(userTable.firstName, `%${query.search}%`),
            like(userTable.lastName, `%${query.search}%`),
            like(userTable.email, `%${query.search}%`),
          ),
        )
        .offset(query.pageNumber)
        .limit(query.pageSize);
    }).pipe(Effect.map((e) => e as unknown));
  }
}

export class UserRepo extends Context.Tag("UserRepo")<
  UserRepo,
  UserRepository
>() {}

export const UserRepoLayer = {
  Tag: UserRepo,
  Repo: {
    Live: Layer.succeed(UserRepo, new UserRepository()),
  },
};
