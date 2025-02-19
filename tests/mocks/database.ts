import { Effect, Layer } from "effect";
import {
  DatabaseConnection,
  type DatabaseResourceInterface,
} from "~/config/database";

const DatabaseResourceTest = Effect.acquireRelease(
  Effect.suspend(() =>
    Effect.succeed({
      handle: null,
      close: async () => {},
    }),
  ),
  (res) => Effect.promise(() => res.close()),
);

export const DatabaseTest = DatabaseResourceTest.pipe(
  Effect.map((resource) => {
    return Layer.succeed(
      DatabaseConnection,
      {} as DatabaseResourceInterface["client"],
    );
  }),
  Layer.unwrapEffect,
);
