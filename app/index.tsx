import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import React from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <View style={[globalStyles.container, globalStyles.center]}>
      <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
      
      {user ? (
        <>
          <Text style={[globalStyles.ctaText, { color: 'white', marginBottom: 20 }]}>
            Bienvenue, {user.username} !
          </Text>
          <TouchableOpacity 
            style={[globalStyles.ctaButton, { marginTop: 15 }]}
            onPress={logout}
          >
            <Text style={globalStyles.ctaText}>Se déconnecter</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity 
            style={[globalStyles.ctaButton, { marginTop: 15 }]}
            onPress={() => router.push("/login")}
          >
            <Text style={globalStyles.ctaText}>Se connecter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[globalStyles.ctaButton, globalStyles.secondaryButton, { marginTop: 15 }]}
            onPress={() => router.push("/register")}
          >
            <Text style={[globalStyles.ctaText, globalStyles.secondaryText]}>S'inscrire</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
});

