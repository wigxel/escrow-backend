import { Effect } from "effect"
import { validateQuery } from "~/libs/request.helpers"
import { getSessionInfo } from "~/libs/session.helpers"
import { resolveAccountNumber } from "~/services/bank.service"
import { resolveAccountNumberRules } from "~/dto/accountNumber.dto"

export default eventHandler(async (event)=>{
  const program = Effect.gen(function*(_){
    const data = yield* validateQuery(event,resolveAccountNumberRules)
    const {user} = yield* getSessionInfo(event)
    return yield* resolveAccountNumber(data,user)
  })

  return runLive(event, program)
})