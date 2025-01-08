import { safeStr } from "@repo/shared/src/data.helpers";
import { Effect } from "effect";
import { productStatusToggleDto } from "~/dto/product.dto";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { productStatusToggle } from "~/services/product.service";

export default eventHandler((event) => {
  const productId = getRouterParam(event, "productId");
  const toggleType = getRouterParam(event, "toggleType");
  const program = Effect.gen(function* () {
    const data = yield* validateParams(
      productStatusToggleDto,
      safeStr(toggleType).toLowerCase(),
    );
    const { user } = yield* getSessionInfo(event);

    return yield* productStatusToggle(productId, data, user.id);
  });

  return runLive(event, program);
});
