import * as z from "zod";

export const VcFileResourceSchema = z.object({
  submoduleName: z.string(),
  repository: z.string(),
  path: z.string(),
  commit: z.string(),
  isUpToDate: z.boolean().or(
    z.object({
      prId: z.number(),
      latestCommit: z.string()
    })
  )
});

export const VcFileSchema = z.object({
  resources: z.array(VcFileResourceSchema),
  repository: z.null().or(z.string())
});

export type VcFileType = z.infer<typeof VcFileSchema>;
export type VcFileResourceType = z.infer<typeof VcFileResourceSchema>;
