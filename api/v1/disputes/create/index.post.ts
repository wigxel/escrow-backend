import { Effect } from "effect";
import { newDisputeSchema } from "~/dto/dispute.dto";
import { safeStr } from "~/libs/data.helpers";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createDispute } from "~/services/dispute/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const formdata = yield* Effect.tryPromise(() => readFormData(event));
    const { user } = yield* getSessionInfo(event);
    const file = formdata.get("file");

    const data = yield* validateParams(newDisputeSchema, {
      reason: formdata.get("reason"),
      escrowId: formdata.get("escrowId"),
      categoryId: formdata.get("categoryId"),
      resolutionId: formdata.get("resolutionId"),
      file:
        file instanceof File
          ? file
          : base64ToFile(String(formdata.get("file"))),
    });

    return yield* createDispute({
      currentUser: user,
      disputeData: data,
    });
  });

  return runLive(event, program);
});

function base64ToFile(file_str: string) {
  if (safeStr(file_str).includes("base64")) {
    const [meta, base64String] = file_str.split(",");
    const bytes = atob(base64String);
    const buffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      view[i] = bytes.charCodeAt(i);
    }

    const mimeType =
      meta.match(/data:(.*?);/)?.[1] || "application/octet-stream";
    return new File([buffer], "dispute.file", { type: mimeType });
  }

  return;
}
