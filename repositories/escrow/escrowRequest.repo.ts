import { Context, Layer } from "effect";
import { escrowRequestTable } from "../../migrations/schema";
import { DrizzleRepo } from "../../services/repository/RepoHelper";

export class EscrowRequestRepository extends DrizzleRepo(
  escrowRequestTable,
  "id",
) {}

export class EscrowRequestRepo extends Context.Tag("EscrowRequestRepo")<
  EscrowRequestRepo,
  EscrowRequestRepository
>() {}

export const EscrowRequestRepoLayer = {
  tag: EscrowRequestRepo,
  live: Layer.succeed(EscrowRequestRepo, new EscrowRequestRepository()),
};
