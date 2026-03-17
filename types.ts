
export interface Member {
  id: string;
  name: string;
  car?: string; // Made optional for guests/non-Facebook users
  location: [number, number];
  status: 'Cruising' | 'Parked' | 'Heading to meet' | 'At Meetup' | 'On Detour' | 'Offline';
  avatar: string;
  lastSeen: string;
  isFavorite?: boolean;
}

export interface Spot {
  id: string;
  name: string;
  address?: string;
  uri?: string;
  type: 'Meetup' | 'Fuel' | 'Food' | 'Scenic';
  location: [number, number];
  description?: string;
  photo?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface PrivacySettings {
  ghostMode: boolean;
  visibility: 'everyone' | 'favorites';
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: Member | null;
  userLocation: [number, number] | null;
  members: Member[];
  loading: boolean;
  error: string | null;
}

export interface Message {
  id: string;
  senderId: 'user' | string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  participants: Member[];
  messages: Message[];
  unreadCount: number;
  typingUsers?: string[];
}

export interface Cruise {
  isActive: boolean;
  leaderId: 'user' | string | null;
  route: [number, number][];
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  locationName?: string;
  coordinates?: [number, number];
  type: 'Meetup' | 'Cruise' | 'Show' | 'Other';
  alertBefore: 'none' | '1h' | '1d';
  isCompleted: boolean;
  alertFired?: boolean;
}
