import { apiFetch } from "@/services/api";

export type PushStatus = "unsupported" | "needs-install" | "denied" | "enabled" | "disabled";

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

// Le service worker n'est enregistré que sur le build de production.
async function getRegistration() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

// La clé VAPID arrive en base64url, le navigateur l'attend en octets.
function toUint8Array(base64Url: string) {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export async function getPushStatus(): Promise<PushStatus> {
  // Sur iPhone, les notifications web n'existent que pour une app ajoutée à l'écran d'accueil.
  if (isIos() && !isInstalled()) return "needs-install";

  const registration = await getRegistration();
  if (!registration) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  return (await registration.pushManager.getSubscription()) ? "enabled" : "disabled";
}

export async function enablePush(token: string): Promise<PushStatus> {
  const registration = await getRegistration();
  if (!registration) return getPushStatus();

  // À demander en premier : Safari exige que la demande suive directement le geste de l'utilisateur.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "disabled";

  const { data } = await apiFetch<{ data: { publicKey: string | null } }>("/push/public-key", {}, token);
  if (!data.publicKey) {
    throw new Error("Les notifications ne sont pas encore activées sur le serveur.");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toUint8Array(data.publicKey),
  });

  try {
    await apiFetch("/push/subscriptions", { method: "POST", body: JSON.stringify(subscription.toJSON()) }, token);
  } catch (error) {
    await subscription.unsubscribe();
    throw error;
  }

  return "enabled";
}

export async function disablePush(token: string): Promise<void> {
  const registration = await getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  await apiFetch("/push/subscriptions/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint }) }, token);
}
