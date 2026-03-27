import { COLORS } from "@/constants/Colors";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/welcome");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PARAMÈTRES</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.purple} />
            <Text style={styles.sectionTitle}>Protection des données (RGPD)</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Chez Bondiz, nous prenons votre vie privée au sérieux. Conformément au RGPD, vous disposez des droits suivants :
            </Text>
            <View style={styles.bulletPoint}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Droit d'accès à vos données</Text>
            </View>
            <View style={styles.bulletPoint}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Droit de rectification</Text>
            </View>
            <View style={styles.bulletPoint}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Droit à l'effacement (droit à l'oubli)</Text>
            </View>
            <View style={styles.bulletPoint}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Droit à la portabilité</Text>
            </View>
            <Text style={styles.cardFooter}>
              Pour toute demande, contactez notre délégué à la protection des données : privacy@bondiz.app
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color={COLORS.purple} />
            <Text style={styles.sectionTitle}>Mon Compte</Text>
          </View>
          <TouchableOpacity style={styles.cardItem}>
            <Text style={styles.cardItemText}>Modifier le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardItem}>
            <Text style={styles.cardItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0 (Bondiz App)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.black,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.black,
  },
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    padding: 20,
  },
  cardText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.purple,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: COLORS.black,
  },
  cardFooter: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.gray,
    marginTop: 15,
    fontStyle: "italic",
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  cardItemText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: COLORS.black,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.pink, // Or error red
    padding: 18,
    borderRadius: 30,
    gap: 10,
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoutText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  versionText: {
    textAlign: "center",
    color: "#CCC",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
