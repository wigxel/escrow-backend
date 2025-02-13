import { Effect } from "effect"
import { getSessionInfo } from "~/libs/session.helpers"
import { UserBalance } from "~/services/user.service"

export default eventHandler((event)=>{

  const program = Effect.gen(function*(){
    const {user} = yield* getSessionInfo(event)
    return yield* UserBalance(user)
  })

  return runLive(event, program)
})