import { Effect } from "effect";
import { newDisputeSchema } from "~/dto/dispute.dto";
import { validateBody, validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createDispute } from "~/services/dispute/dispute.service";
import { validateFile } from "../../profile/avatar.post";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const formdata = yield* Effect.tryPromise(() => readFormData(event));
    const data = yield* validateParams(newDisputeSchema, {
      escrowId: formdata.get("escrowId"),
      reason: formdata.get("reason"),
      categoryId: formdata.get("categoryId"),
      resolutionId: formdata.get("resolutionId"),
      file: formdata.get("file") as File,
    });
    const { user } = yield* getSessionInfo(event);

    return yield* createDispute({
      currentUser: user,
      disputeData: data,
    });
    
  });

  return runLive(event, program);
});
