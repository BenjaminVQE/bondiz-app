import { Alert, Platform } from "react-native";

// Alert.alert ne fait rien sur react-native-web.
export function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
