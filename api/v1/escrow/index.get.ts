import { Effect, pipe } from "effect"
import { listTransactions } from "~/services/escrow/escrowTransactionServices"
import { SearchServiceLive } from "~/services/search"
import { defineAppHandler } from "~/utils/effect"

export default defineAppHandler(
  (event) => {
    return pipe(
      listTransactions(),
      Effect.provide(SearchServiceLive(getQuery(event)))
    )
  }
)
