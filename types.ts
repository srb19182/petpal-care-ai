export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  weight: string;
  avatar: string;
  birthday: Date;
  species: 'Dog' | 'Cat';
  vaccinationInfo: string;
}

export interface RoutineItem {
  id: string;
  time: string;
  activity: string;
  details: string;
  icon: string; // e.g., 'food', 'walk', 'sleep'
}

export interface HealthScanResult {
  score: number;
  status: 'Normal' | 'Caution' | 'Alert';
  analysis: string;
  recommendations: string[];
}

export interface Reminder {
  id: string;
  petId: string;
  title: string;
  date: string;
  time: string;
  frequency: 'none' | 'daily' | 'weekly';
}

export interface CommunityPost {
  id: number;
  author: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
}

export interface Vet {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}