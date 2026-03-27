import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "@/constants/Colors";

const WelcomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/home");
    }
  }, [user]);

  return (
    <View style={[globalStyles.container, globalStyles.center, styles.container]}>
      <StatusBar barStyle="light-content" />
      <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
      
      <Text style={styles.tagline}>Rencontrez du monde pour vos activités !</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[globalStyles.ctaButton, styles.loginButton]}
          onPress={() => router.push("/login")}
        >
          <Text style={globalStyles.ctaText}>Se connecter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[globalStyles.ctaButton, globalStyles.secondaryButton, styles.registerButton]}
          onPress={() => router.push("/register")}
        >
          <Text style={[globalStyles.ctaText, globalStyles.secondaryText]}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    color: "white",
    textAlign: "center",
    marginBottom: 60,
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    marginBottom: 15,
    height: 60,
    borderRadius: 30,
  },
  registerButton: {
    height: 60,
    borderRadius: 30,
  },
});
