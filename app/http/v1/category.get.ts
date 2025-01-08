import { Effect } from "effect";
import { CategoryRepo } from "~/repositories/category.repo";
import { runLive } from "~/utils/effect";

const getAllCategories = Effect.gen(function* (_) {
  const categoryRepo = yield* CategoryRepo;
  return yield* categoryRepo.all();
});

export default defineCachedEventHandler(
  (event) => {
    return runLive(
      event,
      getAllCategories.pipe(Effect.map((categories) => ({ data: categories }))),
    );
  },
  {
    maxAge: 604800, // 1 day
  },
);
