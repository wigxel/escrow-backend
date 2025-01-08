import { Console, Effect, flow } from "effect";

export function debugPipeline(tag: string) {
  return flow(
    Effect.tap((v) => Console.log(`${tag}/Success`, v)),
    Effect.tapError((v) => Console.error(`${tag}/Error`, v)),
  );
}
