import { Effect } from "effect";
import { dataResponse } from "../../libs/response";
import { ReferralSourcesRepoLayer } from "../../repositories/referralSource.repo";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const repo = yield* ReferralSourcesRepoLayer.Tag;
    const source = yield* repo.all();
    return dataResponse({ data: source });
  });

  return runLive(event, program);
});
