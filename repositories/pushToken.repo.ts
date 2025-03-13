import { Context, Layer } from "effect";
import { pushTokenTable } from "../migrations/schema";
import { DrizzleRepo } from "../services/repository/RepoHelper";

export class PushTokenRepository extends DrizzleRepo(pushTokenTable, "id") {}

export class PushTokenRepo extends Context.Tag("PushTokenRepo")<
  PushTokenRepo,
  PushTokenRepository
>() {}

export const PushTokenRepoLayer = {
  tag: PushTokenRepo,
  live: Layer.succeed(PushTokenRepo, new PushTokenRepository()),
};
