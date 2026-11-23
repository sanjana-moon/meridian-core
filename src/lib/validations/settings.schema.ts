import { z } from "zod";

export const settingsUpdateSchema = z.object({
  settings: z.record(z.string(), z.unknown()).refine(
    (settings) => Object.keys(settings).length > 0,
    "At least one setting is required",
  ),
}).strict();
