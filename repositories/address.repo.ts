import { Context, Layer } from "effect";
import { addressTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class AddressRepository extends DrizzleRepo(addressTable, "id") {}

export class AddressRepo extends Context.Tag("AddressRepo")<
  AddressRepo,
  AddressRepository
>() {}

export const AddressRepoLayer = {
  tag: AddressRepo,
  live: Layer.succeed(AddressRepo, new AddressRepository()),
};
