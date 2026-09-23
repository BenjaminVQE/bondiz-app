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
      
      // Le backend renvoie déjà les conversations triées, avec le dernier
      // message et le nombre de messages non lus.
      const res = await apiFetch<any>(`/conversations?pageSize=50`, {}, token);

      const mapped = (res.data || []).map((conv: any) => {
        const imgUrl = conv.otherUser?.self_image?.[0]?.url || conv.otherUser?.self_image?.url;

        return {
          matchId: conv.matchDocumentId,
          otherUserId: conv.otherUser?.id,
          name: conv.otherUser?.username || "Ami Bondiz",
          lastMessage: conv.lastMessage?.content || "Nouveau match ! ✨",
          time: conv.lastMessage
            ? new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          avatar: imgUrl
            ? (imgUrl.startsWith("http") ? imgUrl : `${STRAPI_BASE_URL}${imgUrl}`)
            : `https://i.pravatar.cc/150?u=${conv.otherUser?.id}`,
          unread: conv.unreadCount > 0,
          unreadCount: conv.unreadCount,
        };
      });

      setConversations(mapped);

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
