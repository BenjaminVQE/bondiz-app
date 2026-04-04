import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [reorderMode, setReorderMode] = React.useState(false);
  const [orderedIds, setOrderedIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // On utilise /users/me?populate=* pour récupérer ses propres données avec les relations
      const data = await apiFetch<any>(`/users/me?populate=*`, {}, token!);
      setProfileData(data);
    } catch (error) {
      console.error("Failed to fetch profile data", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    // 1. Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Désolé, nous avons besoin des permissions pour accéder à vos photos !");
      return;
    }

    // 2. Lancer le picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await uploadImage(selectedImage.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      
      // 1. Préparer le FormData pour Strapi
      const formData = new FormData();
      const fileName = uri.split("/").pop() || "profile_photo.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append("files", {
        uri,
        name: fileName,
        type,
      });

      // 2. Envoyer à l'endpoint d'upload de Strapi
      const uploadResponse = await apiFetch<any[]>("/upload", {
        method: "POST",
        body: formData,
      }, token!);

      if (uploadResponse && uploadResponse.length > 0) {
        const newImageId = uploadResponse[0].id;
        
        // 3. Associer l'image à l'utilisateur (on ajoute aux photos existantes)
        const currentImageIds = profileData?.self_image?.map((img: any) => img.id) || [];
        await apiFetch(`/users/${user?.id}`, {
          method: "PUT",
          body: JSON.stringify({
            self_image: [...currentImageIds, newImageId]
          }),
        }, token!);

        // 4. Rafraîchir
        await fetchProfile();
      }
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Erreur lors de l'envoi de l'image. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const movePhoto = (index: number, direction: "left" | "right") => {
    const newIds = [...orderedIds];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    setOrderedIds(newIds);
  };

  const saveOrder = async () => {
    setReorderMode(false);
    try {
      setLoading(true);
      await apiFetch(`/users/${user?.id}`, {
        method: "PUT",
        body: JSON.stringify({ self_image: orderedIds }),
      }, token!);
      await fetchProfile();
    } catch (error) {
      console.error("Failed to save order", error);
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };


  const stats = {
    messages: 0, // Pas encore de champ messages dans Strapi
    matchs: profileData?.matches?.length || 0,
    activities: profileData?.activities?.length || 0,
  };


  // Build photos list respecting orderedIds if in reorder mode
  const rawImages: any[] = profileData?.self_image || [];
  const orderedImages = orderedIds.length > 0
    ? orderedIds.map(id => rawImages.find((img: any) => img.id === id)).filter(Boolean)
    : rawImages;

  const photos = orderedImages.map((img: any) => {
    const url = img.url || img.attributes?.url || img.data?.attributes?.url;
    if (!url) return null;
    return url.startsWith("http") ? url : `${STRAPI_BASE_URL}${url}`;
  }).filter((url: string | null) => url !== null) || [];

  const avatarUrl = photos.length > 0 ? photos[0] : null;

  if (loading && !profileData) {
    return (
      <View style={[globalStyles.container, globalStyles.center]}>
        <ActivityIndicator size="large" color={COLORS.cta} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFIL</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : undefined}
              style={styles.avatar}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{profileData?.username || user?.username || "Bondiz User"}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: COLORS.pink }]}>
            <Text style={[styles.statNumber, { color: "white" }]}>{stats.messages}</Text>
            <Text style={[styles.statLabel, { color: "white" }]}>Messages</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.cta }]}>
            <Text style={styles.statNumber}>{stats.matchs}</Text>
            <Text style={[styles.statLabel, { color: COLORS.black }]}>Matchs</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.purple }]}>
            <Text style={[styles.statNumber, { color: "white" }]}>{stats.activities}</Text>
            <Text style={[styles.statLabel, { color: "white" }]}>Activités</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, reorderMode && { backgroundColor: COLORS.pink }]}
            onPress={() => {
              if (!reorderMode) {
                setOrderedIds(rawImages.map((img: any) => img.id));
              }
              setReorderMode(!reorderMode);
            }}
          >
            <Ionicons name="pencil" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
            <Ionicons name="image" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Reorder mode bar */}
        {reorderMode && (
          <View style={styles.reorderBar}>
            <Text style={styles.reorderHint}>Utilisez ← → pour réordonner vos photos</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReorderMode(false)}>
                <Text style={{ color: COLORS.gray, fontFamily: "Poppins_700Bold", fontSize: 13 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveOrder}>
                <Text style={{ color: "white", fontFamily: "Poppins_700Bold", fontSize: 13 }}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((item: string, index: number) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: item }} style={styles.photoPlaceholder} />
              {reorderMode && (
                <View style={styles.reorderOverlay}>
                  <TouchableOpacity
                    onPress={() => movePhoto(index, "left")}
                    disabled={index === 0}
                    style={[styles.arrowBtn, index === 0 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-back" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => movePhoto(index, "right")}
                    disabled={index === photos.length - 1}
                    style={[styles.arrowBtn, index === photos.length - 1 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {photos.length === 0 && (
            <Text style={{ textAlign: "center", color: COLORS.gray, width: "100%", marginTop: 20 }}>
              Aucune photo pour le moment
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Custom Bottom Navigation Bar */}
      <View style={[styles.bottomNavWrapper, { bottom: 25 + insets.bottom }]}>
        <View style={styles.bottomNavBar}>
          <TouchableOpacity 
            style={[styles.navItem, { backgroundColor: COLORS.cta }]}
            onPress={() => router.replace("/home")}
          >
            <Ionicons name="home-outline" size={28} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, { backgroundColor: COLORS.pink }]}>
            <Ionicons name="happy-outline" size={28} color={COLORS.main} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, { backgroundColor: COLORS.cta }]}>
            <Ionicons name="chatbubbles-outline" size={28} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, { backgroundColor: COLORS.pink }]}
          >
            <Ionicons name="person-outline" size={28} color={COLORS.main} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray,
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "black",
    flexWrap: "wrap",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statBox: {
    width: (width - 70) / 3,
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "black",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: "white",
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30,
  },
  actionButton: {
    width: 60,
    height: 45,
    borderRadius: 22,
    backgroundColor: COLORS.purple,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoContainer: {
    width: (width - 50 - 16) / 3,
    aspectRatio: 1,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 5,
  },
  bottomNavWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomNavBar: {
    flexDirection: "row",
    backgroundColor: COLORS.purple,
    borderRadius: 25,
    padding: 10,
    width: width * 0.9,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  navItem: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  reorderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  reorderHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.gray,
    flexShrink: 1,
    marginRight: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.purple,
  },
  reorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
});
