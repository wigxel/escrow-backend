import { Context, Layer } from "effect";
import { categoryTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class CategoryRepository extends DrizzleRepo(categoryTable, "id") {}

export class CategoryRepo extends Context.Tag("CategoryRepo")<
  CategoryRepo,
  CategoryRepository
>() {}

export const CategoryRepoLive = Layer.succeed(
  CategoryRepo,
  new CategoryRepository(),
);
