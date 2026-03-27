import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "@/constants/Colors";
import { globalStyles } from "@/constants/Styles";

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth(); // Assume isLoading exists or handle it

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/home");
      } else {
        router.replace("/welcome");
      }
    }
  }, [user, isLoading]);

  return (
    <View style={[globalStyles.container, globalStyles.center]}>
      <ActivityIndicator size="large" color={COLORS.cta} />
    </View>
  );
}

