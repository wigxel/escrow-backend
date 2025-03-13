import { Context, Layer } from "effect";
import { escrowPaymentTable } from "../../migrations/schema";
import { DrizzleRepo } from "../../services/repository/RepoHelper";

export class EscrowPaymentRepository extends DrizzleRepo(
  escrowPaymentTable,
  "id",
) {}

export class EscrowPaymentRepo extends Context.Tag("EscrowPaymentRepo")<
  EscrowPaymentRepo,
  EscrowPaymentRepository
>() {}

export const EscrowPaymentRepoLayer = {
  tag: EscrowPaymentRepo,
  live: Layer.succeed(EscrowPaymentRepo, new EscrowPaymentRepository()),
};
