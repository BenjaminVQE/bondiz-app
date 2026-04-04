import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { globalStyles } from "@/constants/Styles";
import { IMAGES } from "@/constants/Image";
import LoadingSpinner from "./components/loading";
import { AuthProvider } from "../context/AuthContext";
import { COLORS } from "@/constants/Colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      
      // Simulation du chargement initial (3 secondes)
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  if (!isAppReady) {
    return (
      <View style={[globalStyles.container, globalStyles.center]}>
        <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.purple } }} />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
});
