import { updateExpiredTransactions } from "~/services/cron/cron.service";

export default eventHandler(async (event) => {
  return runLive(event, updateExpiredTransactions());
});
