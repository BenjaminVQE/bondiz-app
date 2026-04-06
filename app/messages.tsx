import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./components/BottomNav";

const MessagesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.placeholderContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubbles-outline" size={60} color={COLORS.main} />
        </View>
        <Text style={styles.placeholderTitle}>Bientôt disponible !</Text>
        <Text style={styles.placeholderSubtitle}>
          Nous préparons un espace de discussion pour que vous puissiez échanger avec vos matchs.
        </Text>
      </View>

      <BottomNav currentRoute="messages" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 80,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef1f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  placeholderTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "black",
    textAlign: "center",
    marginBottom: 15,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default MessagesScreen;
