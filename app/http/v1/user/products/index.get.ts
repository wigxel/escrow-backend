import { Effect, pipe } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getProducts } from "~/services/product.service";
import { PaginationImpl } from "~/services/search/pagination.service";

export default eventHandler((event) => {
  const searchParams = getQuery(event);

  // get for the logged in seller
  const program = pipe(
    getSessionInfo(event),
    Effect.flatMap(({ user }) => getProducts(user.id)),
  );
  const runnable = Effect.provide(program, PaginationImpl(searchParams));

  return runLive(event, runnable);
});
