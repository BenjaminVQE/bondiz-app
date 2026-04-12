import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, STRAPI_BASE_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Modal,
  ScrollView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const ChatScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // matchId
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Event Creation States
  const [activities, setActivities] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const isRedirecting = useRef(false);

  const fetchData = async () => {
    if (!user || !token || !id || isRedirecting.current) return;
    try {
      // 1. Fetch Match Info
      const matchRes = await apiFetch<any>(
        `/matches?filters[id][$eq]=${id}&populate[user1][populate]=self_image&populate[user2][populate]=self_image&publicationState=live`,
        {},
        token
      );
      
      let other = null;
      if (matchRes.data && matchRes.data.length > 0) {
        const matchData = matchRes.data[0];
        const mData = matchData.attributes || matchData;
        setMatchInfo(mData);
        
        const u1 = mData.user1?.data || mData.user1;
        const u2 = mData.user2?.data || mData.user2;

        const u1Id = Number(u1?.id || u1?.attributes?.id);
        const currentUserId = Number(user.id);

        other = (u1Id === currentUserId) ? u2 : u1;
        setOtherUser(other);
      }

      if (other) {
        // 2. Fetch Message History
        const msgRes = await apiFetch<any>(
          `/messages?filters[$or][0][$and][0][sender][id][$eq]=${user.id}&filters[$or][0][$and][1][recipient][id][$eq]=${other.id}&filters[$or][1][$and][0][sender][id][$eq]=${other.id}&filters[$or][1][$and][1][recipient][id][$eq]=${user.id}&populate=*&sort=createdAt:asc&publicationState=live`,
          {},
          token
        );
        
        if (msgRes.data) {
          setMessages(msgRes.data);
        }
      }
    } catch (error: any) {
      console.error("Chat fetch error:", error);
      const errStr = error.toString();
      if (errStr.includes("404")) {
        isRedirecting.current = true;
        setLoading(false);
        router.replace("/messages");
      }
    } finally {
      if (!isRedirecting.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    fetchData();
    fetchActivities();
    const interval = setInterval(fetchData, 4000); 
    return () => clearInterval(interval);
  }, [id]);

  const fetchActivities = async () => {
    try {
      const res = await apiFetch<any>("/activities?populate=*");
      if (res.data) {
        setActivities(res.data);
      }
    } catch (error) {
      console.error("Fetch activities error:", error);
    }
  };

  const handleCreateBooking = async (time: Date) => {
    if (!selectedActivity || !bookingDate || !otherUser || !token) return;

    setIsCreatingEvent(true);
    try {
      const dateStr = bookingDate.toISOString().split("T")[0];
      const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          data: {
            activity: { connect: [selectedActivity.id] },
            organizer: { connect: [user?.id] },
            participants: { connect: [otherUser.id] },
            date: dateStr,
            time: timeStr,
            state: "pending"
          }
        })
      }, token);

      setShowEventModal(false);
      setSelectedActivity(null);
      setBookingDate(null);
      
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({
          data: {
            content: `📅 Nouvel événement créé : ${selectedActivity.attributes?.title || selectedActivity.title} le ${dateStr} à ${timeStr} ! ✨`,
            sender: user?.id,
            recipient: otherUser.id,
            sentAt: new Date().toISOString()
          }
        })
      }, token);
      
      fetchData();
    } catch (error) {
      console.error("Create booking error:", error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !otherUser || !token) return;
    
    const tempText = messageText;
    setMessageText("");

    try {
      await apiFetch<any>(
        "/messages",
        {
          method: "POST",
          body: JSON.stringify({
            data: {
              content: tempText,
              sender: user?.id,
              recipient: otherUser.id,
              isRead: false,
              sentAt: new Date().toISOString()
            }
          })
        },
        token
      );
      fetchData(); 
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const getAvatarUrl = (userData: any) => {
    const data = userData?.attributes || userData;
    const imgUrl = data?.self_image?.url || 
                   data?.self_image?.data?.attributes?.url || 
                   data?.self_image?.[0]?.url ||
                   data?.self_image?.data?.[0]?.url;
    return imgUrl ? `${STRAPI_BASE_URL}${imgUrl}` : `https://i.pravatar.cc/150?u=${userData?.id}`;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const mData = item.attributes || item;
    const isMe = (mData.sender?.data?.id || mData.sender?.id) === user?.id;
    
    return (
      <View style={[
        styles.messageContainer, 
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble, 
          isMe ? styles.myBubble : styles.theirBubble
        ]}>
          <Text style={styles.messageText}>{mData.content}</Text>
        </View>
        {!isMe && (
          <Text style={styles.senderName}>{otherUser?.username || "Match"}</Text>
        )}
      </View>
    );
  };

  if (loading && !otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.purple} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Image source={{ uri: getAvatarUrl(otherUser) }} style={styles.headerAvatar} />
          <Text style={styles.headerName}>{otherUser?.username || "..."}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputRow, { paddingBottom: keyboardVisible ? 20 : 70 + insets.bottom }]}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowEventModal(true)}
          >
            <Ionicons name="add-circle" size={32} color={COLORS.purple} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Écrivez un message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color={COLORS.purple} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un événement</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>1. Choisissez une activité</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.activitiesList}
              contentContainerStyle={styles.activitiesContent}
            >
              {activities.map((activity: any) => {
                const data = activity.attributes || activity;
                const isSelected = selectedActivity?.id === activity.id;
                return (
                  <TouchableOpacity 
                    key={activity.id} 
                    style={[styles.activityItem, isSelected && styles.selectedActivityItem]}
                    onPress={() => setSelectedActivity(activity)}
                  >
                    <Text style={[styles.activityItemText, isSelected && styles.selectedActivityText]}>
                      {data.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedActivity && (
              <>
                <Text style={styles.modalSubtitle}>2. Date et Heure</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.purple} />
                    <Text style={styles.dateTimeButtonText}>
                      {bookingDate ? bookingDate.toLocaleDateString() : "Choisir une date"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.dateTimeButton, !bookingDate && { opacity: 0.5 }]} 
                    onPress={() => bookingDate && setShowTimePicker(true)}
                    disabled={!bookingDate}
                  >
                    <Ionicons name="time-outline" size={20} color={COLORS.purple} />
                    <Text style={styles.dateTimeButtonText}>Choisir l'heure</Text>
                  </TouchableOpacity>
                </View>

                {bookingDate && (
                  <TouchableOpacity 
                    style={styles.createButton} 
                    onPress={() => setShowTimePicker(true)}
                    disabled={isCreatingEvent}
                  >
                    {isCreatingEvent ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.createButtonText}>Confirmer l'invitation</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setBookingDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={(time) => {
          setShowTimePicker(false);
          handleCreateBooking(time);
        }}
        onCancel={() => setShowTimePicker(false)}
      />

      <BottomNav currentRoute="messages" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    alignItems: "center",
    flex: 1,
  },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  messageContainer: {
    marginBottom: 15,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "80%",
  },
  myBubble: {
    backgroundColor: "#A970FF", 
  },
  theirBubble: {
    backgroundColor: COLORS.purple,
  },
  messageText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  senderName: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#666",
    marginTop: 4,
    marginLeft: 5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  addButton: {
    padding: 5,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    marginBottom: 15,
    marginTop: 10,
  },
  activitiesList: {
    maxHeight: 60,
    marginBottom: 20,
  },
  activitiesContent: {
    gap: 10,
    paddingRight: 20,
  },
  activityItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedActivityItem: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  activityItemText: {
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
  selectedActivityText: {
    color: "white",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "black",
  },
  createButton: {
    backgroundColor: COLORS.purple,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
});

export default ChatScreen;
