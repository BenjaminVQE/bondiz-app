import { COLORS } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, STRAPI_BASE_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./components/BottomNav";

const MessagesScreen = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async (isRefresh = false) => {
    if (!user || !token) return;
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      
      // 1. Fetch Matches
      const matchesRes = await apiFetch<any>(
        `/matches?filters[$or][0][user1][id][$eq]=${user.id}&filters[$or][1][user2][id][$eq]=${user.id}&populate[user1][populate]=self_image&populate[user2][populate]=self_image&publicationState=live`,
        {},
        token
      );

      // 2. Fetch Messages
      const messagesRes = await apiFetch<any>(
        `/messages?filters[$or][0][sender][id][$eq]=${user.id}&filters[$or][1][recipient][id][$eq]=${user.id}&populate=*&sort=createdAt:desc&publicationState=live`,
        {},
        token
      );

      const convMap: Record<string, any> = {};

      // Process Matches first (these are the baseline for conversations)
      if (matchesRes.data) {
        matchesRes.data.forEach((match: any) => {
          const mData = match.attributes || match;
          const u1 = mData.user1?.data || mData.user1;
          const u2 = mData.user2?.data || mData.user2;
          
          const u1Id = Number(u1?.id);
          const u2Id = Number(u2?.id);
          const currentId = Number(user.id);

          const otherUser = (u1Id === currentId) ? u2 : u1;
          const otherUserData = otherUser?.attributes || otherUser;
          
          if (otherUser) {
            const imgUrl = otherUserData?.self_image?.url || 
                           otherUserData?.self_image?.[0]?.url || 
                           otherUserData?.self_image?.data?.attributes?.url ||
                           otherUserData?.self_image?.data?.[0]?.url;

            convMap[otherUser.id] = {
              matchId: match.id,
              otherUserId: otherUser.id,
              name: otherUserData?.username || "Ami Bondiz",
              lastMessage: "Nouveau match ! ✨",
              time: "",
              avatar: imgUrl ? `${STRAPI_BASE_URL}${imgUrl}` : `https://i.pravatar.cc/150?u=${otherUser.id}`,
              unread: false,
              timestamp: new Date(mData.createdAt || Date.now()).getTime()
            };
          }
        });
      }

      // Process Messages second (to update snapshots)
      if (messagesRes.data) {
        messagesRes.data.forEach((msg: any) => {
          const mData = msg.attributes || msg;
          const senderId = Number(mData.sender?.data?.id || mData.sender?.id);
          const recipientId = Number(mData.recipient?.data?.id || mData.recipient?.id);
          const currentId = Number(user.id);
          const otherId = (senderId === currentId) ? recipientId : senderId;

          if (otherId && convMap[otherId]) {
            // Update the existing conversation with latest message info
            if (convMap[otherId].time === "") {
               convMap[otherId].lastMessage = mData.content;
               convMap[otherId].time = new Date(mData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
               convMap[otherId].unread = !mData.isRead && recipientId === currentId;
               convMap[otherId].timestamp = new Date(mData.createdAt).getTime();
            }
          }
        });
      }

      // Sort by latest activity timestamp
      const sorted = Object.values(convMap).sort((a, b) => b.timestamp - a.timestamp);
      setConversations(sorted);

    } catch (error) {
      console.error("Fetch conversations error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.conversationCard}
      onPress={() => router.push(`/chat/${item.matchId}`)}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
        <View style={styles.timeRow}>
          <Ionicons name="chatbubble-outline" size={16} color="white" />
          <Text style={styles.timeText}>{item.time || "Maintenant"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MESSAGES</Text>
        <Text style={styles.unreadCount}>Non lus : {conversations.filter(c => c.unread).length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.purple} style={{ marginTop: 50 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#eee" />
          <Text style={styles.emptyText}>Aucun match pour le moment.</Text>
          <Text style={styles.emptySubtext}>Allez sur la page d'accueil pour trouver votre partenaire Bondiz ! ✨</Text>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.homeButtonText}>Découvrir des profils</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.matchId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => fetchConversations(true)}
              tintColor={COLORS.purple}
            />
          }
        />
      )}

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
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  unreadCount: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  conversationCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "white",
    opacity: 0.9,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "white",
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  homeButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
  },
  homeButtonText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});

export default MessagesScreen;
