import { Effect } from "effect";
import { dataResponse } from "~/libs/response";
import { DisputeCategorysRepoLayer } from "~/repositories/disputeCategories.repo";
import { DisputeResolutionssRepoLayer } from "~/repositories/disputeResolution.repo";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const categoryRepo = yield* DisputeCategorysRepoLayer.Tag
    const resolutionRepo = yield* DisputeResolutionssRepoLayer.Tag

    return dataResponse({data:{
      categories: yield* categoryRepo.all(),
      resolutions: yield* resolutionRepo.all()
    }})
  });

  return runLive(event, program);
});
