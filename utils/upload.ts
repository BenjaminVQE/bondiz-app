import { Platform } from "react-native";

// Ajoute une image à un FormData. En natif, fetch accepte { uri, name, type } ;
// sur le web, l'uri du sélecteur est une URL blob/data qu'il faut convertir en Blob.
export async function appendImage(formData: FormData, field: string, uri: string, fallbackName: string) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    const extension = blob.type.split("/")[1] || "jpg";
    formData.append(field, blob, `${fallbackName}.${extension}`);
    return;
  }

  const filename = uri.split("/").pop() || `${fallbackName}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;
  formData.append(field, { uri, name: filename, type } as any);
}
