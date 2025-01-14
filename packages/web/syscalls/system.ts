import { SysCallMapping } from "@plugos/plugos/system";
import type { Editor } from "../editor";

export function systemSyscalls(editor: Editor): SysCallMapping {
  return {
    "system.invokeFunction": async (
      ctx,
      env: string,
      name: string,
      ...args: any[]
    ) => {
      if (!ctx.plug) {
        throw Error("No plug associated with context");
      }

      if (env === "client") {
        return ctx.plug.invoke(name, args);
      }

      return editor.space.invokeFunction(ctx.plug, env, name, args);
    },
    "system.reloadPlugs": async () => {
      return editor.reloadPlugs();
    },

    "sandbox.getServerLogs": async (ctx) => {
      return editor.space.proxySyscall(ctx.plug, "sandbox.getLogs", []);
    },
  };
}
