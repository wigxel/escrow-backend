import { handlePaymentEvents } from "~/services/payment.service";

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const sig = getHeader(event, "x-paystack-signature");

  return runLive(
    event,
    handlePaymentEvents(body, sig),
  );
});
