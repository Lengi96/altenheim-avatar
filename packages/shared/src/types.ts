// ---- Facility ----
export interface Facility {
  id: string;
  name: string;
  slug: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  plan: 'trial' | 'basic' | 'premium';
  maxResidents: number;
  createdAt: string;
  active: boolean;
}

// ---- User (Staff) ----
export type UserRole = 'admin' | 'caregiver' | 'family';

export interface User {
  id: string;
  facilityId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  active: boolean;
}

// ---- Resident ----
export type CognitiveLevel = 'normal' | 'mild_dementia' | 'moderate_dementia';
export type AddressForm = 'du' | 'sie';

export interface Resident {
  id: string;
  facilityId: string;
  firstName: string;
  displayName?: string;
  birthYear?: number;
  gender?: string;
  addressForm: AddressForm;
  language: string;
  cognitiveLevel: CognitiveLevel;
  avatarName: string;
  createdAt: string;
  active: boolean;
}

// ---- Biography ----
export type BiographyCategory =
  | 'family'
  | 'career'
  | 'hobbies'
  | 'hometown'
  | 'memories'
  | 'preferences';

export type BiographySource = 'manual' | 'conversation';

export interface Biography {
  id: string;
  residentId: string;
  category: BiographyCategory;
  key: string;
  value: string;
  source: BiographySource;
  createdAt: string;
}

// ---- Chat ----
export type ChatMode = 'bewohner' | 'pfleger';
export type MessageRole = 'user' | 'assistant';
export type Mood = 'happy' | 'sad' | 'neutral' | 'anxious' | 'confused';

export interface Conversation {
  id: string;
  residentId: string;
  startedAt: string;
  endedAt?: string;
  mode: ChatMode;
  messageCount: number;
  moodStart?: Mood;
  moodEnd?: Mood;
  summary?: string;
  flagged: boolean;
  flagReason?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  moodDetected?: Mood;
  tokensUsed?: number;
  createdAt: string;
}

// ---- API Request/Response Types ----
export interface ChatRequest {
  message: string;
  mode: ChatMode;
  conversationId?: string;
  history?: { role: MessageRole; content: string }[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PinLoginRequest {
  facilitySlug: string;
  pin: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
  resident?: Resident;
}

// ---- SSE Event Types ----
export interface SSETextEvent {
  type: 'text';
  text: string;
}

export interface SSEDoneEvent {
  type: 'done';
  reply: string;
  conversationId: string;
}

export interface SSEErrorEvent {
  type: 'error';
  error: string;
}

export type SSEEvent = SSETextEvent | SSEDoneEvent | SSEErrorEvent;
