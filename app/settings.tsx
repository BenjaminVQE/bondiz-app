import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/welcome");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
          passwordConfirmation: confirmPassword,
        }),
      }, token || undefined);
      
      Alert.alert("Succès", "Votre mot de passe a été modifié avec succès.");
      setIsPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la modification du mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  const openNotificationSettings = () => {
    Linking.openSettings();
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
              Pour toute demande, contactez notre délégué à la protection des données : bondizmydsu@gmail.com
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color={COLORS.purple} />
            <Text style={styles.sectionTitle}>Mon Compte</Text>
          </View>
          <TouchableOpacity 
            style={styles.cardItem} 
            onPress={() => setIsPasswordModalVisible(true)}
          >
            <Text style={styles.cardItemText}>Modifier le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cardItem} 
            onPress={openNotificationSettings}
          >
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
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier mot de passe</Text>
              <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="********"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(v => !v)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={COLORS.gray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min. 8 caractères"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(v => !v)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={COLORS.gray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="********"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(v => !v)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={COLORS.gray}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={handlePasswordChange}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Chargement..." : "MODIFIER"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: COLORS.black,
  },
  modalBody: {
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: COLORS.gray,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    overflow: "hidden",
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  saveButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
});
