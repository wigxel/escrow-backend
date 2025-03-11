import { Context, Layer } from "effect";
import { commentsTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class CommentRepository extends DrizzleRepo(commentsTable, "id") {}

export class CommentRepo extends Context.Tag("CommentRepo")<
  CommentRepo,
  CommentRepository
>() {}

export const CommentRepoLayer = {
  tag: CommentRepo,
  live: Layer.succeed(CommentRepo, new CommentRepository()),
};
