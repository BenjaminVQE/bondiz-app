import { router } from "expo-router";
import { Platform } from "react-native";

// Uniquement sur le build web de production : en dev, le cache gênerait le rechargement à chaud.
export function registerServiceWorker() {
  if (Platform.OS !== "web" || __DEV__ || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.error("Service worker registration failed", error);
  });

  // Clic sur une notification alors que l'app est déjà ouverte : le service
  // worker nous demande d'afficher l'écran concerné.
  navigator.serviceWorker.addEventListener("message", (event) => {
    const { type, path } = event.data ?? {};
    if (type === "navigate" && typeof path === "string" && path.startsWith("/")) {
      router.push(path as any);
    }
  });
}
