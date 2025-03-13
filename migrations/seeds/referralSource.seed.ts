import { Effect } from "effect";
import { createSeed } from "../../migrations/seeds/setup";
import { ReferralSourcesRepoLayer } from "../../repositories/referralSource.repo";

export const runSeed = createSeed(
  "DIsputeResolutionSeed",
  Effect.gen(function* (_) {
    const repo = yield* ReferralSourcesRepoLayer.Tag;

    const categories = [
      { name: "Social media" },
      { name: "Google advertisement" },
      { name: "From family or friends" },
      { name: "others" },
    ];

    return yield* Effect.all(
      categories.map((category) => {
        return repo.find("name", category.name).pipe(
          Effect.matchEffect({
            onFailure: () => repo.create(category),
            onSuccess: (v) => Effect.succeed(v),
          }),
        );
      }),
    );
  }),
);
