import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Mock data for display based on image
  const stats = {
    messages: 15,
    matchs: 25,
    activities: 22,
  };

  const placeholderPhotos = [1, 2, 3]; // Used for the photo grid

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
              source={user?.image ? { uri: user.image } : require("../assets/images/placeholder_user.png")}
              style={styles.avatar}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{user?.username || "Albert Deschamps"}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: COLORS.pink }]}>
            <Text style={styles.statNumber}>{stats.messages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.cta }]}>
            <Text style={styles.statNumber}>{stats.matchs}</Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.purple }]}>
            <Text style={styles.statNumber}>{stats.activities}</Text>
            <Text style={styles.statLabel}>Activités</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="pencil" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="image" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {placeholderPhotos.map((item) => (
            <View key={item} style={styles.photoContainer}>
              <View style={styles.photoPlaceholder} />
            </View>
          ))}
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
    justifyContent: "space-between",
  },
  photoContainer: {
    width: (width - 70) / 3,
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
});
