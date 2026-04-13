import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import Animated, { 
  FadeIn, 
  FadeOut, 
  Layout, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from "react-native-reanimated";
import { 
  Gesture, 
  GestureDetector,
  GestureHandlerRootView
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";
import BottomNav from "./components/BottomNav";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [orderedIds, setOrderedIds] = React.useState<number[]>([]);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editBio, setEditBio] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Modal swipe state
  const modalY = useSharedValue(0);

  React.useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any>(`/users/me?populate=*`, {}, token!);
      setProfileData(data);
    } catch (error) {
      console.error("Failed to fetch profile data", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Désolé, nous avons besoin des permissions pour accéder à vos photos !");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const formData = new FormData();
      const fileName = uri.split("/").pop() || "profile_photo.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append("files", { uri, name: fileName, type });

      const uploadResponse = await apiFetch<any[]>("/upload", {
        method: "POST",
        body: formData,
      }, token!);

      if (uploadResponse && uploadResponse.length > 0) {
        const newImageId = uploadResponse[0].id;
        const currentImages = profileData?.self_image || [];
        const currentImageIds = currentImages.map((img: any) => img.id);
        const newIds = [...currentImageIds, newImageId];
        
        await apiFetch(`/users/${user?.id}`, {
          method: "PUT",
          body: JSON.stringify({ self_image: newIds }),
        }, token!);

        setOrderedIds([]); 
        await fetchProfile();
      }
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Erreur lors de l'envoi de l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = (fromIndex: number, toIndex: number) => {
    const rawImages: any[] = profileData?.self_image || [];
    const baseIds = orderedIds.length > 0 ? orderedIds : rawImages.map(img => img.id);
    const newIds = [...baseIds];
    [newIds[fromIndex], newIds[toIndex]] = [newIds[toIndex], newIds[fromIndex]];
    setOrderedIds(newIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAll = async () => {
    try {
      setSavingProfile(true);
      const rawImages: any[] = profileData?.self_image || [];
      await apiFetch<any>(`/users/${user?.id}`, {
        method: "PUT",
        body: JSON.stringify({
          username: editName,
          bio: editBio,
          self_image: orderedIds.length > 0 ? orderedIds : rawImages.map(img => img.id)
        }),
      }, token!);
      await fetchProfile();
      setEditModalVisible(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSavingProfile(false);
    }
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        modalY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 600) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(setEditModalVisible)(false);
      }
      modalY.value = withSpring(0);
    });

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalY.value }]
  }));

  const stats = {
    likes: profileData?.likes?.length || 0,
    matchs: (profileData?.matches?.length || 0) + (profileData?.matches2?.length || 0),
    activities: profileData?.activities?.length || 0,
  };

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
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image source={avatarUrl ? { uri: avatarUrl } : undefined} style={styles.avatar} />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{profileData?.username || user?.username || "Bondiz User"}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: COLORS.pink }]}>
            <Text style={styles.statNumber}>{stats.likes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.cta }]}>
            <Text style={[styles.statNumber, { color: COLORS.black }]}>{stats.matchs}</Text>
            <Text style={[styles.statLabel, { color: COLORS.black }]}>Matchs</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.purple }]}>
            <Text style={styles.statNumber}>{stats.activities}</Text>
            <Text style={styles.statLabel}>Activités</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.pencilButton}
          onPress={() => {
            setEditName(profileData?.username || "");
            setEditBio(profileData?.bio || "");
            setEditModalVisible(true);
            modalY.value = 0;
          }}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {photos.map((item: string, index: number) => (
            <Image key={index} source={{ uri: item }} style={styles.miniPhoto} />
          ))}
          {photos.length === 0 && <Text style={{ color: COLORS.gray }}>Aucune photo</Text>}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
              <Pressable 
                style={StyleSheet.absoluteFill} 
                onPress={() => setEditModalVisible(false)} 
              />
              <Animated.View style={[styles.modalContent, modalStyle]}>
                <GestureDetector gesture={swipeGesture}>
                  <View style={{ width: "100%", paddingBottom: 10, paddingTop: 5, alignItems: "center" }}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Modifier mon profil</Text>
                  </View>
                </GestureDetector>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Prénom / Nom</Text>
                  <TextInput style={styles.textInput} value={editName} onChangeText={setEditName} placeholder="Votre nom" />
                  
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput style={[styles.textInput, { height: 100, textAlignVertical: "top" }]} value={editBio} onChangeText={setEditBio} placeholder="Décrivez-vous..." multiline />

                  <View style={{ marginTop: 20, marginBottom: 20 }}>
                    <Text style={styles.inputLabel}>Mes Photos (restez appuyé pour glisser)</Text>
                    <View style={styles.photoGridModal}>
                      {photos.map((item: string, index: number) => (
                        <DraggablePhoto 
                          key={item} 
                          uri={item} 
                          index={index}
                          onSwap={handleSwap}
                          totalCount={photos.length}
                        />
                      ))}
                      <TouchableOpacity style={styles.addPhotoSquareModal} onPress={handlePickImage} activeOpacity={0.7}>
                        <Ionicons name="add" size={30} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.purple }]} onPress={handleSaveAll} disabled={savingProfile}>
                    {savingProfile ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: "white", fontFamily: "Poppins_700Bold" }}>Enregistrer</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#eee" }]} onPress={() => setEditModalVisible(false)}>
                    <Text style={{ color: COLORS.black, fontFamily: "Poppins_700Bold" }}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </GestureHandlerRootView>
        </Modal>
      </ScrollView>
      <BottomNav currentRoute="profile" />
    </SafeAreaView>
  );
}

const DraggablePhoto = ({ uri, index, onSwap, totalCount }: any) => {
  const isDragging = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.1);
      zIndex.value = 100;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const GRID_SIZE = (width - 100) / 3 + 10;
      const colShift = Math.round(e.translationX / GRID_SIZE);
      const rowShift = Math.round(e.translationY / GRID_SIZE);
      const newIndex = index + colShift + (rowShift * 3);
      const clampedIndex = Math.max(0, Math.min(totalCount - 1, newIndex));

      if (clampedIndex !== index) {
        runOnJS(onSwap)(index, clampedIndex);
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;
      zIndex.value = 1;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View layout={Layout.springify()} entering={FadeIn} exiting={FadeOut} style={[styles.photoContainerModal, animatedStyle]}>
        <Image source={{ uri }} style={styles.photoImage} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { paddingHorizontal: 25, paddingTop: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  headerTitle: { fontSize: 28, fontFamily: "Poppins_700Bold", color: "black" },
  settingsButton: { width: 60, height: 45, backgroundColor: COLORS.purple, borderRadius: 10, justifyContent: "center", alignItems: "center", elevation: 3 },
  profileInfo: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  avatarContainer: { marginRight: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.gray },
  nameContainer: { flex: 1 },
  userName: { fontSize: 24, fontFamily: "Poppins_700Bold", color: "black" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  statBox: { width: (width - 70) / 3, height: 100, borderRadius: 15, justifyContent: "center", alignItems: "center", padding: 10, elevation: 3 },
  statNumber: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "white" },
  statLabel: { fontSize: 13, fontFamily: "Poppins_700Bold", color: "white", textAlign: "center" },
  pencilButton: { width: "100%", height: 50, borderRadius: 12, backgroundColor: COLORS.purple, justifyContent: "center", alignItems: "center", marginBottom: 30, elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: width - 40, height: height * 0.75, backgroundColor: "white", borderRadius: 30, padding: 20, elevation: 10, overflow: "hidden" },
  modalHandle: { width: 50, height: 5, backgroundColor: "#E0E0E0", borderRadius: 2.5, alignSelf: "center", marginBottom: 15 },
  modalTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", marginBottom: 20, textAlign: "center" },
  inputLabel: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.black, marginBottom: 8, marginTop: 15 },
  textInput: { backgroundColor: "#f9f9f9", borderRadius: 12, padding: 15, fontFamily: "Poppins_400Regular", fontSize: 15 },
  modalActions: { flexDirection: "row", gap: 15, marginTop: 20, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  modalBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  miniPhoto: { width: 60, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: COLORS.gray },
  photoGridModal: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: 10, marginTop: 10 },
  photoContainerModal: { width: (width - 100) / 3, height: (width - 100) / 3, borderRadius: 12, overflow: "hidden" },
  photoImage: { width: "100%", height: "100%", resizeMode: "cover" },
  addPhotoSquareModal: { width: (width - 100) / 3, height: (width - 100) / 3, backgroundColor: "#f5f5f5", borderRadius: 12, justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 2, borderColor: "#ddd" },
});
