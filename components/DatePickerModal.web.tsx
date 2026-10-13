import { COLORS } from "@/constants/Colors";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// react-native-modal-datetime-picker n'a pas de version web : on reprend ses
// props principales autour d'un champ date/heure du navigateur.
type Props = {
  isVisible: boolean;
  mode?: "date" | "time";
  date?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toDateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function DatePickerModal(props: Props) {
  return (
    <Modal visible={props.isVisible} transparent animationType="fade" onRequestClose={props.onCancel}>
      {/* Monté à chaque ouverture pour repartir de la valeur initiale. */}
      {props.isVisible && <PickerCard {...props} />}
    </Modal>
  );
}

function PickerCard({ mode = "date", date, minimumDate, maximumDate, onConfirm, onCancel }: Props) {
  const isTime = mode === "time";
  const [value, setValue] = useState(() => {
    let initial = date ?? new Date();
    if (!isTime && maximumDate && initial > maximumDate) initial = maximumDate;
    if (!isTime && minimumDate && initial < minimumDate) initial = minimumDate;
    return isTime ? toTimeValue(initial) : toDateValue(initial);
  });

  const handleConfirm = () => {
    if (!value) return;
    if (isTime) {
      const [hours, minutes] = value.split(":").map(Number);
      const result = new Date();
      result.setHours(hours, minutes, 0, 0);
      onConfirm(result);
    } else {
      const [year, month, day] = value.split("-").map(Number);
      onConfirm(new Date(year, month - 1, day));
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <input
          type={isTime ? "time" : "date"}
          aria-label={isTime ? "Heure" : "Date"}
          value={value}
          min={!isTime && minimumDate ? toDateValue(minimumDate) : undefined}
          max={!isTime && maximumDate ? toDateValue(maximumDate) : undefined}
          onChange={(e) => setValue(e.target.value)}
          style={inputStyle}
        />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={onCancel}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, !value && styles.disabled]}
            onPress={handleConfirm}
            disabled={!value}
          >
            <Text style={styles.confirmText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "Poppins_400Regular, sans-serif",
  fontSize: 18,
  padding: 12,
  borderRadius: 12,
  border: `1px solid ${COLORS.gray}`,
  width: "100%",
  boxSizing: "border-box",
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: COLORS.purple,
  },
  disabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontFamily: "Poppins_500Medium",
    color: COLORS.black,
  },
  confirmText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
});
