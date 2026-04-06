import { COLORS } from "@/constants/Colors";
import { IMAGES } from "@/constants/Image";
import { globalStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiFetch, STRAPI_BASE_URL } from "../services/api";
import { calculateAge } from "../utils/date";
import BottomNav from "./components/BottomNav";
import MatchNotification from "./components/MatchNotification";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentLikeIds, setSentLikeIds] = useState<number[]>([]);
  const [matchInfo, setMatchInfo] = useState<{ visible: boolean; matchedUser: any }>({
    visible: false,
    matchedUser: null,
  });
  const [mainScrollEnabled, setMainScrollEnabled] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/welcome");
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await apiFetch<any[]>(`/users?populate[0]=self_image`);
      const filtered = (usersData || []).filter((u: any) => u.id !== user?.id);
      setUsers(filtered);

      if (user?.id) {
        const likesRes = await apiFetch<any>(
          `/likes?filters[fromUser][id]=${user.id}&populate[toUser][fields]=id`
        );
        
        if (likesRes.data) {
          const likedIds = likesRes.data
            .map((l: any) => l.toUser?.id)
            .filter((id: number) => id !== undefined);
          setSentLikeIds(likedIds);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserImages = (user: any) => {
    if (!user) return [];
    
    const getUrl = (img: any) => {
      if (!img) return null;
      // Also look into formats if the top-level url is missing
      return img.url 
        || img.attributes?.url 
        || img.data?.attributes?.url 
        || img.attributes?.data?.attributes?.url
        || img.formats?.large?.url
        || img.formats?.medium?.url
        || img.formats?.small?.url
        || img.formats?.thumbnail?.url;
    };

    let rawImages = user.self_image;
    if (rawImages?.data) rawImages = rawImages.data;

    let images: string[] = [];
    if (Array.isArray(rawImages)) {
      images = rawImages.map((img: any) => getUrl(img)).filter(Boolean);
    } else if (rawImages) {
      const url = getUrl(rawImages);
      if (url) images = [url];
    }
    
    if (images.length === 0 && user.image) {
      images = [user.image];
    }
    
    return images.map(url => url.startsWith("http") ? url : `${STRAPI_BASE_URL}${url}`);
  };

  const handleLike = async (targetUserId: number) => {
    if (!user || sentLikeIds.includes(targetUserId)) return;
    
    // Mise à jour optimiste
    setSentLikeIds(prev => [...prev, targetUserId]);

    try {
      // 1. Créer le Like
      // Format Strapi : { data: { fromUser: id1, toUser: id2, state: 'liked' } }
      await apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({
          data: {
            fromUser: user.id,
            toUser: targetUserId,
            state: "accepted"
          }
        })
      });

      // 2. Vérifier si l'autre utilisateur nous a déjà liké (Like réciproque)
      // On cherche un Like où fromUser = targetUserId et toUser = user.id
      const reciprocalLikes = await apiFetch<any>(
        `/likes?filters[fromUser][id]=${targetUserId}&filters[toUser][id]=${user.id}`
      );

      // Strapi renvoie les listes dans l'objet 'data'
      const hasReciprocal = reciprocalLikes.data && reciprocalLikes.data.length > 0;

      if (hasReciprocal) {
        await apiFetch("/matches", {
          method: "POST",
          body: JSON.stringify({
            data: {
              user1: user.id,
              user2: targetUserId
            }
          })
        });

        const targetUser = users.find(u => u.id === targetUserId);
        
        setMatchInfo({
          visible: true,
          matchedUser: targetUser || { username: "votre nouveau partenaire" },
        });
      } 
    } catch (error) {
      console.error("Erreur lors du Like", error);
      Alert.alert("Erreur", "Impossible d'envoyer votre Like pour le moment.");
    }
  };

  const renderUser = ({ item: currentUser }: { item: any }) => (
    <UserCard 
      currentUser={currentUser} 
      userImages={getUserImages(currentUser)} 
      isLiked={sentLikeIds.includes(currentUser.id)}
      handleLike={handleLike}
      insets={insets}
      currentUserInterests={user?.interests || []}
      setMainScrollEnabled={setMainScrollEnabled}
    />
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.center]}>
        <ActivityIndicator size="large" color={COLORS.cta} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item: any) => item.id.toString()}
        scrollEnabled={mainScrollEnabled}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        ListEmptyComponent={
          <View style={[styles.userCard, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "white", fontFamily: "Poppins_400Regular" }}>
              Aucun utilisateur trouvé autour de vous
            </Text>
          </View>
        }
      />

      <MatchNotification 
        visible={matchInfo.visible}
        matchedUser={matchInfo.matchedUser}
        onClose={() => setMatchInfo(prev => ({ ...prev, visible: false }))}
      />

      <BottomNav currentRoute="home" />
    </View>
  );
};

const UserCard = ({ 
  currentUser, 
  userImages, 
  isLiked, 
  handleLike, 
  insets, 
  currentUserInterests,
  setMainScrollEnabled
}: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const userAge = calculateAge(currentUser?.age);
  const scrollRef = useRef<ScrollView>(null);

  const onScrollPhotos = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

  const handleNext = () => {
    if (activeIndex < userImages.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollRef.current?.scrollTo({ x: (activeIndex - 1) * width, animated: true });
    }
  };

  return (
    <View style={styles.userCard}>
      {userImages.length > 0 ? (
        <ScrollView 
          ref={scrollRef}
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onScroll={onScrollPhotos}
          scrollEventThrottle={16}
          style={styles.photoContainer}
        >
          {userImages.map((uri: string, index: number) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.backgroundImage}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderImage} />
      )}

      {/* Navigation Arrows */}
      {userImages.length > 1 && (
        <>
          {activeIndex > 0 && (
            <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev}>
              <Ionicons name="chevron-back" size={40} color={COLORS.pink} />
            </TouchableOpacity>
          )}
          {activeIndex < userImages.length - 1 && (
            <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext}>
              <Ionicons name="chevron-forward" size={40} color={COLORS.pink} />
            </TouchableOpacity>
          )}
        </>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      />

      <View style={styles.cardContent}>
        <View style={[styles.bottomInfoContainer, { paddingBottom: 130 + insets.bottom }]}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUser?.username?.toUpperCase() || "UTILISATEUR"}
            </Text>
            <Text style={styles.userAge}>
              {userAge} Ans
            </Text>
            
            {currentUser?.interests && currentUser.interests.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.interestsContainer}
                contentContainerStyle={styles.interestsContent}
              >
                {currentUser.interests.map((interest: string, index: number) => {
                  const isCommon = currentUserInterests.includes(interest);
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.interestTag,
                        isCommon && styles.commonInterestTag
                      ]}
                    >
                      <Text style={styles.interestTagText}>{interest}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {currentUser?.bio ? (
              <ScrollView 
                style={styles.bioScrollContainer} 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                bounces={false}
                onStartShouldSetResponderCapture={() => true}
                onTouchStart={() => setMainScrollEnabled(false)}
                onTouchEnd={() => setMainScrollEnabled(true)}
                onMomentumScrollEnd={() => setMainScrollEnabled(true)}
              >
                <Text style={styles.userBio}>
                  {currentUser.bio}
                </Text>
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.interactions}>
            <TouchableOpacity 
              style={styles.interactionButton}
              onPress={() => handleLike(currentUser.id)}
              disabled={isLiked}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={40} 
                color={isLiked ? COLORS.pink : "white"} 
              />
            </TouchableOpacity>
            <View style={styles.activityCounter}>
              <Ionicons name="happy-outline" size={32} color="white" />
              <Text style={styles.activityText}>
                {currentUser.activities?.length || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  backgroundImage: {
    width: width,
    height: height,
    resizeMode: "cover",
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gray,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  bottomInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 25,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  userAge: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 5,
  },
  interestsContainer: {
    flexDirection: "row",
    marginBottom: 10,
    marginTop: 2,
    maxHeight: 36,
  },
  interestsContent: {
    paddingRight: 20,
    gap: 8,
  },
  interestTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
  },
  commonInterestTag: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.pink,
  },
  interestTagText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  moreInterestsText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    alignSelf: "center",
    opacity: 0.8,
  },
  userBio: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 22,
  },
  bioScrollContainer: {
    maxHeight: 120,
    marginBottom: 10,
  },
  userLocation: {
    alignItems: "center",
  },
  interactions: {
    alignItems: "center",
  },
  interactionButton: {
    marginBottom: 10,
  },
  activityCounter: {
    alignItems: "center",
    marginBottom: 15,
  },
  activityText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginTop: -2,
  },
  userCard: {
    width: width,
    height: height,
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  photoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  arrowButton: {
    position: "absolute",
    top: 150,
    width: 60,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    marginHorizontal: 5,
  },
  leftArrow: {
    left: 0,
  },
  rightArrow: {
    right: 0,
  },
});
