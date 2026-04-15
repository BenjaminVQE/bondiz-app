import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import Input from "./components/Input";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = () => {
    if (!firstName || !email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au minimum 8 caractères");
      return;
    }

    // On ne crée pas encore le compte, on passe les données à l'étape suivante
    router.push({
      pathname: "/questionnaire",
      params: { firstName, email, password }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={globalStyles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.main} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: "33.33%" }]} />
          </View>

          <Text style={styles.stepText}>Étape 1/3</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté bondiz dès aujourd'hui</Text>
        </View>

        <View style={styles.form}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Input
            label="Prénom"
            placeholder="Jean"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            icon="person-outline"
          />

          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />
          <Text style={styles.passwordHint}>Minimum 8 caractères</Text>

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon="shield-checkmark-outline"
          />

          <TouchableOpacity
            style={[
              globalStyles.ctaButton,
              styles.registerButton,
            ]}
            onPress={handleRegister}
          >
            <Text style={globalStyles.ctaText}>
              Suivant
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.cta,
    borderRadius: 3,
  },
  stepText: {
    color: COLORS.cta,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 5,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.error,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  form: {
    marginTop: 10,
  },
  registerButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.cta,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  passwordHint: {
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    paddingLeft: 5,
  },
});
