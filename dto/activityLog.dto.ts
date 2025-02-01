import { z } from "zod";

export const activityLogSchema = z.object({
  kind:z.string(),
  entityId:z.string(),
  data:z.object({
    summary:z.string().min(3),
    params:z.record(z.unknown()).optional()
  })
})