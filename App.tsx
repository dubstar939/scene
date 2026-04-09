import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import { QRCodeCanvas } from "qrcode.react";
import L from "leaflet";
import Papa from "papaparse";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  LogIn,
  Users,
  MapPin,
  Navigation,
  X,
  Save,
  Ghost,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  Facebook,
  Bell,
  Power,
  MessageSquare,
  Send,
  CornerUpLeft,
  WifiOff,
  Share2,
  Copy,
  AlertTriangle,
  AlertCircle,
  UserPlus,
  LogOut,
  ArrowLeft,
  Loader2,
  Search,
  ExternalLink,
  Settings,
  Lock,
  Car,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  Star,
  Fuel,
  Utensils,
  Camera,
  Trophy,
  BarChart3,
  Maximize2,
  Mail,
  User,
  Smile,
} from "lucide-react";
import MapComponent from "./src/components/MapComponent";
import AuthComponent from "./src/components/AuthComponent";
import {
  Member,
  Spot,
  PrivacySettings,
  Conversation,
  Message,
  Cruise,
  Reminder,
  Achievement,
  Contact,
  Task,
} from "./types";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "./src/lib/supabase";
import ContactsTab from "./src/components/Tabs/ContactsTab";
import TasksTab from "./src/components/Tabs/TasksTab";
import NavigationComponent from "./src/components/Navigation";
import SupabaseTest from "./src/components/SupabaseTest";

// Custom Member Map Icon based on status
const createMemberMapIcon = (member: Member, isLeader: boolean = false) => {
  let iconHtml = "";
  let bgColor = "";
  let borderColor = "border-white";
  let iconComponent = "";
  let size = "w-8 h-8";
  let ring = "";

  if (isLeader) {
    ring = "animate-pulse ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-900";
    borderColor = "border-indigo-400";
  }

  switch (member.status) {
    case "Cruising":
      bgColor = "bg-emerald-500";
      iconComponent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`;
      ring = "animate-pulse";
      break;
    case "Parked":
      bgColor = "bg-slate-600";
      iconComponent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`;
      break;
    case "Heading to meet":
      bgColor = "bg-blue-500";
      iconComponent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`;
      break;
    case "At Meetup":
      bgColor = "bg-purple-600";
      iconComponent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect x="9" y="9" width="6" height="4" rx="1"/><path d="M12 2L4 5l8 3 8-3-8-3z"/></svg>`;
      size = "w-9 h-9";
      break;
    case "On Detour":
      bgColor = "bg-yellow-500";
      iconComponent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      borderColor = "border-black";
      break;
    default:
      return null;
  }

  iconHtml = `<div class="${size} rounded-full border-2 ${borderColor} shadow-lg flex items-center justify-center transition-all duration-500 ${ring} ${bgColor} ${member.isGhost ? "opacity-40 grayscale scale-90" : ""}">
                ${member.isGhost ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>` : iconComponent}
              </div>`;

  return L.divIcon({
    html: iconHtml,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createSpotMapIcon = (type: Spot["type"]) => {
  let bgColor = "bg-indigo-600";
  let icon = "";

  switch (type) {
    case "Meetup":
      bgColor = "bg-purple-600";
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect x="9" y="9" width="6" height="4" rx="1"/><path d="M12 2L4 5l8 3 8-3-8-3z"/></svg>`;
      break;
    case "Fuel":
      bgColor = "bg-orange-500";
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><path d="M6 12V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v16"/><path d="M14 9h2.4c1.1 0 2 .9 2 2v11"/><circle cx="10" cy="9" r="2"/></svg>`;
      break;
    case "Food":
      bgColor = "bg-red-500";
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`;
      break;
    case "Scenic":
      bgColor = "bg-emerald-500";
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
      break;
  }

  return L.divIcon({
    html: `<div class="w-10 h-10 rounded-2xl ${bgColor} border-2 border-white shadow-xl flex items-center justify-center transform transition-transform hover:scale-110">${icon}</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createWaypointIcon = (index: number) =>
  L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center font-bold text-white text-sm">${index + 1}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const DEFAULT_CENTER: [number, number] = [30.4213, -87.2169]; // Pensacola, FL
const DEFAULT_AVATAR = "https://placehold.co/150x150/1e293b/FFFFFF?text=?";

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "dist_1",
    title: "Rookie Cruiser",
    description: "Cruise for 10km",
    icon: "🚗",
    type: "distance",
    requirement: 10000,
    progress: 0,
  },
  {
    id: "dist_2",
    title: "Road Warrior",
    description: "Cruise for 50km",
    icon: "🛣️",
    type: "distance",
    requirement: 50000,
    progress: 0,
  },
  {
    id: "photo_1",
    title: "Paparazzi",
    description: "Share a photo of your ride",
    icon: "📸",
    type: "photo",
    requirement: 1,
    progress: 0,
  },
  {
    id: "chat_1",
    title: "Helper",
    description: "Help others in chat",
    icon: "💬",
    type: "chat",
    requirement: 5,
    progress: 0,
  },
  {
    id: "check_1",
    title: "Explorer",
    description: "Visit 3 scenic spots",
    icon: "🗺️",
    type: "checkpoint",
    requirement: 3,
    progress: 0,
  },
];

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

const MapViewUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, 13);
  }, [center, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

const MapEventsHandler = ({
  onMapClick,
  isAddingWaypoint,
  isAddingSpot,
}: {
  onMapClick: (latlng: L.LatLng) => void;
  isAddingWaypoint: boolean;
  isAddingSpot: boolean;
}) => {
  useMapEvents({
    click(e) {
      if (isAddingWaypoint || isAddingSpot) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

const CruisePolyline = ({ route }: { route: [number, number][] }) => {
  if (route.length < 2) return null;
  return (
    <Polyline
      pathOptions={{
        color: "#4f46e5",
        weight: 6,
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round",
      }}
      positions={route}
    />
  );
};

/**
 * Main Application Component
 * 
 * A dashboard for managing members, chats, contacts, and tasks.
 * Integrates with Supabase for real-time updates and Leaflet for mapping.
 * 
 * @returns {JSX.Element} The main application layout
 */
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginMode, setLoginMode] = useState<
    "initial" | "email-login" | "email-signup"
  >("initial");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [guestUsername, setGuestUsername] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    name: "",
    avatar: "",
    rememberMe: false,
  });

  const [resetSent, setResetSent] = useState(false);

  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<
    [number, number] | null
  >(null);
  const [mapDisplayCenter, setMapDisplayCenter] =
    useState<[number, number]>(DEFAULT_CENTER);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<
    | "members"
    | "chat"
    | "discover"
    | "privacy"
    | "cruise"
    | "reminders"
    | "profile"
    | "spots"
    | "studio"
    | "leaderboard"
    | "achievements"
    | "contacts"
    | "tasks"
  >("members");

  const isMapTab = ["members", "spots", "cruise", "discover"].includes(activeTab);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState<{
    hauler: string;
    priority: string;
    status: string;
    dateRange: { start: string; end: string };
  }>({
    hauler: "",
    priority: "",
    status: "",
    dateRange: { start: "", end: "" },
  });
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Spots State
  const [spots, setSpots] = useState<Spot[]>(() => {
    const saved = localStorage.getItem("scene_spots");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [newSpotForm, setNewSpotForm] = useState<Partial<Spot>>({
    name: "",
    type: "Meetup",
    description: "",
  });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: "",
    car: "",
    avatar: "",
  });

  const [activeNotifications, setActiveNotifications] = useState<Reminder[]>(
    [],
  );

  // Reminders States
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem("scene_reminders");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync current user to members list for leaderboard
  useEffect(() => {
    if (currentUser) {
      setMembers((prev) =>
        prev.map((m) => (m.id === currentUser.id ? currentUser : m)),
      );
    }
  }, [currentUser]);

  const updateAchievements = (
    type: Achievement["type"],
    amount: number = 1,
    memberId?: string,
  ) => {
    const targetId = memberId || currentUser?.id;
    if (!targetId) return;

    setCurrentUser((prev) => {
      if (!prev || prev.id !== targetId) return prev;

      let xpGained = 0;
      let achievementUnlocked = false;

      const updatedAchievements = prev.achievements.map((ach) => {
        if (ach.type === type && !ach.unlockedAt) {
          const newProgress =
            type === "distance" ? prev.totalDistance : ach.progress + amount;
          if (newProgress >= ach.requirement) {
            xpGained += 500;
            achievementUnlocked = true;
            return {
              ...ach,
              progress: ach.requirement,
              unlockedAt: new Date().toISOString(),
            };
          }
          return { ...ach, progress: newProgress };
        }
        return ach;
      });

      if (!achievementUnlocked && amount === 0 && type !== "distance")
        return prev;

      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const updatedUser = {
        ...prev,
        achievements: updatedAchievements,
        xp: newXp,
        level: newLevel,
      };

      localStorage.setItem(
        `scene_user_data_${prev.id}`,
        JSON.stringify({
          xp: updatedUser.xp,
          level: updatedUser.level,
          totalDistance: updatedUser.totalDistance,
          achievements: updatedUser.achievements,
          photosShared: updatedUser.photosShared,
          checkpointsVisited: updatedUser.checkpointsVisited,
        }),
      );

      return updatedUser;
    });
  };

  const addXp = (amount: number) => {
    if (!currentUser) return;
    setCurrentUser((prev) => {
      if (!prev) return null;
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 1000) + 1;
      const updatedUser = { ...prev, xp: newXp, level: newLevel };

      localStorage.setItem(
        `scene_user_data_${prev.id}`,
        JSON.stringify({
          xp: updatedUser.xp,
          level: updatedUser.level,
          totalDistance: updatedUser.totalDistance,
          achievements: updatedUser.achievements,
          photosShared: updatedUser.photosShared,
          checkpointsVisited: updatedUser.checkpointsVisited,
        }),
      );

      return updatedUser;
    });
  };
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: "",
    date: "",
    time: "",
    locationName: "",
    type: "Meetup",
    alertBefore: "1h",
    recurring: "none",
    alertSound: "default",
  });

  // AI Generation States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setReminders((prev) => {
        let changed = false;
        const updated = prev.map((rem) => {
          if (rem.isCompleted || (rem.alertFired && rem.recurring === "none") || rem.alertBefore === "none")
            return rem;

          const eventTime = new Date(`${rem.date} ${rem.time}`);
          const diffMs = eventTime.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          let shouldAlert = false;
          if (rem.alertBefore === "1h" && diffHours <= 1 && diffHours > 0 && !rem.alertFired)
            shouldAlert = true;
          if (rem.alertBefore === "1d" && diffHours <= 24 && diffHours > 0 && !rem.alertFired)
            shouldAlert = true;

          if (shouldAlert) {
            setActiveNotifications((prevNotif) => [...prevNotif, rem]);
            playAlertSound(rem.alertSound);
            changed = true;
            return { ...rem, alertFired: true };
          }

          // Handle recurring events reset
          if (rem.alertFired && diffHours < -1) {
            let nextDate = new Date(eventTime);
            if (rem.recurring === "daily") nextDate.setDate(nextDate.getDate() + 1);
            if (rem.recurring === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            if (rem.recurring === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

            if (rem.recurring !== "none") {
              changed = true;
              return {
                ...rem,
                date: nextDate.toISOString().split("T")[0],
                alertFired: false,
              };
            }
          }

          return rem;
        });
        return changed ? updated : prev;
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check
    return () => clearInterval(interval);
  }, []);

  const dismissNotification = (id: string) => {
    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Discover/Search States
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("All");
  const [memberCarFilter, setMemberCarFilter] = useState("All");

  // Memoized filtered members list for performance
  const filteredMembers = useMemo(() => {
    return members
      .filter(
        (m) => m.id !== currentUser?.id && m.status !== "Offline",
      )
      .filter(
        (m) =>
          !showOnlyFavorites || favoriteMemberIds.includes(m.id),
      )
      .filter(
        (m) =>
          memberStatusFilter === "All" ||
          m.status === memberStatusFilter,
      )
      .filter(
        (m) =>
          memberCarFilter === "All" || m.car === memberCarFilter,
      )
      .filter((m) =>
        m.name
          .toLowerCase()
          .includes(memberSearchQuery.toLowerCase()),
      );
  }, [members, currentUser, showOnlyFavorites, favoriteMemberIds, memberStatusFilter, memberCarFilter, memberSearchQuery]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(members.map((m) => m.status).filter(Boolean));
    return ["All", ...Array.from(statuses)];
  }, [members]);

  const uniqueCars = useMemo(() => {
    const cars = new Set(members.map((m) => m.car).filter(Boolean));
    return ["All", ...Array.from(cars)];
  }, [members]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [mapsGroundingResults, setMapsGroundingResults] = useState<{
    text: string;
    chunks: any[];
  }>({ text: "", chunks: [] });

  // Chat States
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "group",
      name: "Community Chat",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=group",
      participants: [],
      messages: [],
      unreadCount: 0,
      typingUsers: [],
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map States
  const [mapLayer, setMapLayer] = useState<"dark" | "satellite" | "traffic">(
    "dark",
  );

  // Privacy States
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    ghostMode: false,
    visibility: "everyone",
  });

  const [favoriteMemberIds, setFavoriteMemberIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("scene_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavoriteMemberIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      localStorage.setItem("scene_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Sync privacy settings with currentUser and broadcast updates
  useEffect(() => {
    if (currentUser && (currentUser.isGhost !== privacy.ghostMode || currentUser.privacy?.visibility !== privacy.visibility)) {
      const updatedUser: Member = {
        ...currentUser,
        isGhost: privacy.ghostMode,
        privacy: privacy
      };
      setCurrentUser(updatedUser);
      setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
      
      if (socketRef.current) {
        socketRef.current.track({ user: updatedUser });
        socketRef.current.send({
          type: "broadcast",
          event: "status_update",
          payload: { memberId: currentUser.id, isGhost: privacy.ghostMode, privacy: privacy }
        });
      }
    }
  }, [privacy, currentUser]);
  // Cruise State
  const [cruise, setCruise] = useState<Cruise>({
    isActive: false,
    leaderId: null,
    route: [],
  });
  const locationWatchId = useRef<number | null>(null);
  const lastLocationRef = useRef<[number, number] | null>(null);
  const socketRef = useRef<RealtimeChannel | null>(null);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);

  const STATUS_OPTIONS: Member["status"][] = [
    "Cruising",
    "Parked",
    "Heading to meet",
    "At Meetup",
    "On Detour",
    "Offline",
  ];

  // Persist Reminders
  useEffect(() => {
    localStorage.setItem("scene_reminders", JSON.stringify(reminders));
  }, [reminders]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, activeConversationId, activeTab]);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const groupChat: Conversation = {
        id: "group",
        name: "Panhandle Pop-Up Meets",
        avatar: "https://placehold.co/100x100/3730a3/FFFFFF?text=P",
        participants: [currentUser],
        messages: [],
        unreadCount: 0,
      };
      setConversations([groupChat]);
      setActiveConversationId(null);
    }
  }, [isLoggedIn, currentUser]);

  // Send message_read event when active conversation changes
  useEffect(() => {
    if (activeConversationId && socketRef.current && currentUser) {
      socketRef.current.send({
        type: "broadcast",
        event: "message_read",
        payload: {
          memberId: currentUser.id,
          conversationId: activeConversationId,
        },
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                unreadCount: 0,
                messages: c.messages.map((m) =>
                  m.senderId !== currentUser.id ? { ...m, isRead: true } : m,
                ),
              }
            : c,
        ),
      );
    }
  }, [activeConversationId, currentUser]);

  const startLocationWatch = useCallback(
    (memberId: string) => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }

      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        return;
      }

      locationWatchId.current = navigator.geolocation.watchPosition(
        (watchPos) => {
          const newLocation: [number, number] = [
            watchPos.coords.latitude,
            watchPos.coords.longitude,
          ];
          setCurrentUserLocation(newLocation);
          setLocationError(null);

          // Update distance and checkpoints
          setCurrentUser((prev) => {
            if (!prev) return null;

            let dist = 0;
            if (lastLocationRef.current) {
              dist = calculateDistance(
                lastLocationRef.current[0],
                lastLocationRef.current[1],
                newLocation[0],
                newLocation[1],
              );
            }
            lastLocationRef.current = newLocation;

            const newTotalDistance = prev.totalDistance + dist;

            // Check for checkpoints (spots)
            const newlyVisitedCheckpoints = [...prev.checkpointsVisited];
            let checkpointGained = false;
            spots.forEach((spot) => {
              if (!newlyVisitedCheckpoints.includes(spot.id)) {
                const distToSpot = calculateDistance(
                  newLocation[0],
                  newLocation[1],
                  spot.location[0],
                  spot.location[1],
                );
                if (distToSpot < 100) {
                  // within 100m
                  newlyVisitedCheckpoints.push(spot.id);
                  checkpointGained = true;
                }
              }
            });

            const updatedUser = {
              ...prev,
              location: newLocation,
              totalDistance: newTotalDistance,
              checkpointsVisited: newlyVisitedCheckpoints,
            };

            // Achievement checks for distance
            const updatedAchievements = updatedUser.achievements.map((ach) => {
              if (ach.type === "distance" && !ach.unlockedAt) {
                if (newTotalDistance >= ach.requirement) {
                  return {
                    ...ach,
                    progress: ach.requirement,
                    unlockedAt: new Date().toISOString(),
                  };
                }
                return { ...ach, progress: newTotalDistance };
              }
              if (
                ach.type === "checkpoint" &&
                !ach.unlockedAt &&
                checkpointGained
              ) {
                const newProgress = newlyVisitedCheckpoints.length;
                if (newProgress >= ach.requirement) {
                  return {
                    ...ach,
                    progress: ach.requirement,
                    unlockedAt: new Date().toISOString(),
                  };
                }
                return { ...ach, progress: newProgress };
              }
              return ach;
            });

            const finalUser = {
              ...updatedUser,
              achievements: updatedAchievements,
            };

            localStorage.setItem(
              `scene_user_data_${prev.id}`,
              JSON.stringify({
                xp: finalUser.xp,
                level: finalUser.level,
                totalDistance: finalUser.totalDistance,
                achievements: finalUser.achievements,
                photosShared: finalUser.photosShared,
                checkpointsVisited: finalUser.checkpointsVisited,
              }),
            );

            return finalUser;
          });

          // Emit to server
          if (socketRef.current) {
            socketRef.current.send({
              type: "broadcast",
              event: "location_update",
              payload: { 
                memberId, 
                location: newLocation,
                isGhost: privacy.ghostMode,
                privacy: privacy,
                allowedViewerIds: (privacy.ghostMode || privacy.visibility === "favorites") ? favoriteMemberIds : null
              },
            });
          }

          setMembers((prevMembers) =>
            prevMembers.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    location: newLocation,
                    lastSeen: new Date().toLocaleTimeString(),
                  }
                : m,
            ),
          );
          if (cruise.leaderId === memberId) {
            setCruise((prev) => ({
              ...prev,
              route: [...prev.route, newLocation],
            }));
            setMapDisplayCenter(newLocation);
          }
        },
        (err) => {
          console.error("Error watching position:", err);
          let message =
            "An unknown error occurred while retrieving your location.";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message =
                "Location access denied. Please enable permissions to use live tracking.";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              message = "Location request timed out.";
              break;
          }
          setLocationError(message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    },
    [cruise.leaderId, privacy],
  );

  useEffect(() => {
    if (locationError) {
      const timer = setTimeout(() => setLocationError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [locationError]);

  useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  useEffect(() => {
    // Check API health
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => console.log("API Health Check:", data))
      .catch((err) => console.error("API Health Check Failed:", err));

    // Check for remembered user
    const savedUser = localStorage.getItem("scene_remembered_user");
    if (savedUser) {
      try {
        const { id, name, avatar, car, email } = JSON.parse(savedUser);
        completeLogin(id, name, avatar, car, email);
      } catch (e) {
        localStorage.removeItem("scene_remembered_user");
      }
    }
  }, []);

  const completeLogin = (
    id: string,
    name: string,
    avatar: string,
    car: string,
    email?: string,
  ) => {
    console.log("Completing login for:", name, id, email);
    setIsLoggedIn(true);
    setIsLoggingIn(false);

    // Initialize user data from localStorage if available
    let parsedData = null;
    try {
      const savedData = localStorage.getItem(`scene_user_data_${id}`);
      parsedData = savedData ? JSON.parse(savedData) : null;
    } catch (e) {
      console.error("Error parsing saved user data:", e);
    }

    // Create initial user object
    const newCurrentUser: Member = {
      id,
      email,
      name,
      car,
      location: currentUserLocation || DEFAULT_CENTER,
      status: "Cruising",
      avatar,
      lastSeen: new Date().toLocaleTimeString(),
      isFavorite: false,
      isGhost: privacy.ghostMode,
      privacy: privacy,
      xp: parsedData?.xp || 0,
      level: parsedData?.level || 1,
      totalDistance: parsedData?.totalDistance || 0,
      achievements: parsedData?.achievements || INITIAL_ACHIEVEMENTS,
      photosShared: parsedData?.photosShared || 0,
      checkpointsVisited: parsedData?.checkpointsVisited || [],
    };

    setCurrentUser(newCurrentUser);
    setProfileForm({
      name: newCurrentUser.name,
      car: newCurrentUser.car || "",
      avatar: newCurrentUser.avatar,
    });

    if (emailForm.rememberMe) {
      localStorage.setItem(
        "scene_remembered_user",
        JSON.stringify({ id, name, avatar, car }),
      );
    }

    // Initialize Supabase Realtime Channel if available
    if (supabase) {
      const channel = supabase.channel("scene_main", {
        config: {
          presence: {
            key: id,
          },
        },
      });

      socketRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const newState = channel.presenceState();
          setMembers((prevMembers) => {
            const onlineMembers: Member[] = [];
            Object.values(newState).forEach((presences: any) => {
              presences.forEach((p: any) => {
                if (p.user) {
                  const existing = prevMembers.find((m) => m.id === p.user.id);
                  onlineMembers.push({
                    ...p.user,
                    location: existing?.location || p.user.location,
                    status: existing?.status || p.user.status,
                    lastSeen: existing?.lastSeen || p.user.lastSeen,
                  });
                }
              });
            });
            return onlineMembers;
          });
        })
        .on("broadcast", { event: "location_update" }, ({ payload }) => {
          const { memberId, location, isGhost, privacy: senderPrivacy, allowedViewerIds } = payload;
          
          if (allowedViewerIds && currentUser && !allowedViewerIds.includes(currentUser.id)) {
            setMembers(prev => prev.filter(m => m.id !== memberId));
            return;
          }
          
          setMembers((prev) =>
            prev.map((m) =>
              m.id === memberId
                ? { 
                    ...m, 
                    location, 
                    isGhost,
                    privacy: senderPrivacy,
                    lastSeen: new Date().toLocaleTimeString() 
                  }
                : m
            )
          );
        })
        .on("broadcast", { event: "new_message" }, ({ payload }) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === "group") {
                if (c.messages.some((m) => m.id === payload.id)) return c;
                return { ...c, messages: [...c.messages, payload] };
              }
              return c;
            }),
          );
        })
        .on("broadcast", { event: "status_update" }, ({ payload }) => {
          const { memberId, status } = payload;
          setMembers((prev) =>
            prev.map((m) =>
              m.id === memberId
                ? { ...m, status, lastSeen: new Date().toLocaleTimeString() }
                : m,
            ),
          );
        })
        .on("broadcast", { event: "new_spot" }, ({ payload }) => {
          setSpots((prev) => {
            if (prev.some((s) => s.id === payload.id)) return prev;
            const updated = [...prev, payload];
            localStorage.setItem("scene_spots", JSON.stringify(updated));
            return updated;
          });
        })
        .on("broadcast", { event: "delete_spot" }, ({ payload }) => {
          setSpots((prev) => {
            const updated = prev.filter((s) => s.id !== payload.id);
            localStorage.setItem("scene_spots", JSON.stringify(updated));
            return updated;
          });
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          const { memberId, conversationId, isTyping } = payload;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === conversationId) {
                const typingUsers = c.typingUsers || [];
                if (isTyping) {
                  if (!typingUsers.includes(memberId)) {
                    return { ...c, typingUsers: [...typingUsers, memberId] };
                  }
                } else {
                  return {
                    ...c,
                    typingUsers: typingUsers.filter((id) => id !== memberId),
                  };
                }
              }
              return c;
            }),
          );
        })
        .on("broadcast", { event: "message_read" }, ({ payload }) => {
          const { memberId, conversationId } = payload;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === conversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.senderId !== memberId ? { ...m, isRead: true } : m,
                  ),
                };
              }
              return c;
            }),
          );
        })
        .on("broadcast", { event: "reaction_update" }, ({ payload }) => {
          const { messageId, conversationId, emoji, userId, action } = payload;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === conversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) => {
                    if (m.id === messageId) {
                      const reactions = { ...(m.reactions || {}) };
                      const users = [...(reactions[emoji] || [])];
                      if (action === "add") {
                        if (!users.includes(userId)) users.push(userId);
                      } else {
                        const idx = users.indexOf(userId);
                        if (idx > -1) users.splice(idx, 1);
                      }
                      if (users.length === 0) delete reactions[emoji];
                      else reactions[emoji] = users;
                      return { ...m, reactions };
                    }
                    return m;
                  }),
                };
              }
              return c;
            }),
          );
        })
        .on("broadcast", { event: "cruise_update" }, ({ payload }) => {
          setCruise(payload);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Track initial presence
            await channel.track({ user: newCurrentUser });
            
            // Start location updates
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const initialLocation: [number, number] = [
                  pos.coords.latitude,
                  pos.coords.longitude,
                ];
                setCurrentUserLocation(initialLocation);
                setMapDisplayCenter(initialLocation);
                
                const updatedUser = { ...newCurrentUser, location: initialLocation };
                setCurrentUser(updatedUser);
                await channel.track({ user: updatedUser });
                startLocationWatch(updatedUser.id);
              },
              async () => {
                // Geolocation failed, use default
                setCurrentUserLocation(DEFAULT_CENTER);
                setMapDisplayCenter(DEFAULT_CENTER);
                startLocationWatch(newCurrentUser.id);
              }
            );
          }
        });
    } else {
      // No Supabase, still try to get location
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const initialLocation: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setCurrentUserLocation(initialLocation);
          setMapDisplayCenter(initialLocation);
          setCurrentUser(prev => prev ? { ...prev, location: initialLocation } : null);
          startLocationWatch(id);
        },
        () => {
          setCurrentUserLocation(DEFAULT_CENTER);
          setMapDisplayCenter(DEFAULT_CENTER);
        }
      );
    }
  };

  const handleGuestLogin = () => {
    if (!guestUsername.trim()) {
      setLoginError("Guest username cannot be empty.");
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    const id = `guest-${guestUsername.trim().replace(/\s+/g, "-")}-${Date.now()}`;
    const avatar = guestAvatar || `https://i.pravatar.cc/150?u=${id}`;
    setTimeout(() => {
      completeLogin(id, guestUsername.trim(), avatar, "Guest Member");
    }, 1000);
  };

  const handleEmailAuth = async (mode: "login" | "signup") => {
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      console.log(`Starting authentication in ${mode} mode...`);
      // Try Supabase first if configured
      if (supabase) {
        console.log("Using Supabase for authentication.");
        if (mode === "signup") {
          console.log("Attempting Supabase signup for:", emailForm.email);
          const { data, error } = await supabase.auth.signUp({
            email: emailForm.email,
            password: emailForm.password,
            options: {
              data: {
                name: emailForm.name,
                avatar:
                  emailForm.avatar ||
                  `https://i.pravatar.cc/150?u=${emailForm.email}`,
                car: "New Member",
              },
            },
          });
          if (error) {
            console.error("Supabase signup error:", error);
            throw error;
          }
          if (data.user) {
            console.log("Supabase signup successful:", data.user.id);
            const metadata = data.user.user_metadata || {};
            completeLogin(
              data.user.id,
              metadata.name || emailForm.name || "New Member",
              metadata.avatar || emailForm.avatar || `https://i.pravatar.cc/150?u=${emailForm.email}`,
              metadata.car || "New Member",
              data.user.email,
            );
          } else {
            console.warn("Supabase signup returned no user data");
            setIsLoggingIn(false);
            setLoginError("Signup failed: No user data returned. Please check your email for confirmation if required.");
          }
        } else {
          console.log("Attempting Supabase login for:", emailForm.email);
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailForm.email,
            password: emailForm.password,
          });
          if (error) {
            console.error("Supabase login error:", error);
            throw error;
          }
          if (data.user) {
            console.log("Supabase login successful:", data.user.id);
            const metadata = data.user.user_metadata || {};
            completeLogin(
              data.user.id,
              metadata.name || "Member",
              metadata.avatar || `https://i.pravatar.cc/150?u=${emailForm.email}`,
              metadata.car || "Member",
              data.user.email,
            );
          } else {
            console.warn("Supabase login returned no user data");
            setIsLoggingIn(false);
            setLoginError("Login failed: No user data returned.");
          }
        }
        return;
      }

      console.log("Supabase not available, falling back to Express API.");
      // Fallback to Express API
      const endpoint =
        mode === "login" ? "/api/auth/email/login" : "/api/auth/email/signup";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`API response status: ${response.status}`);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Authentication failed");
        completeLogin(
          data.user.id,
          data.user.name,
          data.user.avatar,
          data.user.car,
          data.user.email,
        );
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        if (response.status === 413) {
          throw new Error(
            "Profile picture is too large. Please use a smaller image.",
          );
        }
        throw new Error(
          `Server error (${response.status}). Please try again later.`,
        );
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      setLoginError(error.message);
    }
  };

  const handleForgotPassword = () => {
    if (!emailForm.email.trim()) {
      setLoginError("Please enter your email address first.");
      return;
    }
    setResetSent(true);
    setLoginError(null);
    setTimeout(() => setResetSent(false), 5000);
  };
  /**
   * Adds a sample task to the tasks list.
   * Used for testing task management and filtering.
   */
  /**
   * Adds a sample task to the tasks list.
   * Used for testing task management and filtering.
   */
  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "New Task " + (tasks.length + 1),
      description: "Sample task description",
      priority: (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)],
      status: "pending",
      hauler: (["Hauler A", "Hauler B", "Hauler C"] as const)[Math.floor(Math.random() * 3)],
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  /**
   * Handles CSV file import for contacts.
   * Parses the file using PapaParse and updates the contacts state.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event
   */
  /**
   * Handles CSV file import for contacts.
   * Parses the file using PapaParse and updates the contacts state.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event
   */
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedContacts: Contact[] = results.data.map((row: any, index) => ({
          id: `imported-${Date.now()}-${index}`,
          name: row.name || row.Name || "Unknown",
          email: row.email || row.Email || "",
          phone: row.phone || row.Phone || "",
          company: row.company || row.Company || "",
          hauler: row.hauler || row.Hauler || "",
          createdAt: new Date().toISOString(),
        }));
        setContacts((prev) => [...prev, ...importedContacts]);
        setShareFeedback(`Successfully imported ${importedContacts.length} contacts`);
      },
      error: (error) => {
        setLoginError(`CSV Import Error: ${error.message}`);
      },
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesHauler = !taskFilters.hauler || task.hauler?.toLowerCase().includes(taskFilters.hauler.toLowerCase());
      const matchesPriority = !taskFilters.priority || task.priority === taskFilters.priority;
      const matchesStatus = !taskFilters.status || task.status === taskFilters.status;
      
      let matchesDate = true;
      if (taskFilters.dateRange.start || taskFilters.dateRange.end) {
        const taskDate = new Date(task.createdAt).getTime();
        if (taskFilters.dateRange.start) {
          const startDate = new Date(taskFilters.dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && taskDate >= startDate.getTime();
        }
        if (taskFilters.dateRange.end) {
          const endDate = new Date(taskFilters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && taskDate <= endDate.getTime();
        }
      }

      return matchesHauler && matchesPriority && matchesStatus && matchesDate;
    });
  }, [tasks, taskFilters]);
  /**
   * Handles file uploads for profile pictures or other assets.
   * Reads the file as a data URL and updates the corresponding state.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event
   * @param {"guest" | "profile" | "email"} target - The type of avatar being updated
   */
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "guest" | "profile" | "email" | "spot",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLoginError("File size too large (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === "guest") setGuestAvatar(base64String);
      if (target === "profile")
        setProfileForm((prev) => ({ ...prev, avatar: base64String }));
      if (target === "email")
        setEmailForm((prev) => ({ ...prev, avatar: base64String }));
      if (target === "spot")
        setNewSpotForm((prev) => ({ ...prev, imageUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("scene_remembered_user");
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    if (socketRef.current) {
      socketRef.current.unsubscribe();
      socketRef.current = null;
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentUserLocation(null);
    setMembers([]);
    setCruise({ isActive: false, leaderId: null, route: [] });
  };

  const handleSearchWithMaps = async () => {
    if (!discoverSearchQuery.trim()) return;
    setIsSearchingMaps(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const lat = currentUserLocation?.[0] || DEFAULT_CENTER[0];
      const lng = currentUserLocation?.[1] || DEFAULT_CENTER[1];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find car-related spots or meet areas matching: "${discoverSearchQuery}" near my current location. Provide descriptions and list the places.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
        },
      });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setMapsGroundingResults({
        text: response.text || "No details found.",
        chunks: chunks,
      });
    } catch (error) {
      console.error("Maps search failed:", error);
      setMapsGroundingResults({
        text: "Search failed. Check your connection.",
        chunks: [],
      });
    } finally {
      setIsSearchingMaps(false);
    }
  };

  const handleStartCruise = () => {
    if (!currentUserLocation || !currentUser) return;
    setCruise({
      isActive: true,
      leaderId: currentUser.id,
      route: [currentUserLocation],
    });
    setMapDisplayCenter(currentUserLocation);
    setActiveTab("cruise");
    startLocationWatch(currentUser.id);
  };

  const handleEndCruise = () => {
    if (!currentUser) return;
    setCruise({ isActive: false, leaderId: null, route: [] });
    if (currentUser.status !== "Offline" && currentUserLocation) {
      startLocationWatch(currentUser.id);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (!currentUser) return;

    if (
      isAddingWaypoint &&
      cruise.isActive &&
      cruise.leaderId === currentUser.id
    ) {
      setCruise((prev) => ({
        ...prev,
        route: [...prev.route, [latlng.lat, latlng.lng]],
      }));
      setIsAddingWaypoint(false);
    } else if (isAddingSpot) {
      setNewSpotForm((prev) => ({
        ...prev,
        location: [latlng.lat, latlng.lng],
      }));
    }
  };

  const handleSaveSpot = () => {
    if (!newSpotForm.name || !newSpotForm.location || !currentUser) return;

    const spot: Spot = {
      id: `spot-${Date.now()}`,
      name: newSpotForm.name,
      type: newSpotForm.type as Spot["type"],
      location: newSpotForm.location as [number, number],
      description: newSpotForm.description,
      imageUrl: newSpotForm.imageUrl,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    const updatedSpots = [...spots, spot];
    setSpots(updatedSpots);
    localStorage.setItem("scene_spots", JSON.stringify(updatedSpots));

    if (socketRef.current) {
      socketRef.current.send({
        type: "broadcast",
        event: "new_spot",
        payload: spot,
      });
    }

    setIsAddingSpot(false);
    setNewSpotForm({ name: "", type: "Meetup", description: "" });
    setShareFeedback("Spot added to the community map!");
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleDeleteSpot = (id: string) => {
    const updatedSpots = spots.filter((s) => s.id !== id);
    setSpots(updatedSpots);
    localStorage.setItem("scene_spots", JSON.stringify(updatedSpots));

    if (socketRef.current) {
      socketRef.current.send({
        type: "broadcast",
        event: "delete_spot",
        payload: { id },
      });
    }
  };

  const handleStartDM = (member: Member) => {
    if (!currentUser) return;
    const conversationId = member.id;
    const existing = conversations.find((c) => c.id === conversationId);

    if (!existing) {
      const newDM: Conversation = {
        id: conversationId,
        name: member.name,
        avatar: member.avatar,
        participants: [currentUser, member],
        messages: [],
        unreadCount: 0,
      };
      setConversations((prev) => [...prev, newDM]);
    }
    setActiveConversationId(conversationId);
    setActiveTab("chat");
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversationId || !currentUser) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isRead: false,
    };

    if (socketRef.current) {
      socketRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: newMessage,
      });

      // Stop typing indicator
      socketRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          memberId: currentUser.id,
          conversationId: activeConversationId,
          isTyping: false,
        },
      });
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c,
      ),
    );
    setMessageInput("");
    setIsTyping(false);

    // Award XP for participating in chat
    const helpfulKeywords = ["help", "how to", "where", "info", "meet", "location", "spot"];
    const isHelpful = helpfulKeywords.some(keyword => newMessage.text.toLowerCase().includes(keyword));
    
    if (isHelpful) {
      updateAchievements("chat", 1);
      addXp(25); // Bonus XP for being helpful
    } else {
      addXp(5); // Base XP for chatting
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser || !activeConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                const reactions = { ...(m.reactions || {}) };
                const users = [...(reactions[emoji] || [])];
                const action = users.includes(currentUser.id) ? "remove" : "add";

                if (action === "add") {
                  users.push(currentUser.id);
                } else {
                  const idx = users.indexOf(currentUser.id);
                  if (idx > -1) users.splice(idx, 1);
                }

                if (users.length === 0) delete reactions[emoji];
                else reactions[emoji] = users;

                // Broadcast reaction
                if (socketRef.current) {
                  socketRef.current.send({
                    type: "broadcast",
                    event: "reaction_update",
                    payload: {
                      messageId,
                      conversationId: activeConversationId,
                      emoji,
                      userId: currentUser.id,
                      action,
                    },
                  });
                }

                return { ...m, reactions };
              }
              return m;
            }),
          };
        }
        return c;
      }),
    );
    setReactionPickerMessageId(null);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!currentUser || !activeConversationId || !socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          memberId: currentUser.id,
          conversationId: activeConversationId,
          isTyping: true,
        },
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: {
          memberId: currentUser.id,
          conversationId: activeConversationId,
          isTyping: false,
        },
      });
    }, 2000);
  };

  const handleShareLocation = (conversationId: string) => {
    if (!currentUser || !currentUserLocation) return;
    const [lat, lng] = currentUserLocation;
    const shareLink = `Check out my live location on Scene: https://www.google.com/maps?q=${lat},${lng}`;

    const newMessage: Message = {
      id: `loc-share-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: shareLink,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c,
      ),
    );

    const conversationName =
      conversations.find((c) => c.id === conversationId)?.name || "Group";
    setShareFeedback(`Location shared to ${conversationName}`);
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleIndividualShare = (member: Member) => {
    if (!currentUser) return;
    handleStartDM(member);
    handleShareLocation(member.id);
  };

  const handleSharePhoto = (photoUrl: string) => {
    if (!currentUser) return;
    updateAchievements("photo", 1);
    addXp(100);
    setShareFeedback("Photo shared! +100 XP");
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    const updatedData = {
      id: currentUser.id,
      email: currentUser.email,
      name: profileForm.name || currentUser.name,
      car: profileForm.car,
      avatar: profileForm.avatar || currentUser.avatar,
    };

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const { user: updatedUserFromServer } = await response.json();
      
      const updatedUser: Member = {
        ...currentUser,
        ...updatedUserFromServer,
      };

      setCurrentUser(updatedUser);
      setMembers((prev) =>
        prev.map((m) => (m.id === currentUser.id ? updatedUser : m)),
      );
      
      if (socketRef.current) {
        socketRef.current.track({ user: updatedUser });
      }
      
      setShareFeedback("Profile Updated Successfully");
      setTimeout(() => setShareFeedback(null), 3000);
      setActiveTab("members");
    } catch (err: any) {
      console.error("Profile update error:", err);
      setLoginError(err.message || "Error updating profile");
    }
  };

  /**
   * Handles user status updates.
   * Updates the currentUser state with the selected status.
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e - The select change event
   */
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!currentUser) return;
    const newStatus = e.target.value as Member["status"];
    const updatedUser = { ...currentUser, status: newStatus };
    setCurrentUser(updatedUser);
    setMembers(members.map((m) => (m.id === currentUser.id ? updatedUser : m)));

    if (socketRef.current) {
      socketRef.current.track({ user: updatedUser });
      socketRef.current.send({
        type: "broadcast",
        event: "status_update",
        payload: { memberId: currentUser.id, status: newStatus },
      });
    }

    if (newStatus === "Offline") {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
      if (cruise.isActive && cruise.leaderId === currentUser.id)
        handleEndCruise();
    } else {
      if (locationWatchId.current === null && currentUserLocation)
        startLocationWatch(currentUser.id);
    }
  };

  const playAlertSound = (soundType?: Reminder["alertSound"]) => {
    const sounds = {
      default: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      engine:
        "https://actions.google.com/sounds/v1/transportation/car_engine_revving.ogg",
      turbo:
        "https://actions.google.com/sounds/v1/transportation/car_turbo_blow_off.ogg",
      horn: "https://actions.google.com/sounds/v1/transportation/car_horn_honk.ogg",
    };
    const audio = new Audio(sounds[soundType || "default"]);
    audio.play().catch((e) => console.error("Error playing sound:", e));
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) return;
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      locationName: newReminder.locationName,
      type: (newReminder.type as Reminder["type"]) || "Meetup",
      alertBefore: (newReminder.alertBefore as Reminder["alertBefore"]) || "1h",
      isCompleted: false,
      alertFired: false,
      recurring: newReminder.recurring || "none",
      alertSound: newReminder.alertSound || "default",
    };
    setReminders((prev) =>
      [...prev, reminder].sort(
        (a, b) =>
          new Date(`${a.date} ${a.time}`).getTime() -
          new Date(`${b.date} ${b.time}`).getTime(),
      ),
    );
    setIsAddingReminder(false);
    setNewReminder({
      title: "",
      date: "",
      time: "",
      locationName: "",
      type: "Meetup",
      alertBefore: "1h",
      recurring: "none",
      alertSound: "default",
    });
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: aiPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
        },
      });

      if (response.generatedImages?.[0]?.image?.imageBytes) {
        const imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        setGeneratedImage(imageUrl);
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      setAiError(error.message || "Failed to generate image");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: aiPrompt,
        config: {
          numberOfVideos: 1,
          resolution: "720p",
          aspectRatio: "16:9",
        },
      });

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: "GET",
          headers: {
            "x-goog-api-key": process.env.API_KEY!,
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setGeneratedVideo(videoUrl);
      }
    } catch (error: any) {
      console.error("Video generation error:", error);
      setAiError(error.message || "Failed to generate video");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const userMarkerIcon = useMemo(() => {
    if (!currentUser) return null;
    const isGhost = privacy.ghostMode;
    const isLeader = cruise.isActive && currentUser.id === cruise.leaderId;
    const opacity = isGhost ? "opacity-30" : "opacity-100";
    const bgColor = isGhost ? "bg-slate-700" : "bg-indigo-500";
    const ringPulse = isGhost ? "" : "animate-pulse";
    const leaderRing = isLeader ? "ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-900" : "";
    const borderColor = isLeader ? "border-indigo-400" : "border-white";

    const iconHtml = `
      <div class="relative w-10 h-10 rounded-full ${bgColor} border-4 ${borderColor} shadow-2xl flex items-center justify-center transition-all duration-700 ${opacity} ${ringPulse} ${leaderRing}">
        <img src="${currentUser.avatar || DEFAULT_AVATAR}" class="w-full h-full rounded-full object-cover p-0.5"/>
        ${isGhost ? `<div class="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-white/20"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg></div>` : ""}
      </div>`;
    return L.divIcon({
      html: iconHtml,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, [privacy.ghostMode, cruise.isActive, cruise.leaderId, currentUser]);

  const cruiseDistanceMiles = useMemo(() => {
    if (!cruise.isActive || cruise.route.length < 2) return 0;
    let totalMeters = 0;
    for (let i = 0; i < cruise.route.length - 1; i++) {
      totalMeters += calculateDistance(
        cruise.route[i][0],
        cruise.route[i][1],
        cruise.route[i + 1][0],
        cruise.route[i + 1][1],
      );
    }
    return totalMeters * 0.000621371;
  }, [cruise.isActive, cruise.route]);

  if (!isLoggedIn) {
    return (
      <AuthComponent
        isLoggedIn={isLoggedIn}
        isLoggingIn={isLoggingIn}
        loginMode={loginMode}
        setLoginMode={setLoginMode}
        loginError={loginError}
        guestUsername={guestUsername}
        setGuestUsername={setGuestUsername}
        guestAvatar={guestAvatar}
        emailForm={emailForm}
        setEmailForm={setEmailForm}
        resetSent={resetSent}
        handleGuestLogin={handleGuestLogin}
        handleEmailAuth={handleEmailAuth}
        handleForgotPassword={handleForgotPassword}
        handleFileChange={handleFileChange}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#020617] font-sans overflow-hidden text-slate-50 relative">
      {/* Floating Notifications */}
      {shareFeedback && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[5000] animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest border border-white/20">
            <CheckCircle2 size={16} />
            {shareFeedback}
          </div>
        </div>
      )}

      {locationError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[5000] animate-in slide-in-from-top duration-300">
          <div className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest border border-white/20">
            <AlertCircle size={16} />
            <span className="max-w-xs">{locationError}</span>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => {
                  setLocationError(null);
                  if (currentUser) startLocationWatch(currentUser.id);
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-[8px] font-black uppercase"
              >
                Retry
              </button>
              <button
                onClick={() => setLocationError(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Notifications */}
      <div className="absolute top-20 right-6 z-[5000] space-y-4 pointer-events-none">
        {activeNotifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-indigo-600 text-white p-5 rounded-[2rem] shadow-2xl border border-white/20 w-80 animate-in slide-in-from-right duration-500"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Bell size={16} className="animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Upcoming Event
                </span>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
            <h4 className="font-black italic uppercase text-lg mb-1">
              {notif.title}
            </h4>
            <p className="text-[10px] font-bold uppercase opacity-80">
              Starts at {notif.time} on{" "}
              {new Date(notif.date).toLocaleDateString()}
            </p>
            <button
              onClick={() => {
                setActiveTab("reminders");
                dismissNotification(notif.id);
              }}
              className="mt-4 w-full py-2 bg-white text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      <div className={`w-full md:w-[400px] flex flex-col border-r border-white/5 bg-slate-900/60 backdrop-blur-3xl z-[1000] ${isMapTab ? "h-[45%]" : "h-[85%]"} md:h-full shadow-2xl overflow-hidden order-2 md:order-1 transition-all duration-500`}>
        <div className="p-4 md:p-8 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                  Scene
                </h1>
                {privacy.ghostMode && (
                  <span
                    className="bg-slate-800 text-indigo-400 p-1 rounded-lg border border-indigo-500/20"
                    title="Ghost Mode Active"
                  >
                    <Ghost size={14} />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">
                Panhandle Pop-Up Meets
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`p-2 rounded-lg transition-colors ${activeTab === "profile" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                title="Edit Profile"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`p-2 rounded-lg transition-colors ${activeTab === "privacy" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                title="Privacy Settings"
              >
                <Shield size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 relative overflow-hidden">
              {privacy.ghostMode && (
                <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none"></div>
              )}
              <img
                src={currentUser.avatar || DEFAULT_AVATAR}
                className={`w-10 h-10 rounded-full object-cover ${privacy.ghostMode ? "opacity-40 grayscale" : ""}`}
              />
              <div className="flex-1">
                <h3 className="font-bold text-slate-300 text-sm leading-tight">
                  {currentUser.name}
                </h3>
                {currentUser.car && (
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide mb-1 opacity-90">
                    {currentUser.car}
                  </p>
                )}
                <select
                  value={currentUser.status}
                  onChange={handleStatusChange}
                  className="bg-transparent text-[10px] text-slate-400 border-none outline-none appearance-none cursor-pointer font-bold uppercase tracking-wider"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-slate-800">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-white italic">LVL {currentUser.level || 1}</span>
                  <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${(currentUser.xp % 1000) / 10}%` }}
                    />
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{currentUser.xp || 0} XP</span>
              </div>
            </div>
          )}
        </div>

        <NavigationComponent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 custom-scrollbar">
          {activeTab === "contacts" ? (
            <ContactsTab 
              contacts={contacts} 
              handleCSVImport={handleCSVImport} 
            />
          ) : activeTab === "tasks" ? (
            <TasksTab 
              filteredTasks={filteredTasks} 
              taskFilters={taskFilters} 
              setTaskFilters={setTaskFilters} 
              handleAddTask={handleAddTask} 
            />
          ) : activeTab === "discover" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                    <MapPin size={20} className="text-indigo-500" /> Discover Places
                  </h3>
                  <label className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
                    <Camera size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Share Ride</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleSharePhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search car meets, gas, food..."
                    value={discoverSearchQuery}
                    onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchWithMaps()
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSearchWithMaps}
                    disabled={isSearchingMaps}
                    className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSearchingMaps ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Search size={18} />
                    )}
                  </button>
                </div>
              </div>

              {mapsGroundingResults.text && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {mapsGroundingResults.text}
                  </p>

                  {mapsGroundingResults.chunks.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                        Live Map References
                      </h4>
                      <div className="grid gap-2">
                        {mapsGroundingResults.chunks.map(
                          (chunk: any, i: number) =>
                            chunk.maps && (
                              <a
                                key={i}
                                href={chunk.maps.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-all group"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin
                                    size={14}
                                    className="text-emerald-500 flex-shrink-0"
                                  />
                                  <span className="text-xs font-bold text-slate-200 truncate">
                                    {chunk.maps.title || "View on Google Maps"}
                                  </span>
                                </div>
                                <ExternalLink
                                  size={14}
                                  className="text-slate-500 group-hover:text-white flex-shrink-0"
                                />
                              </a>
                            ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <SupabaseTest />
            </div>
          ) : activeTab === "members" ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              {/* Broadcast Location Button */}
              <button
                onClick={() => handleShareLocation("group")}
                className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600/20 transition-all active:scale-[0.98] mb-2 shadow-lg shadow-indigo-500/5"
              >
                <Share2 size={16} /> Broadcast Location
              </button>

              {/* Member Search Bar */}
              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-600 font-bold"
                    />
                    {memberSearchQuery && (
                      <button
                        onClick={() => setMemberSearchQuery("")}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`px-4 rounded-2xl border transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${showOnlyFavorites ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300"}`}
                    title={
                      showOnlyFavorites
                        ? "Showing Favorites"
                        : "Filter Favorites"
                    }
                  >
                    <Star
                      size={14}
                      fill={showOnlyFavorites ? "currentColor" : "none"}
                    />
                    <span className="hidden sm:inline">Favs</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="All">Status: All</option>
                    {uniqueStatuses
                      .filter((s) => s !== "All")
                      .map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                  <select
                    value={memberCarFilter}
                    onChange={(e) => setMemberCarFilter(e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="All">Car: All</option>
                    {uniqueCars
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 bg-slate-800/30 rounded-3xl border border-white/5 flex flex-col gap-3 relative overflow-hidden group hover:bg-slate-800/50 transition-all"
                    >
                      {favoriteMemberIds.includes(m.id) && (
                        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-600/10 rounded-bl-[2rem] pointer-events-none flex items-center justify-center">
                          <Star
                            size={12}
                            className="text-indigo-400 opacity-30"
                            fill="currentColor"
                          />
                        </div>
                      )}
                      <div className="flex gap-4">
                        <img
                          src={m.avatar || DEFAULT_AVATAR}
                          className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-black text-white italic uppercase text-sm">
                              {m.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                LVL {m.level || 1}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => toggleFavorite(m.id)}
                                className={`p-2 transition-colors ${favoriteMemberIds.includes(m.id) ? "text-indigo-400" : "text-slate-500 hover:text-indigo-400"}`}
                                title={
                                  favoriteMemberIds.includes(m.id)
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Star
                                  size={16}
                                  fill={
                                    favoriteMemberIds.includes(m.id)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                              <button
                                onClick={() => handleIndividualShare(m)}
                                className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                                title="Share your location"
                              >
                                <Share2 size={16} />
                              </button>
                              <button
                                onClick={() => handleStartDM(m)}
                                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                                title="Send message"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1 font-black uppercase tracking-wider">
                            <Navigation size={8} /> {m.status}
                          </span>
                        </div>
                      </div>

                      {/* Car Details Section */}
                      {m.car && (
                        <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                            <Car size={12} className="text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest leading-none mb-0.5">
                              Verified Build
                            </p>
                            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-tight truncate">
                              {m.car}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">
                      {memberSearchQuery
                        ? `No members matching "${memberSearchQuery}"`
                        : showOnlyFavorites
                          ? "No favorite members online"
                          : "No other members live"}
                    </p>
                    {(memberSearchQuery || showOnlyFavorites) && (
                      <button
                        onClick={() => {
                          setMemberSearchQuery("");
                          setShowOnlyFavorites(false);
                        }}
                        className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "reminders" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-500" /> Events
                </h3>
                <button
                  onClick={() => setIsAddingReminder(!isAddingReminder)}
                  className={`p-2 rounded-xl transition-all ${isAddingReminder ? "bg-red-500/10 text-red-400" : "bg-indigo-600 text-white shadow-lg"}`}
                >
                  {isAddingReminder ? <X size={18} /> : <Plus size={18} />}
                </button>
              </div>

              {isAddingReminder && (
                <div className="bg-slate-800/40 border border-white/5 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={newReminder.title}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. Pensacola Pop-up Meet"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newReminder.locationName}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          locationName: e.target.value,
                        })
                      }
                      placeholder="e.g. Sonic Drive-In, Downtown"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newReminder.date}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            date: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 color-scheme-dark"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Time
                      </label>
                      <input
                        type="time"
                        value={newReminder.time}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            time: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 color-scheme-dark"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Type
                      </label>
                      <select
                        value={newReminder.type}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            type: e.target.value as Reminder["type"],
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="Meetup">Meetup</option>
                        <option value="Cruise">Cruise</option>
                        <option value="Show">Show</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Alert
                      </label>
                      <select
                        value={newReminder.alertBefore}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            alertBefore: e.target
                              .value as Reminder["alertBefore"],
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="none">None</option>
                        <option value="1h">1h before</option>
                        <option value="1d">1d before</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Recurring
                      </label>
                      <select
                        value={newReminder.recurring}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            recurring: e.target
                              .value as Reminder["recurring"],
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Alert Sound
                      </label>
                      <select
                        value={newReminder.alertSound}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            alertSound: e.target
                              .value as Reminder["alertSound"],
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="default">Default</option>
                        <option value="engine">Engine Rev</option>
                        <option value="turbo">Turbo Blow-off</option>
                        <option value="horn">Horn Honk</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddReminder}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20"
                  >
                    Schedule Event
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {reminders.length === 0 ? (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                    <Calendar size={48} />
                    <p className="font-black uppercase text-[10px] tracking-widest">
                      No upcoming events scheduled
                    </p>
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-5 bg-slate-800/30 border border-white/5 rounded-[2rem] group hover:bg-slate-800/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span
                            className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md mb-2 inline-block ${rem.type === "Meetup" ? "bg-indigo-500/20 text-indigo-400" : rem.type === "Cruise" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
                          >
                            {rem.type}
                          </span>
                          <h4 className="font-black text-white italic uppercase text-sm">
                            {rem.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase">
                            {new Date(rem.date).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold uppercase">
                            {rem.time}
                          </span>
                        </div>
                        {rem.locationName && (
                          <div className="flex items-center gap-2 text-indigo-400">
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase">
                              {rem.locationName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "spots" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-500" /> Community
                  Spots
                </h3>
                <button
                  onClick={() => setIsAddingSpot(!isAddingSpot)}
                  className={`p-2 rounded-lg transition-all ${isAddingSpot ? "bg-red-500 text-white" : "bg-indigo-600 text-white"}`}
                >
                  {isAddingSpot ? <X size={20} /> : <Plus size={20} />}
                </button>
              </div>

              {isAddingSpot && (
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">
                    {newSpotForm.location
                      ? "Location Set! Fill in details."
                      : "Tap anywhere on the map to set location"}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Spot Name
                      </label>
                      <input
                        type="text"
                        value={newSpotForm.name}
                        onChange={(e) =>
                          setNewSpotForm({
                            ...newSpotForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Sonic Meetup, Shell Gas"
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Type
                      </label>
                      <select
                        value={newSpotForm.type}
                        onChange={(e) =>
                          setNewSpotForm({
                            ...newSpotForm,
                            type: e.target.value as Spot["type"],
                          })
                        }
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="Meetup">Meetup</option>
                        <option value="Fuel">Fuel</option>
                        <option value="Food">Food</option>
                        <option value="Scenic">Scenic</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Description
                      </label>
                      <textarea
                        value={newSpotForm.description}
                        onChange={(e) =>
                          setNewSpotForm({
                            ...newSpotForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="What's special about this spot?"
                        rows={2}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Spot Image (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        {newSpotForm.imageUrl && (
                          <img
                            src={newSpotForm.imageUrl}
                            alt="Spot preview"
                            className="w-16 h-16 rounded-xl object-cover border border-white/10"
                          />
                        )}
                        <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl px-4 py-3 cursor-pointer transition-all">
                          <Camera size={16} className="text-indigo-400" />
                          <span className="text-xs font-bold text-slate-300">
                            {newSpotForm.imageUrl ? "Change Image" : "Upload Image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, "spot")}
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      disabled={!newSpotForm.name || !newSpotForm.location}
                      onClick={handleSaveSpot}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 transition-all"
                    >
                      Add to Community Map
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {spots.length === 0 ? (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                    <MapPin size={48} />
                    <p className="font-black uppercase text-[10px] tracking-widest">
                      No community spots added yet
                    </p>
                  </div>
                ) : (
                  spots.map((spot) => (
                    <div
                      key={spot.id}
                      className="p-5 bg-slate-800/30 border border-white/5 rounded-[2rem] group hover:bg-slate-800/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              spot.type === "Meetup"
                                ? "bg-indigo-500/20 text-indigo-400"
                                : spot.type === "Fuel"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : spot.type === "Food"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-sky-500/20 text-sky-400"
                            }`}
                          >
                            {spot.type === "Meetup" ? (
                              <Users size={16} />
                            ) : spot.type === "Fuel" ? (
                              <Fuel size={16} />
                            ) : spot.type === "Food" ? (
                              <Utensils size={16} />
                            ) : (
                              <Camera size={16} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-white italic uppercase text-sm">
                              {spot.name}
                            </h4>
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                              {spot.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMapDisplayCenter(spot.location)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Navigation size={16} />
                          </button>
                          {spot.createdBy === currentUser?.id && (
                            <button
                              onClick={() => handleDeleteSpot(spot.id)}
                              className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {spot.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={spot.imageUrl}
                            alt={spot.name}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      {spot.description && (
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                          {spot.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[8px] text-slate-600 font-black uppercase tracking-widest">
                        <Clock size={10} /> Added{" "}
                        {new Date(spot.createdAt || "").toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "cruise" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                Cruise Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={
                    cruise.isActive ? handleEndCruise : handleStartCruise
                  }
                  className={`p-4 rounded-2xl border flex flex-col items-center font-black uppercase text-[10px] gap-2 transition-all active:scale-95 ${cruise.isActive ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"}`}
                >
                  <Navigation size={24} />{" "}
                  {cruise.isActive ? "End Cruise" : "Start Cruise"}
                </button>
                <button
                  disabled={!cruise.isActive}
                  onClick={() => setIsAddingWaypoint(!isAddingWaypoint)}
                  className={`p-4 rounded-2xl border flex flex-col items-center font-black uppercase text-[10px] gap-2 transition-all active:scale-95 ${isAddingWaypoint ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20 shadow-lg" : "bg-slate-800 border-white/5 text-slate-400"}`}
                >
                  <MapPin size={24} />{" "}
                  {isAddingWaypoint ? "Click Map" : "Add Point"}
                </button>
              </div>

              {/* Cruise Location Sharing */}
              {cruise.isActive && (
                <button
                  onClick={() => handleShareLocation("group")}
                  className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  <Share2 size={16} /> Broadcast Location to Group
                </button>
              )}

              {cruise.isActive && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">
                    Live Cruise Data
                  </p>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Active Waypoints</span>
                    <span className="bg-indigo-600 text-white px-2 py-1 rounded-md">{Math.max(0, cruise.route.length - 1)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300 mt-2">
                    <span>Total Distance</span>
                    <span className="text-emerald-400">{cruiseDistanceMiles.toFixed(2)} Miles</span>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "chat" ? (
            <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
              {/* Chat Thread Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConversationId(c.id);
                      setReactionPickerMessageId(null);
                    }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all relative ${activeConversationId === c.id ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-slate-800/50 border-white/5 text-slate-500"}`}
                  >
                    {c.name}
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-slate-900">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Chat Filter Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Filter messages or senders..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-600 font-bold uppercase tracking-wider"
                />
              </div>

              {activeConversationId ? (
                <div className="flex-1 flex flex-col bg-slate-800/20 rounded-3xl border border-white/5 p-4 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {conversations
                      .find((c) => c.id === activeConversationId)
                      ?.messages.filter(
                        (msg) =>
                          msg.text
                            .toLowerCase()
                            .includes(chatSearchQuery.toLowerCase()) ||
                          msg.senderName
                            .toLowerCase()
                            .includes(chatSearchQuery.toLowerCase()),
                      )
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col group/msg ${msg.senderId === currentUser?.id ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.senderId !== currentUser?.id && (
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                {msg.senderName}
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center gap-2 group">
                            {msg.senderId === currentUser?.id && (
                              <button
                                onClick={() => setReactionPickerMessageId(reactionPickerMessageId === msg.id ? null : msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-indigo-400 transition-all"
                              >
                                <Smile size={12} />
                              </button>
                            )}
                            <div
                              className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium relative ${msg.senderId === currentUser?.id ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-700/50 text-slate-200 rounded-tl-none border border-white/5"}`}
                            >
                              {msg.text.includes("google.com/maps") ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={12} />
                                    <span className="font-black uppercase text-[8px] tracking-widest">
                                      Shared Location
                                    </span>
                                  </div>
                                  <p className="leading-tight text-[11px] mb-2">
                                    {msg.text.split(": ")[0]}:
                                  </p>
                                  <a
                                    href={msg.text.split(": ")[1]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block p-2 rounded-xl border text-center font-bold text-[10px] uppercase transition-all ${msg.senderId === currentUser?.id ? "bg-white/10 border-white/20 text-white" : "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10"}`}
                                  >
                                    View on Map
                                  </a>
                                </div>
                              ) : (
                                msg.text
                              )}
                            </div>
                            {msg.senderId !== currentUser?.id && (
                              <button
                                onClick={() => setReactionPickerMessageId(reactionPickerMessageId === msg.id ? null : msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-indigo-400 transition-all"
                              >
                                <Smile size={12} />
                              </button>
                            )}

                            {/* Reaction Picker Popover */}
                            {reactionPickerMessageId === msg.id && (
                              <div className={`absolute bottom-full mb-2 p-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl flex gap-2 z-50 animate-in zoom-in-95 duration-200 ${msg.senderId === currentUser?.id ? "right-0" : "left-0"}`}>
                                {["🔥", "🚗", "💯", "🙌", "📍", "🏎️"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all text-lg ${(msg.reactions?.[emoji] as string[] | undefined)?.includes(currentUser?.id || "") ? "bg-indigo-600/20 border border-indigo-500/50" : ""}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reactions Display */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${msg.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}>
                              {(Object.entries(msg.reactions) as [string, string[]][]).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-bold transition-all ${users.includes(currentUser?.id || "") ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400" : "bg-slate-800/50 border-white/5 text-slate-400"}`}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                              {msg.timestamp}
                            </span>
                            {msg.senderId === currentUser?.id && (
                              <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">
                                {msg.isRead ? "Read" : "Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    {/* Typing Indicator */}
                    {conversations
                      .find((c) => c.id === activeConversationId)
                      ?.typingUsers?.filter((id) => id !== currentUser?.id)
                      .map((id) => {
                        const user = members.find((m) => m.id === id);
                        return (
                          <div
                            key={`typing-${id}`}
                            className="flex items-center gap-2 text-slate-500 animate-pulse"
                          >
                            <div className="flex gap-1">
                              <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
                              <span
                                className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></span>
                              <span
                                className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              ></span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              {user?.name || "Someone"} is typing...
                            </span>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                    <button
                      onClick={() =>
                        activeConversationId &&
                        handleShareLocation(activeConversationId)
                      }
                      className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                      title="Quick share location"
                    >
                      <MapPin size={18} />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleTyping}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Send message..."
                      className="flex-1 bg-transparent border-none rounded-xl px-4 py-2 text-xs outline-none text-white placeholder:text-slate-600"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-50">
                  <MessageSquare size={40} className="mb-4" />
                  <p className="font-black uppercase text-[10px] tracking-[0.2em]">
                    Select a thread
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === "studio" ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                  <Eye size={20} className="text-indigo-500" /> AI Studio
                </h3>
              </div>

              {!hasApiKey ? (
                <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] text-center space-y-4">
                  <ShieldAlert className="mx-auto text-indigo-400" size={48} />
                  <p className="text-sm font-bold text-slate-300">
                    AI Studio requires a paid Gemini API key for video and image
                    generation.
                  </p>
                  <button
                    onClick={() => window.aistudio?.openSelectKey()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    Select API Key
                  </button>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">
                    Visit{" "}
                    <a
                      href="https://ai.google.dev/gemini-api/docs/billing"
                      target="_blank"
                      className="text-indigo-400 underline"
                    >
                      billing documentation
                    </a>{" "}
                    for more info.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Describe your vision
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. A cinematic shot of a modified JDM car drifting through a neon-lit city at night..."
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingAi || !aiPrompt.trim()}
                        className="py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        Generate Image
                      </button>
                      <button
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingAi || !aiPrompt.trim()}
                        className="py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Navigation size={16} />
                        )}
                        Generate Video
                      </button>
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                      <AlertCircle size={18} />
                      <p className="text-[10px] font-bold uppercase">
                        {aiError}
                      </p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {generatedImage && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Generated Image
                        </p>
                        <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                          <img
                            src={generatedImage}
                            className="w-full aspect-square object-cover"
                          />
                          <button
                            onClick={() => {
                              setProfileForm({
                                ...profileForm,
                                avatar: generatedImage,
                              });
                              setActiveTab("profile");
                            }}
                            className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-xl text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                          >
                            Use as Avatar
                          </button>
                        </div>
                      </div>
                    )}

                    {generatedVideo && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Generated Video
                        </p>
                        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
                          <video
                            src={generatedVideo}
                            controls
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "leaderboard" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pt-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-500" /> Leaderboard
                </h3>

                <div className="space-y-3">
                  {useMemo(() => 
                    [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0)),
                    [members]
                  ).map((member, index) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                          member.id === currentUser?.id
                            ? "bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10"
                            : "bg-slate-800/30 border-white/5 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {index === 0 ? (
                            <Trophy size={20} className="text-yellow-400" />
                          ) : index === 1 ? (
                            <Trophy size={20} className="text-slate-300" />
                          ) : index === 2 ? (
                            <Trophy size={20} className="text-amber-600" />
                          ) : (
                            <span className="text-xs font-black text-slate-500">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <img
                          src={member.avatar || DEFAULT_AVATAR}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                        />
                        <div className="flex-1">
                          <h4 className="font-black text-white italic uppercase text-sm">
                            {member.name}
                          </h4>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                            Level {member.level || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white tracking-tighter">
                            {member.xp || 0}
                          </p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                            XP
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : activeTab === "achievements" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pt-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Trophy size={20} className="text-indigo-500" /> Achievements
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {currentUser?.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                        ach.unlockedAt
                          ? "bg-indigo-600/10 border-indigo-500/30"
                          : "bg-slate-800/30 border-white/5 grayscale opacity-60"
                      }`}
                    >
                      {ach.unlockedAt && (
                        <div className="absolute top-0 right-0 p-2">
                          <CheckCircle2 size={16} className="text-indigo-400" />
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="text-3xl">{ach.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-black text-white italic uppercase text-sm">
                            {ach.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">
                            {ach.description}
                          </p>

                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                Progress
                              </span>
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                {ach.type === "distance"
                                  ? `${(ach.progress / 1000).toFixed(1)} / ${(ach.requirement / 1000).toFixed(1)} KM`
                                  : `${ach.progress} / ${ach.requirement}`}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, (ach.progress / ach.requirement) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-indigo-500" /> Edit
                  Profile
                </h3>

                <div className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer">
                      <img
                        src={profileForm.avatar || DEFAULT_AVATAR}
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-500 shadow-2xl group-hover:opacity-75 transition-opacity"
                      />
                      <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Plus className="text-white" size={32} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "profile")}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-4 tracking-widest">
                      Tap to upload photo
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your Name"
                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Vehicle Build
                      </label>
                      <input
                        type="text"
                        value={profileForm.car}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            car: e.target.value,
                          })
                        }
                        placeholder="Year Make Model"
                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {/* QR Code Section */}
                    <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block text-center">
                        Share Your Profile
                      </label>
                      <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10">
                        <QRCodeCanvas
                          value={JSON.stringify({
                            id: currentUser?.id,
                            name: currentUser?.name,
                            car: currentUser?.car,
                          })}
                          size={120}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mt-4 tracking-widest text-center max-w-[200px]">
                        Other members can scan this to quickly find your build
                        and start a chat.
                      </p>
                    </div>

                    <button
                      onClick={handleUpdateProfile}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                    >
                      <Save size={16} /> Save Profile Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "privacy" ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-500" /> Privacy
                  Center
                </h3>

                <div className="space-y-6">
                  {/* Visibility Controls */}
                  <div className="p-6 bg-slate-800/30 rounded-3xl border border-white/5 space-y-6 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-slate-900 text-indigo-400">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white italic uppercase text-sm">
                          Location Visibility
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          Control who can see you on the map
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'everyone', label: 'Everyone', icon: <Eye size={18} />, desc: 'Visible to all members' },
                        { id: 'favorites', label: 'Favorites Only', icon: <Star size={18} />, desc: 'Visible only to your favorite members' },
                        { id: 'ghost', label: 'Ghost Mode', icon: <Ghost size={18} />, desc: 'Completely invisible to everyone' }
                      ].map((option) => {
                        const isActive = option.id === 'ghost' ? privacy.ghostMode : (!privacy.ghostMode && privacy.visibility === option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              if (option.id === 'ghost') {
                                setPrivacy(prev => ({ ...prev, ghostMode: true }));
                              } else {
                                setPrivacy(prev => ({ ...prev, ghostMode: false, visibility: option.id as 'everyone' | 'favorites' }));
                              }
                            }}
                            className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center gap-4 ${isActive ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800"}`}
                          >
                            <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-slate-800"}`}>
                              {option.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase">{option.label}</span>
                                {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                              </div>
                              <p className={`text-[9px] font-bold uppercase mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-600"}`}>
                                {option.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-20 font-black uppercase tracking-widest text-xs">
              Accessing {activeTab}...
            </p>
          )}
        </div>
      </div>

      <MapComponent
        center={mapDisplayCenter}
        mapLayer={mapLayer}
        setMapLayer={setMapLayer}
        isMapTab={isMapTab}
        setActiveTab={setActiveTab}
        spots={spots}
        members={members}
        currentUser={currentUser}
        currentUserLocation={currentUserLocation}
        isAddingSpot={isAddingSpot}
        newSpotForm={newSpotForm}
        favoriteMemberIds={favoriteMemberIds}
        showOnlyFavorites={showOnlyFavorites}
        handleMapClick={handleMapClick}
        handleDeleteSpot={handleDeleteSpot}
        handleStartDM={handleStartDM}
        setMapDisplayCenter={setMapDisplayCenter}
        MapViewUpdater={MapViewUpdater}
        MapEventsHandler={MapEventsHandler}
        isAddingWaypoint={isAddingWaypoint}
        cruise={cruise}
        createWaypointIcon={createWaypointIcon}
        createSpotMapIcon={createSpotMapIcon}
        createMemberMapIcon={createMemberMapIcon}
        userMarkerIcon={userMarkerIcon}
        CruisePolyline={CruisePolyline}
      />
    </div>
  );
};

export default App;
