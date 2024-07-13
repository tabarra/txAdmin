import { AuthedCtx } from "@core/components/WebServer/ctxTypes";

export default async function VersionControlOwners(ctx: AuthedCtx) {
  /// @ts-ignore
  return ctx.send(await globals.versionControl.getOwners());
}
