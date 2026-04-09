// Shared type definitions for the Scene application
// Consolidated from types.ts and src/types.ts

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  type: 'distance' | 'photo' | 'checkpoint' | 'chat';
  requirement: number;
  progress: number;
}

export interface PrivacySettings {
  ghostMode: boolean;
  visibility: 'everyone' | 'favorites' | 'public' | 'private';
}

export interface Member {
  id: string;
  email?: string;
  name: string;
  car?: string;
  location: [number, number];
  status: 'Cruising' | 'Parked' | 'Heading to meet' | 'At Meetup' | 'On Detour' | 'Offline' | 'Online';
  avatar: string;
  lastSeen: string;
  isFavorite?: boolean;
  isGhost?: boolean;
  privacy?: PrivacySettings;
  xp: number;
  level: number;
  totalDistance: number; // in meters
  achievements: Achievement[];
  photosShared: number;
  checkpointsVisited: string[];
}

export interface Spot {
  id: string;
  name: string;
  address?: string;
  uri?: string;
  type: 'Meetup' | 'Fuel' | 'Food' | 'Scenic';
  location: [number, number];
  description?: string;
  imageUrl?: string;
  photo?: string;
  createdBy: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  hauler?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  hauler?: string;
  createdAt: string;
  dueDate?: string;
}

export interface Message {
  id: string;
  senderId: 'user' | string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
  reactions?: { [emoji: string]: string[] }; // emoji -> list of userIds
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
  participants?: string[];
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
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  alertSound?: 'default' | 'engine' | 'turbo' | 'horn';
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: Member | null;
  userLocation: [number, number] | null;
  members: Member[];
  contacts: Contact[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
}