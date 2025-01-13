import { getBearerToken } from "~/libs/session.helpers";
import { logout } from "~/services/auth.service";
import { runLive } from "~/utils/effect";

export default defineEventHandler(async (event) => {
  const access_token = getBearerToken(getHeaders(event));

  return runLive(
    event,
    //the access_token is alias for session_id
    logout({ access_token }),
  );
});
