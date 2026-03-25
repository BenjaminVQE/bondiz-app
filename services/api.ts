
// URL de base pour Strapi. 
// Note: Utiliser l'IP locale si vous testez sur un appareil physique (ex: http://192.168.1.XX:1337)
export const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || "http://localhost:1337";
export const STRAPI_TOKEN = process.env.EXPO_PUBLIC_STRAPI_TOKEN || "";

export type StrapiError = {
  status: number;
  name: string;
  message: string;
  details: any;
};

const translateError = (message: string | undefined): string => {
  if (!message) return "Une erreur inattendue est survenue.";

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid identifier or password")) {
    return "Adresse email ou mot de passe incorrect.";
  }
  if (lowerMessage.includes("email or username are already taken") || lowerMessage.includes("email is already taken")) {
    return "Cette adresse email est déjà utilisée.";
  }
  if (lowerMessage.includes("username is already taken")) {
    return "Ce nom d'utilisateur est déjà utilisé.";
  }

  return "Une erreur est survenue. Veuillez réessayer.";
};

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${STRAPI_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const authToken = token || STRAPI_TOKEN;
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error: any) {
    console.error(`Network Error (${endpoint}):`, error);
    throw new Error("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
  }

  let data;
  try {
    data = await response.json();
  } catch (error: any) {
    console.error(`Parse Error (${endpoint}):`, error);
    throw new Error("Le serveur rencontre un problème. Veuillez réessayer plus tard.");
  }

  if (!response.ok) {
    const error = data.error as StrapiError | undefined;
    throw new Error(translateError(error?.message));
  }

  return data as T;
}
