import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { AddressRepo } from "~/repositories/address.repo";

export const AddressFactory = createFactory(AddressRepo, ($faker) => {
  return Effect.succeed({
    userId: undefined,
    placeId: $faker.location.zipCode(),
    longitude: $faker.location.longitude(),
    latitude: $faker.location.latitude(),
    state: $faker.location.state(),
    street: $faker.location.street(),
    city: $faker.location.city(),
  });
});
