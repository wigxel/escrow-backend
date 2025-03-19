import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { SearchServiceLive } from "~/services/search/pagination.service";
import { accountStatements } from "../../../services/user.service";
import { validateQuery } from "~/libs/request.helpers";
import { accountStatementRules } from "~/dto/user.dto";

export default defineAppHandler((event) => {
  return Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateQuery(event, accountStatementRules);
    return yield* _(
      accountStatements(data, user).pipe(
        Effect.provide(SearchServiceLive(getQuery(event))),
      ),
    );
  });
});
