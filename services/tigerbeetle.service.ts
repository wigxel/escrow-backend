import { Effect } from "effect"
import { TigerBeetleRepoLayer } from "~/repositories/tigerbeetle/tigerbeetle.repo"
import { handleCreateAccountErrors } from "~/utils/tigerBeetle/tigerbeetle"
import type { TTBAccount } from "~/utils/tigerBeetle/type/type"

export const createAccount = (params:TTBAccount)=>{
  return Effect.gen(function*(_){
    const tigerBeetleRepo = yield* _(TigerBeetleRepoLayer.Tag)
    const errors = yield* _(tigerBeetleRepo.createAccounts(params))
    yield* handleCreateAccountErrors(errors)
  })
}