import { StyleSheet } from "react-native";
import { COLORS } from "./Colors";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButton: {
    backgroundColor: COLORS.cta,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: COLORS.black,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.pink,
  },
  secondaryText: {
    color: COLORS.main,
    fontFamily: "Poppins_700Bold",
  },
  text: {
    fontFamily: "Poppins_400Regular",
  },
});
