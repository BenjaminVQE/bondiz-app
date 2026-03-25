
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Strapi renvoie les erreurs dans un format spécifique { error: StrapiError }
      const error = data.error as StrapiError;
      throw new Error(error?.message || "Une erreur est survenue");
    }

    return data as T;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}
