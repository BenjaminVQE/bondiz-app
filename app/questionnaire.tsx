import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "../context/AuthContext";
import Input from "./components/Input";

const INTERESTS_CATEGORIES = [
  {
    title: "Sport & Bien-être",
    interests: ["Sport", "Randonnée", "Yoga", "Méditation", "Danse"],
    icon: "fitness-outline"
  },
  {
    title: "Art & Créativité",
    interests: ["Dessin", "Photographie", "Musique", "Théâtre", "Bricolage"],
    icon: "color-palette-outline"
  },
  {
    title: "Loisirs & Sorties",
    interests: ["Cinéma", "Voyage", "Gaming", "Lecture", "Mode"],
    icon: "ticket-outline"
  },
  {
    title: "Nature & Passions",
    interests: ["Jardinage", "Astronomie", "Animaux", "Volontariat", "Cuisine"],
    icon: "leaf-outline"
  }
];

export default function QuestionnaireScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ firstName: string; email: string; password: string }>();
  const { register } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [city, setCity] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([INTERESTS_CATEGORIES[0].title]);
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = [
    { label: "Homme", value: "homme" },
    { label: "Femme", value: "femme" },
  ];

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    setBirthdate(date);
    hideDatePicker();
  };

  const toggleCategory = (title: string) => {
    if (expandedCategories.includes(title)) {
      setExpandedCategories(expandedCategories.filter(t => t !== title));
    } else {
      setExpandedCategories([...expandedCategories, title]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR");
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedGender || !birthdate) return;
      setCurrentStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!city || selectedInterests.length < 5) {
      setError("Veuillez renseigner votre ville et choisir au moins 5 intérêts.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const { firstName, email, password } = params;
      
      if (!firstName || !email || !password) {
        throw new Error("Informations d'inscription manquantes. Veuillez recommencer.");
      }

      // Formatage de la date en YYYY-MM-DD pour Strapi
      const formattedDate = birthdate?.toISOString().split("T")[0];

      await register(firstName, email, password, {
        gender: selectedGender || undefined,
        age: formattedDate,
        city,
        interests: selectedInterests,
      });
      
      router.replace("/");
    } catch (err: any) {
      console.error("Failed to register user", err);
      setError(err.message || "Impossible de finaliser votre inscription.");
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

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: currentStep === 1 ? "66.66%" : "100%" }]} />
        </View>

        {currentStep === 1 ? (
          <>
            <Text style={styles.stepText}>Étape 2/3</Text>
            <Text style={styles.title}>QUEL EST VOTRE GENRE ?</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

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
              <TouchableOpacity onPress={showDatePicker} activeOpacity={0.7}>
                <View pointerEvents="none">
                  <Input
                    label="Quelle est votre date de naissance ?"
                    placeholder="JJ/MM/AAAA"
                    value={formatDate(birthdate)}
                    editable={false}
                    icon="calendar-outline"
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                globalStyles.ctaButton,
                styles.confirmButton,
                (!selectedGender || !birthdate) && { opacity: 0.5 },
              ]}
              onPress={handleNext}
              disabled={!selectedGender || !birthdate}
            >
              <Text style={globalStyles.ctaText}>Suivant</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stepText}>Étape 3/3</Text>
            <Text style={styles.title}>Dites-nous en plus</Text>
            <Text style={styles.stepTitle}>Où habitez-vous ?</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.inputContainer}>
              <Input
                placeholder="Ex: Paris"
                value={city}
                onChangeText={setCity}
                icon="location-outline"
              />
            </View>

            <Text style={styles.stepTitle}>Quels sont vos centres d'intérêt ?</Text>
            <Text style={styles.counterText}>Sélectionnez au moins 5 ({selectedInterests.length}/5)</Text>

            <View style={styles.categoriesContainer}>
              {INTERESTS_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories.includes(category.title);
                const selectedInCategory = category.interests.filter(i => selectedInterests.includes(i)).length;
                
                return (
                  <View key={category.title} style={styles.categoryWrapper}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => toggleCategory(category.title)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.headerLeft}>
                        <Ionicons name={category.icon as any} size={20} color={COLORS.pink} style={styles.categoryIcon} />
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                        {selectedInCategory > 0 && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{selectedInCategory}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={COLORS.main} 
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.interestsGrid}>
                        {category.interests.map((interest) => {
                          const isSelected = selectedInterests.includes(interest);
                          return (
                            <TouchableOpacity
                              key={interest}
                              style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                              onPress={() => toggleInterest(interest)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                                {interest}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.backButton]}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  globalStyles.ctaButton,
                  styles.confirmButtonStep2,
                  (!city || selectedInterests.length < 5 || isSubmitting) && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                disabled={!city || selectedInterests.length < 5 || isSubmitting}
              >
                <Text style={globalStyles.ctaText}>
                  {isSubmitting ? "Chargement..." : "Confirmer"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          confirmTextIOS="Confirmer"
          cancelTextIOS="Annuler"
          locale="fr-FR"
          maximumDate={new Date()}
        />
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
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    textAlign: "center",
    marginBottom: 40,
    textTransform: "uppercase",
  },
  errorText: {
    color: "#ff4444",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
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
  stepTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  counterText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  categoriesContainer: {
    width: "100%",
    marginBottom: 20,
  },
  categoryWrapper: {
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: COLORS.main,
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: COLORS.pink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    padding: 10,
    paddingTop: 0,
    marginBottom: 10,
  },
  interestChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(249, 140, 215, 0.8)", // Vibrant COLORS.pink
    margin: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  interestChipSelected: {
    backgroundColor: COLORS.cta,
    borderColor: COLORS.cta,
    elevation: 5,
    shadowColor: COLORS.cta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  interestText: {
    color: COLORS.main,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  interestTextSelected: {
    fontFamily: "Poppins_700Bold",
    color: COLORS.black,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  confirmButton: {
    width: "100%",
    height: 55,
    borderRadius: 20,
  },
  confirmButtonStep2: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    marginLeft: 10,
  },
});
