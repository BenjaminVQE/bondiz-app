import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";
import BottomNav from "./components/BottomNav";

const { width, height } = Dimensions.get("window");

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, selectedDate, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any>("/activities?populate=*");
      if (res.data) {
        const formatted = res.data.map((item: any) => {
          // Handle both Strapi v4 and flattened v5 data
          const imageObj = item.image || item.attributes?.image?.data || item.attributes?.media?.data;
          const imageUrl = imageObj?.url || imageObj?.attributes?.url || imageObj?.formats?.small?.url || imageObj?.formats?.thumbnail?.url;

          const finalImageUrl = imageUrl
            ? (imageUrl.startsWith("http") ? imageUrl : `${STRAPI_BASE_URL}${imageUrl}`)
            : null;

          return {
            id: item.id,
            title: item.title || item.attributes?.title || "Activité",
            subtitle: item.description || item.attributes?.description || "",
            image: finalImageUrl,
            location: item.location || item.attributes?.location || "Lieu non précisé",
            participantsCount: (item.participants?.length || item.attributes?.participants?.data?.length || 0),
            maxParticipants: item.maxParticipants || item.attributes?.maxParticipants || 0,
            date: item.date || item.attributes?.date
          };
        });
        setActivities(formatted);
      }
    } catch (error) {
      console.error("Activities API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...activities];

    if (search) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedDate) {
      const selectedStr = selectedDate.toISOString().split("T")[0];
      filtered = filtered.filter(a => a.date && a.date.startsWith(selectedStr));
    }

    setFilteredActivities(filtered);
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedDate(null);
  };

  const ActivityCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedActivity(item)}
      activeOpacity={0.9}
    >
      <View style={styles.imageOverlayContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: COLORS.gray }]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <LinearGradient
        colors={["#8A4FFF", "#7037FF"]}
        style={styles.cardInfo}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="location-outline" size={16} color="white" />
            <Text style={styles.statText} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const ActivityDetailModal = () => (
    <Modal
      visible={!!selectedActivity}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedActivity(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalImageContainer}>
              {selectedActivity?.image ? (
                <Image source={{ uri: selectedActivity.image }} style={styles.modalImage} />
              ) : (
                <View style={[styles.modalImage, { backgroundColor: COLORS.gray }]} />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedActivity(null)}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.modalImageGradient}
              />
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalTitle}>{selectedActivity?.title}</Text>

              <View style={styles.modalLocationContainer}>
                <Ionicons name="location" size={20} color={COLORS.purple} />
                <Text style={styles.modalLocation}>{selectedActivity?.location}</Text>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalDescriptionTitle}>À propos</Text>
              <Text style={styles.modalDescription}>{selectedActivity?.subtitle}</Text>

            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ACTIVITÉS</Text>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => router.push("/agenda")}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={24} color="white" />
          {selectedDate && <View style={styles.dateDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
        {(search || selectedDate) ? (
          <TouchableOpacity onPress={clearFilters}>
            <Ionicons name="close-circle" size={22} color="#999" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="close-circle" size={22} color="#EEE" />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.purple} />
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={({ item }) => <ActivityCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Aucune activité pour cette date</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={{ color: COLORS.pink, marginTop: 10, fontFamily: "Poppins_700Bold" }}>Voir toutes les activités</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      <BottomNav currentRoute="activity" />
      <ActivityDetailModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  calendarButton: {
    width: 60,
    height: 50,
    backgroundColor: COLORS.pink,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  dateDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFD700",
    borderWidth: 2,
    borderColor: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    marginHorizontal: 25,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "black",
    height: "100%",
  },
  list: {
    paddingHorizontal: 25,
  },
  card: {
    flexDirection: "row",
    height: 120,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  imageOverlayContainer: {
    width: "42%",
    height: "100%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    width: "58%",
    padding: 15,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "90%",
    paddingBottom: 20,
    overflow: "hidden",
  },
  modalImageContainer: {
    width: "100%",
    height: 350,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  modalInfo: {
    padding: 25,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
    marginBottom: 10,
  },
  modalLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalLocation: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    marginLeft: 8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 20,
  },
  modalDescriptionTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "black",
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    lineHeight: 24,
    marginBottom: 25,
  },
  modalStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderRadius: 20,
  },
  modalStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalStatText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  modalFooterButton: {
    marginHorizontal: 25,
    height: 60,
    backgroundColor: COLORS.purple,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalFooterButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  }
});
