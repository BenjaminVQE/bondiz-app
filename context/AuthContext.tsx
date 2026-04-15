import { apiFetch } from "@/services/api";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type User = {
  id: number;
  username: string;
  email: string;
  age?: number | string;
  gender?: string;
  city?: string;
  interests?: string[];
  image?: string;
  bio?: string;
  self_image?: any[];
  activities?: any[];
  matches2?: any[];
  like_user?: any[];
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, additionalData?: Partial<User>, imageUri?: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth data", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(identifier: string, password: string) {
    const data = await apiFetch<{ jwt: string; user: User }>("/auth/local", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });

    await saveAuthData(data.jwt, data.user);
  }

  async function register(username: string, email: string, password: string, additionalData?: Partial<User>, imageUri?: string) {
    // Étape 1 : Création du compte (Strapi register n'accepte que username, email, password)
    const data = await apiFetch<{ jwt: string; user: User }>("/auth/local/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    // On sauvegarde d'abord pour avoir le token et l'utilisateur en local
    let currentUser = data.user;
    await saveAuthData(data.jwt, currentUser);

    // Étape 2 : Si une photo est fournie, on l'upload et on lie à l'utilisateur
    if (imageUri) {
      try {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("files", {
          uri: imageUri,
          name: filename,
          type,
        } as any);
        formData.append("ref", "plugin::users-permissions.user");
        formData.append("refId", currentUser.id.toString());
        formData.append("field", "self_image");

        await apiFetch("/upload", {
          method: "POST",
          body: formData,
        }, data.jwt);
      } catch (e) {
        console.error("Image upload error", e);
      }
    }

    // Étape 3 : Si on a des données supplémentaires, on met à jour le profil (PUT /users/:id)
    if (additionalData && Object.keys(additionalData).length > 0) {
      try {
        const updatedUser = await apiFetch<User>(`/users/${currentUser.id}?populate[0]=self_image`, {
          method: "PUT",
          body: JSON.stringify(additionalData),
        }, data.jwt);

        await saveAuthData(data.jwt, updatedUser);
        currentUser = updatedUser;
      } catch (updateError) {
        console.error("Failed to update user profile after registration", updateError);
      }
    } else if (imageUri) {
       // Fetch user again to get the populated self_image if no additionalData was sent
      try {
        const updatedUser = await apiFetch<User>(`/users/${currentUser.id}?populate[0]=self_image`, {}, data.jwt);
        await saveAuthData(data.jwt, updatedUser);
      } catch (e) {}
    }
  }

  async function updateUser(data: Partial<User>) {
    if (!user || !token) throw new Error("Utilisateur non connecté");

    const updatedUser = await apiFetch<User>(`/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, token);

    await saveAuthData(token, updatedUser);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }

  async function saveAuthData(jwt: string, userData: User) {
    await SecureStore.setItemAsync(TOKEN_KEY, jwt);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
