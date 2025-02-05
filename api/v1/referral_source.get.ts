import { Effect } from "effect";
import { ReferralSourcesRepoLayer } from "~/repositories/referralSource.repo";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const repo = yield* ReferralSourcesRepoLayer.Tag
    return yield* repo.all();
  });

  return runLive(event, program);
});
