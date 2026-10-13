// Version native : les notifications push ne sont branchées que sur le web
// pour l'instant (voir push.web.ts).
export type PushStatus = "unsupported" | "needs-install" | "denied" | "enabled" | "disabled";

export async function getPushStatus(): Promise<PushStatus> {
  return "unsupported";
}

export async function enablePush(_token: string): Promise<PushStatus> {
  return "unsupported";
}

export async function disablePush(_token: string): Promise<void> {}
