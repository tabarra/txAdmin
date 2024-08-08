import { AuthedCtx } from "@core/components/WebServer/ctxTypes";

export default async function VersionControlResources(ctx: AuthedCtx) {
  return ctx.send({
    resources: [
      {
        submoduleName: "core",
        path: "fx-data/resources/[wsrp]/core",
        repository: "westroleplay/core",
        commit: "5440e03",
        isUpToDate: true
      },
      {
        submoduleName: "default",
        path: "fx-data/resources/[wsrp]/default",
        repository: "westroleplay/default",
        commit: "a320e03",
        isUpToDate: true
      },
      {
        submoduleName: "chat",
        path: "fx-data/resources/[wsrp]/chat",
        repository: "westroleplay/chat",
        commit: "3025dba",
        isUpToDate: {
          prId: 7,
          latestCommit: "d36428f"
        }
      },
      {
        submoduleName: "oxmysql",
        path: "fx-data/resources/[standalone]/oxmysql",
        repository: "overextended/oxmysql",
        commit: "5440e03",
        isUpToDate: {
          prId: 8,
          latestCommit: "19d55a2"
        }
      }
    ]
  });
}
