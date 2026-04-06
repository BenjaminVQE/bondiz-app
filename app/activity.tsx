import { COLORS } from "@/constants/Colors";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "./components/BottomNav";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";

const { width, height } = Dimensions.get("window");

// Mock data based on the screenshot
const MOCK_ACTIVITIES = [
  {
    id: 1,
    title: "La Flèche",
    subtitle: "Super bar",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400",
    time: "08",
    people: "02",
    price: "15",
    date: new Date().toISOString()
  },
  {
    id: 2,
    title: "Bowling",
    subtitle: "Les Quilles",
    image: "https://images.unsplash.com/photo-1544178170-79a7dc5f870a?w=400",
    time: "85",
    people: "05",
    price: "18",
    date: new Date().toISOString()
  },
  {
    id: 3,
    title: "Escalade",
    subtitle: "Grimpe",
    image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400",
    time: "60",
    people: "03",
    price: "11",
    date: new Date().toISOString()
  }
];

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState<any[]>(MOCK_ACTIVITIES);
  const [filteredActivities, setFilteredActivities] = useState<any[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, selectedDate, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fall back to mock if it fails or returns empty
      const res = await apiFetch<any>("/activities?populate=*");
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map((item: any) => ({
          id: item.id,
          title: item.attributes.name,
          subtitle: item.attributes.description,
          image: item.attributes.image?.data?.attributes?.url 
            ? `${STRAPI_BASE_URL}${item.attributes.image.data.attributes.url}`
            : "https://via.placeholder.com/150",
          time: item.attributes.duration || "00",
          people: item.attributes.capacity || "00",
          price: item.attributes.price || "00",
          date: item.attributes.date
        }));
        setActivities(formatted);
      }
    } catch (error) {
      console.log("Using mock activities as API failed");
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
    <View style={styles.card}>
      <View style={styles.imageOverlayContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
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
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color="white" />
            <Text style={styles.statText}>{item.time}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color="white" />
            <Text style={styles.statText}>{item.people}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statText}>€ {item.price}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ACTIVITÉS</Text>
        <TouchableOpacity style={styles.calendarButton} onPress={showDatePicker} activeOpacity={0.8}>
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
  }
});
