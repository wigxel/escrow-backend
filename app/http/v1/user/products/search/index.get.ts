import { Effect } from "effect";
import { productSearchDto } from "~/dto/product.dto";
import { validateQuery } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { searchProduct } from "~/services/product.service";
import { PaginationImpl } from "~/services/search/pagination.service";

export default eventHandler(async (event) => {
  const searchParams = getQuery(event);

  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateQuery(event, productSearchDto);

    return yield* searchProduct(data, user.id);
  });

  return runLive(event, Effect.provide(program, PaginationImpl(searchParams)));
});
