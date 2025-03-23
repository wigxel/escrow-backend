import { Effect } from "effect";
import { verifyEmailDto } from "~/dto/user.dto";
import { Session } from "~/layers/session";
import { validateBody } from "~/libs/request.helpers";
import { dataResponse } from "~/libs/response";
import { UserRepoLayer } from "~/repositories/user.repository";
import { verifyUserEmail } from "~/services/user.service";
import { runLive } from "~/utils/effect";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const session = yield* Session;
    const userRepo = yield* UserRepoLayer.Tag;

    const body = yield* validateBody(event, verifyEmailDto);
    yield* verifyUserEmail(body);
    const user = yield* userRepo.find({ email: body.email });

    return dataResponse({
      message: "Account verified",
      data: yield* session.create(user.id),
    });
  });

  return runLive(event, program);
});
