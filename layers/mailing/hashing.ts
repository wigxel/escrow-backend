import { Effect } from "effect";

export class EmailTokenImplementation {
  private allowedMargin = 30 * 24 * 60 * 60; // 30 days in milliseconds

  generateToken(
    email: string,
  ): Effect.Effect<void, [timestamp: number, linkInfo: string]> {
    return Effect.succeed([10001, ""]);
  }

  validateToken(email: string, tokenTimestamp: number): Effect.Effect<void> {
    return Effect.void;
  }
}
