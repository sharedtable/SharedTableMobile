import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Define all the navigation param lists here
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  Waitlist: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: { hasInvitation?: boolean };
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type BookingStackParamList = {
  BookingList: undefined;
  BookingDetails: { bookingId: string };
  RefineExperience: { bookingId?: string; dinnerData?: Record<string, unknown> };
};

// Export navigation prop types
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type BookingStackNavigationProp = NativeStackNavigationProp<BookingStackParamList>;