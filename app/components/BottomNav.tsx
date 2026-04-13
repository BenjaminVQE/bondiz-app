import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface BottomNavProps {
  currentRoute: "home" | "messages" | "profile" | "activity";
}

const BottomNav = ({ currentRoute }: BottomNavProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNavWrapper, { bottom: 25 + insets.bottom }]}>
      <View style={styles.bottomNavBar}>
        <TouchableOpacity 
          style={[styles.navItem, currentRoute === "home" ? { backgroundColor: COLORS.cta } : { backgroundColor: COLORS.pink }]}
          onPress={() => router.replace("/home")}
        >
          <Ionicons 
            name={currentRoute === "home" ? "home" : "home-outline"} 
            size={28} 
            color={currentRoute === "home" ? COLORS.black : COLORS.main} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentRoute === "activity" ? { backgroundColor: COLORS.cta } : { backgroundColor: COLORS.pink }]}
          onPress={() => router.replace("/activity")}
        >
          <Ionicons 
            name={currentRoute === "activity" ? "happy" : "happy-outline"} 
            size={28} 
            color={currentRoute === "activity" ? COLORS.black : COLORS.main} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentRoute === "messages" ? { backgroundColor: COLORS.cta } : { backgroundColor: COLORS.pink }]}
          onPress={() => router.replace("/messages")}
        >
          <Ionicons 
            name={currentRoute === "messages" ? "chatbubble" : "chatbubble-outline"} 
            size={28} 
            color={currentRoute === "messages" ? COLORS.black : COLORS.main} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentRoute === "profile" ? { backgroundColor: COLORS.cta } : { backgroundColor: COLORS.pink }]}
          onPress={() => router.replace("/profile")}
        >
          <Ionicons 
            name={currentRoute === "profile" ? "person" : "person-outline"} 
            size={28} 
            color={currentRoute === "profile" ? COLORS.black : COLORS.main} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
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
