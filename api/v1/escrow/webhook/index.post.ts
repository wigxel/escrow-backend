import { handlePaystackWebhook } from "~/services/webhook.service";

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const sig = getHeader(event, "x-paystack-signature");

  return runLive(
    event,
    handlePaystackWebhook(body, sig),
  );
});
