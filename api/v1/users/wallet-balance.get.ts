import { Effect } from "effect"
import { getSessionInfo } from "~/libs/session.helpers"
import { UserWalletBalance } from "~/services/user.service"

export default eventHandler((event)=>{

  const program = Effect.gen(function*(){
    const {user} = yield* getSessionInfo(event)
    return yield* UserWalletBalance(user)
  })

  return runLive(event, program)
})