import { Context, Layer } from "effect";
import {
  disputeCategoriesTable,
  referralSourceTable,
} from "../migrations/schema";
import { DrizzleRepo } from "../services/repository/RepoHelper";

export class DisputeCategoryRepository extends DrizzleRepo(
  disputeCategoriesTable,
  "id",
) {}

export class DisputeCategoryRepo extends Context.Tag("DisputeCategoryRepo")<
  DisputeCategoryRepo,
  DisputeCategoryRepository
>() {}

export const DisputeCategorysRepoLayer = {
  Tag: DisputeCategoryRepo,
  Repo: {
    Live: Layer.succeed(DisputeCategoryRepo, new DisputeCategoryRepository()),
  },
};
