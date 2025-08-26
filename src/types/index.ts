// Main type definitions for SharedTable Mobile

// User and Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified?: boolean;
  profileCompleted: boolean;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Profile Types
export interface ProfileData {
  // Personal Info
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Demographics
  studentStatus: string;
  ethnicity: string[];
  relationshipStatus: string;
  religion: string;
  heightCm: string;
  interestedIn: string[];
  dob: string;
  gender: string;
  major: string;
  nationality: string;

  // Personality & Lifestyle
  q1LeadConversations: number | null;
  q2CompromisePeace: number | null;
  q3SeekNewExperiences: number | null;
  politicalView: number | null;
  earlyBirdNightOwl: number | null;
  activePerson: number | null;
  workLifeBalance: number | null;
  smokeDrink: string[];
  favoriteHobby: string;
  mbti: string;

  // Social Media
  useSocialMedia: string;
  socialMedia1Platform: string;
  socialMedia1Handle: string;
  socialMedia2Platform: string;
  socialMedia2Handle: string;

  // Dietary & Dining
  mealBudget: number | null;
  eatingSpeed: number | null;
  dietaryRestrictions: string;
  dietaryPreferences: string;
  interestingFact: string;
  dinnerGoals: string;
  dinnerType: string;

  // Singles Preferences
  relationshipLookingFor: string[];
  wantChildren: string;
  attractedToEthnicities: string[];
  ageRangeMin: number | null;
  ageRangeMax: number | null;

  // Profile Photo
  selfieUrl?: string;
}

// Event Types
export type EventType = 'friends' | 'singles';
export type EventStatus = 'upcoming' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string;
  address: string;
  spotsAvailable: number;
  totalSpots: number;
  price: number;
  description: string;
  host: {
    name: string;
    photo?: string;
  };
  tags: string[];
  requirements?: string[];
  whatToBring?: string[];
  attendees?: number;
  photos?: string[];
}

// Booking Types
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  confirmationNumber: string;
  status: BookingStatus;
  event: Event;
  bookedAt: string;
  guestCount: number;
  totalPaid: number;
  canCancel: boolean;
  cancelDeadline?: string;
  qrCode?: string;
  specialInstructions?: string;
  payment?: {
    amount: number;
    status: string;
    refundable: boolean;
  };
}

export interface CreateBookingData {
  eventId: string;
  paymentMethodId: string;
  guestCount: number;
  dietaryRestrictions?: string;
  notes?: string;
}

// Reservation Types (Legacy compatibility)
export interface Diner {
  id: string;
  name: string;
  profilePhoto?: string;
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  guests: number;
  restaurantName: string;
  restaurantImage: string;
  address: string;
  cuisine: string;
  status: 'current' | 'past';
  showFullDetails: boolean;
  otherDiners?: Diner[];
}

export interface ExperienceRatings {
  restaurant: number | null;
  conversation: number | null;
  chemistry: number | null;
  enjoyment: number | null;
}

export interface ValuationSubmission {
  scores: ExperienceRatings;
  matches: string[];
}

// Notification Types
export type NotificationType = 'booking' | 'reminder' | 'social' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    bookingId?: string;
    eventId?: string;
    [key: string]: unknown;
  };
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Search & Filter Types
export interface EventFilters {
  type?: EventType;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  tags?: string[];
}

export interface SearchQuery {
  q: string;
  filters?: string;
  sortBy?: 'date' | 'price' | 'popularity';
  limit?: number;
  offset?: number;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Profile: undefined;
  Events: { type?: EventType };
  EventDetails: { eventId: string };
  Bookings: undefined;
  BookingDetails: { bookingId: string };
  Payment: { eventId: string; amount: number };
  Notifications: undefined;
  Settings: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  EventsTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};
