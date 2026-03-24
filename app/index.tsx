import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import LoadingSpinner from "./components/loading";

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
      <View style={[globalStyles.container, globalStyles.center]}>
        <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, globalStyles.center]}>
      <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
      
      <TouchableOpacity style={[globalStyles.ctaButton, { marginTop: 15 }]}>
        <Text style={globalStyles.ctaText}>Se connecter</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[globalStyles.ctaButton, globalStyles.secondaryButton, { marginTop: 15 }]}>
        <Text style={[globalStyles.ctaText, globalStyles.secondaryText]}>S'inscrire</Text>
      </TouchableOpacity>
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

