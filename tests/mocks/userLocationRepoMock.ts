import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import type { TInsertAddress } from "~/migrations/schema";
import {
  UserLocationRepo,
  type UserLocationRepository,
} from "~/repositories/userLocation.repo";
import type { FindArg1, FindArg2 } from "~/services/repository/repo.types";
import { extendMockImplementation } from "./helpers";

const list = Effect.succeed([
  {
    placeId: "place-id",
    latitude: "43.56677",
    longitude: "75.9053",
    city: "city",
    state: "state",
    street: "street",
    userId: "user-id",
    id: "MOCK_LOCATION_ID",
  },
]);

const userLocationMock: UserLocationRepository = {
  create: (data: TInsertAddress) => {
    return list;
  },

  all: (params) => {
    return list;
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  delete: (params) => {
    return Effect.void;
  },

  // @ts-expect-error
  find: () => {
    return list.pipe(Effect.flatMap(head));
  },

  firstOrThrow(arg1: FindArg1, arg2?: FindArg2) {
    return list.pipe(Effect.flatMap(head));
  },

  update: () => {
    throw new Error("Function not implemented.");
  },
};

export const extendUserLocationRepo = extendMockImplementation(
  UserLocationRepo,
  () => userLocationMock,
);

export const UserLocationRepoTest = Layer.succeed(
  UserLocationRepo,
  userLocationMock,
);
