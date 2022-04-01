import { SysCallMapping } from "../../plugos/system";
import { Space } from "../space";

export function systemSyscalls(space: Space): SysCallMapping {
  return {
    async invokeFunctionOnServer(ctx, name: string, ...args: any[]) {
      if (!ctx.plug) {
        throw Error("No plug associated with context");
      }
      return space.remoteInvoke(ctx.plug, name, args);
    },
  };
}