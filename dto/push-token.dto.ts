import { z } from "zod";

export const addPushTokenDto = z.object({
  token: z.string().min(100),
});
