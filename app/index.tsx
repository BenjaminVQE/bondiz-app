import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { IMAGES } from "./constants/Image";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 secondes de chargement

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initialisation de Bondiz...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ marginTop: 10, color: "blue" }}>Se connecter</Text>
      <Text style={{ marginTop: 10, color: "blue" }}>S'inscrire</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});
