import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface MatchNotificationProps {
  visible: boolean;
  matchedUser: any;
  onClose: () => void;
}

const MatchNotification = ({ visible, matchedUser, onClose }: MatchNotificationProps) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, insets.top]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!matchedUser && !visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleClose}>
        <LinearGradient
          colors={[COLORS.main, COLORS.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart" size={24} color="white" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>C'est un Match ! 🎊</Text>
              <Text style={styles.subtitle}>
                Dites bonjour à {matchedUser?.username || "votre nouveau partenaire"}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 15,
    right: 15,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  gradient: {
    borderRadius: 20,
    padding: 15,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "white",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "white",
    opacity: 0.9,
  },
  closeBtn: {
    padding: 5,
  },
});

export default MatchNotification;
