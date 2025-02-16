import { Effect } from "effect"
import { getBankList } from "~/services/bank.service"

export default eventHandler(async (event)=>{
  const program = Effect.gen(function*(_){
    return yield* getBankList()
  })

  return runLive(event, program)
})
