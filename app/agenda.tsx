import { COLORS } from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

// Helper to generate dates for the horizontal selector
const getDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = -7; i <= 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date: Date) => {
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  return {
    dayNum: date.getDate().toString(),
    dayName: days[date.getDay()]
  };
};

export default function AgendaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dateList = getDates();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchMyActivities();
    // Center today's date (index 7 in a list of 15 items)
    // Item width is 65 + 10 (margins) = 75. 
    // Padding horizontal is 15.
    const itemWidth = 75;
    const padding = 15;
    const centerOffset = (7 * itemWidth) + padding - (width / 2) + (itemWidth / 2);
    
    setTimeout(() => {
       scrollRef.current?.scrollTo({ x: centerOffset, animated: true });
    }, 300);
  }, []);

  const fetchMyActivities = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch bookings with simplified population for activity to troubleshoot missing field
      // Using populate=* for the first level and specifically nested for images
      const res = await apiFetch<any>(
        `/bookings?filters[$or][0][user][id][$eq]=${user.id}&filters[$or][1][organizer][id][$eq]=${user.id}&filters[$or][2][participants][id][$eq]=${user.id}&populate=*&populate[activity]=*&populate[participants][populate]=self_image&populate[organizer][populate]=self_image`, 
        {}, 
        token!
      );
      
      if (res.data) {
        if (res.data.length > 0) {
          console.log("DEBUG - First Booking found:", JSON.stringify(res.data[0], null, 2));
        }
        
        const mappedActivities = res.data.map((booking: any) => {
          const bData = booking.attributes || booking;
          // In Strapi v5 flattened, activity might be directly bData.activity
          const actObj = bData.activity?.data || bData.activity;
          
          if (!actObj) {
            console.log(`Booking ${booking.id} is missing activity data. Keys present:`, Object.keys(bData));
          }
          
          const actData = actObj?.attributes || actObj || {};
          
          // Organizer details with image
          const organizerObj = bData.organizer?.data || bData.organizer;
          const organizerData = organizerObj?.attributes || organizerObj;
          const isOrganizer = organizerObj?.id === user.id;
          
          const getAvatarUrl = (p: any) => {
            const pData = p.attributes || p;
            const imgUrl = pData.self_image?.url || pData.self_image?.data?.attributes?.url || pData.self_image?.data?.[0]?.url || pData.self_image?.[0]?.url;
            return imgUrl ? `${STRAPI_BASE_URL}${imgUrl}` : `https://i.pravatar.cc/100?u=${p.id}`;
          };

          const organizerAvatar = organizerData ? getAvatarUrl(organizerData) : null;
          
          const participantsList = bData.participants?.data || bData.participants || [];
          const participantAvatars = participantsList
            .filter((p: any) => p.id !== organizerObj?.id)
            .map((p: any) => getAvatarUrl(p));

          const avatars = [organizerAvatar, ...participantAvatars].filter(Boolean);

          // Format time to HH:mm
          const rawTime = bData.time || "10:00";
          const formattedTime = rawTime.includes(":") ? rawTime.split(":").slice(0, 2).join(":") : rawTime;

          return {
            id: booking.id,
            title: actData.title || actData.attributes?.title || "Sans titre",
            description: actData.description || actData.attributes?.description || "",
            time: formattedTime,
            date: bData.date || actData.date,
            isOrganizer,
            isParticipant: !isOrganizer,
            avatars,
            bookingState: bData.state
          };
        }).filter(Boolean);
        
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error("Agenda fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(a => {
    if (!a.date) return false;
    // Handle both string dates "YYYY-MM-DD" and Date objects
    const activityDateStr = typeof a.date === 'string' ? a.date.split('T')[0] : a.date.toISOString().split('T')[0];
    const selectedStr = selectedDate.toISOString().split('T')[0];
    return activityDateStr === selectedStr;
  });

  const ActivityItem = ({ item }: { item: any }) => (
    <View style={styles.activityRow}>
      <View style={styles.timeContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeText}>{item.time || "10:00"}</Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activitySubtitle}>{item.description}</Text>
          
          <View style={styles.avatarRow}>
            {(item.avatars || []).map((uri: string, idx: number) => (
              <Image key={idx} source={{ uri }} style={styles.avatar} />
            ))}
          </View>

          {item.isOrganizer && (
            <MaterialCommunityIcons name="star-four-points" size={45} color="#D4FF00" style={styles.cardStarTop} />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>AGENDA</Text>
      </View>

      <View style={styles.dateSelectorContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        >
          {dateList.map((date, index) => {
            const { dayNum, dayName } = formatDate(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateItem, isSelected && styles.selectedDateItem]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateNum, isSelected && styles.selectedDateText]}>{dayNum}</Text>
                <Text style={[styles.dateName, isSelected && styles.selectedDateText]}>{dayName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.label}>Heure</Text>
        <Text style={styles.label}>Activité</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.pink} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={({ item }) => <ActivityItem item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.activityList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune activité prévue pour ce jour</Text>
          }
        />
      )}
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  dateSelectorContainer: {
    height: 100,
    marginBottom: 20,
  },
  dateList: {
    paddingHorizontal: 15,
    alignItems: "center",
  },
  dateItem: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#FDC8D5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "white",
  },
  selectedDateItem: {
    backgroundColor: COLORS.pink,
    height: 75,
    width: 75,
    borderRadius: 37.5,
    marginTop: -5,
  },
  dateNum: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  dateName: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "white",
    marginTop: -4,
  },
  selectedDateText: {
    color: "white",
  },
  labelsRow: {
    flexDirection: "row",
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  label: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "black",
    width: 100,
  },
  activityList: {
    paddingHorizontal: 20,
    paddingTop: 20, // Add space for the first "overflow" star
    paddingBottom: 40,
  },
  activityRow: {
    flexDirection: "row",
    marginBottom: 25,
    overflow: "visible", // Added explicitly for safety
  },
  timeContainer: {
    width: 100,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 10,
  },
  timeBox: {
    backgroundColor: "#EBFF00",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 2,
  },
  timeText: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  timeStar: {
    position: "absolute",
    right: -10,
    top: "50%",
    marginTop: 0,
    zIndex: 1,
  },
  cardContainer: {
    flex: 1,
    marginLeft: 0,
  },
  activityCard: {
    backgroundColor: "#FF85BC",
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Removed overflow: hidden to allow stars to stick out
  },
  activityTitle: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 0,
  },
  activitySubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "white",
    opacity: 1,
    marginBottom: 15,
  },
  avatarRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: -8,
  },
  cardStarTop: {
    position: "absolute",
    top: -20,
    right: -15,
    zIndex: 10,
  },
  cardStarBottom: {
    position: "absolute",
    bottom: -25,
    right: -15,
    zIndex: 10,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    color: "#999",
    marginTop: 50,
  }
});
