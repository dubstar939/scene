export interface Spot {
  id: string;
  name: string;
  type: "Meet" | "Photo" | "Cruise" | "Shop";
  location: [number, number];
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  car?: string;
  status: "Online" | "Offline" | "Cruising" | "Parked";
  location: [number, number];
  lastSeen: string;
  isGhost?: boolean;
  privacy?: {
    visibility: "public" | "favorites" | "private";
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface Cruise {
  isActive: boolean;
  route: [number, number][];
  participants: string[];
}
