import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { calculateAge } from "../utils/date";

const { width, height } = Dimensions.get("window");

const MOCK_USERS = [
  {
    id: 999,
    username: "ABIGAIL BONDIZ",
    age: "1999-01-01",
    gender: "femme",
    city: "Paris",
    interests: ["accrobranche", "bowling"]
  }
];

const HomeScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      router.replace("/welcome");
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any[]>("/users");
      const filtered = data.filter((u: any) => u.id !== user?.id);
      setUsers(filtered.length > 0 ? filtered : MOCK_USERS);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.center]}>
        <ActivityIndicator size="large" color={COLORS.cta} />
      </View>
    );
  }

  const currentUser = users[currentIndex];
  const userAge = calculateAge(currentUser?.age);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Image
        source={currentUser?.image ? { uri: currentUser.image } : require("../assets/images/placeholder_user.png")}
        style={styles.backgroundImage}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.content}>
        <View style={styles.topBar} />

        <View style={[styles.bottomInfoContainer, { paddingBottom: 130 + insets.bottom }]}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUser?.username?.toUpperCase() || "UTILISATEUR"}
            </Text>
            <Text style={styles.userAge}>
              {userAge} Ans
            </Text>
            <Text style={styles.userBio}>
              {currentUser?.interests && currentUser.interests.length > 0 
                ? `J'aime ${currentUser.interests.slice(0, 2).join(" et le ")}`
                : "Rejoignez-moi pour une activité !"}
            </Text>
          </View>

          <View style={styles.interactions}>
            <TouchableOpacity style={styles.interactionButton}>
              <Ionicons name="heart" size={40} color="white" />
            </TouchableOpacity>
            <View style={styles.activityCounter}>
              <Text style={styles.activityText}>25 Act</Text>
            </View>
            <View style={styles.paginationDots}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>

        <View style={[styles.bottomNavWrapper, { bottom: 25 + insets.bottom }]}>
          <View style={styles.bottomNavBar}>
            <TouchableOpacity style={[styles.navItem, { backgroundColor: COLORS.cta }]}>
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
              onPress={() => router.replace("/profile")}
            >
              <Ionicons name="person-outline" size={28} color={COLORS.main} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  bottomInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 25,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  userAge: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 5,
  },
  userBio: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "white",
    opacity: 0.9,
  },
  interactions: {
    alignItems: "center",
  },
  interactionButton: {
    marginBottom: 10,
  },
  activityCounter: {
    marginBottom: 15,
  },
  activityText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "white",
    width: 8,
    height: 8,
    borderRadius: 4,
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
