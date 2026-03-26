import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
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
import Input from "./components/Input";

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = [
    { label: "Homme", value: "homme" },
    { label: "Femme", value: "femme" },
    { label: "Autre", value: "autre" },
  ];

  const handleConfirm = async () => {
    if (!selectedGender || !age) return;

    try {
      setIsSubmitting(true);
      // TODO: Call an API endpoint to save the user's gender and age here if needed
      // await apiFetch("/users/me", { method: "PUT", body: JSON.stringify({ gender: selectedGender, age: parseInt(age, 10) }) });
      
      router.replace("/");
    } catch (error) {
      console.error("Failed to save data", error);
    } finally {
      setIsSubmitting(false);
    }
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
        <View style={styles.logoContainer}>
          <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>QUEL EST VOTRE GENRE ?</Text>

        <View style={styles.radioGroup}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() => setSelectedGender(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.radioCircle}>
                {selectedGender === option.value && (
                  <View style={styles.innerCircle} />
                )}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Input
            label="Quel est votre âge ?"
            placeholder="Ex: 25"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            icon="calendar-outline"
          />
        </View>

        <TouchableOpacity
          style={[
            globalStyles.ctaButton,
            styles.confirmButton,
            (!selectedGender || !age || isSubmitting) && { opacity: 0.5 },
          ]}
          onPress={handleConfirm}
          disabled={!selectedGender || !age || isSubmitting}
        >
          <Text style={globalStyles.ctaText}>
            {isSubmitting ? "Chargement..." : "Confirmer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    textAlign: "center",
    marginBottom: 40,
    textTransform: "uppercase",
  },
  radioGroup: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f98cd7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  innerCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#f98cd7",
  },
  radioLabel: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    width: 100,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 40,
  },
  confirmButton: {
    width: "100%",
    height: 55,
    borderRadius: 20,
  },
});
