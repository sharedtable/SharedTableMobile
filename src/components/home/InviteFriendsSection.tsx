import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  Keyboard,
  ActivityIndicator,
  ScrollView
} from 'react-native';

import { theme } from '@/theme';
import { Colors } from '@/constants/colors';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

interface UserConnection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  mutual_friends?: number;
}

interface InviteFriendsSectionProps {
  onInvite?: (email: string) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export const InviteFriendsSection: React.FC<InviteFriendsSectionProps> = ({ onInvite, scrollViewRef }) => {
  const [email, setEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch user connections on mount
  useEffect(() => {
    fetchUserConnections();
  }, []);

  const fetchUserConnections = async () => {
    try {
      setLoading(true);
      // TODO: These are mock suggestions for demo purposes
      // In production, this should fetch:
      // 1. Friends who have attended Fare dinners before
      // 2. People from user's past tables/dinners
      // 3. Mutual connections from social networks
      const mockConnections: UserConnection[] = [
        { id: '1', name: 'John Smith', email: 'john.smith@stanford.edu', mutual_friends: 5 },
        { id: '2', name: 'Emily Johnson', email: 'emily.j@stanford.edu', mutual_friends: 3 },
        { id: '3', name: 'Michael Chen', email: 'mchen@stanford.edu', mutual_friends: 8 },
        { id: '4', name: 'Sarah Williams', email: 'sarah.w@stanford.edu', mutual_friends: 2 },
        { id: '5', name: 'David Brown', email: 'dbrown@stanford.edu', mutual_friends: 4 },
        { id: '6', name: 'Jessica Davis', email: 'jdavis@stanford.edu', mutual_friends: 6 },
        { id: '7', name: 'James Wilson', email: 'jwilson@stanford.edu', mutual_friends: 1 },
        { id: '8', name: 'Maria Garcia', email: 'mgarcia@stanford.edu', mutual_friends: 7 },
      ];
      
      // In production, use:
      // const response = await api.getUserConnections();
      // if (response.success && response.data) {
      //   setConnections(response.data);
      // }
      
      setConnections(mockConnections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!email.trim()) return [];
    
    const searchTerm = email.toLowerCase().trim();
    
    // Only show suggestions from the connections list
    return connections
      .filter(connection => {
        // Match full display name
        const fullNameMatch = connection.name.toLowerCase().includes(searchTerm);
        
        // Match by initials (first letter of first and last name)
        const nameParts = connection.name.split(' ');
        const initials = nameParts.map(part => part[0]).join('').toLowerCase();
        const initialsMatch = initials === searchTerm || initials.startsWith(searchTerm);
        
        // Match first name only
        const firstNameMatch = nameParts[0]?.toLowerCase().startsWith(searchTerm);
        
        // Match last name only
        const lastNameMatch = nameParts[nameParts.length - 1]?.toLowerCase().startsWith(searchTerm);
        
        return fullNameMatch || initialsMatch || firstNameMatch || lastNameMatch;
      })
      .sort((a, b) => {
        // Sort by relevance
        const aNameParts = a.name.split(' ');
        const bNameParts = b.name.split(' ');
        
        // Check different match types for better sorting
        const aFirstNameStart = aNameParts[0]?.toLowerCase().startsWith(searchTerm);
        const bFirstNameStart = bNameParts[0]?.toLowerCase().startsWith(searchTerm);
        const aLastNameStart = aNameParts[aNameParts.length - 1]?.toLowerCase().startsWith(searchTerm);
        const bLastNameStart = bNameParts[bNameParts.length - 1]?.toLowerCase().startsWith(searchTerm);
        
        // Prioritize first name matches, then last name matches
        if (aFirstNameStart && !bFirstNameStart) return -1;
        if (!aFirstNameStart && bFirstNameStart) return 1;
        if (aLastNameStart && !bLastNameStart) return -1;
        if (!aLastNameStart && bLastNameStart) return 1;
        
        // Then sort by mutual friends count
        return (b.mutual_friends || 0) - (a.mutual_friends || 0);
      })
      .slice(0, 5); // Limit to 5 suggestions
  }, [email, connections]);

  const handleInvite = useCallback(() => {
    if (email.trim() && email.includes('@')) {
      onInvite?.(email);
      setEmail('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  }, [email, onInvite]);

  const handleSelectSuggestion = useCallback((connection: UserConnection) => {
    setEmail(connection.email);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Don't auto-send, let user click the + button to send
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setEmail(text);
    // Only show suggestions if there's input and we have connections
    setShowSuggestions(text.length > 0 && connections.length > 0);
    setSelectedIndex(-1);
  }, [connections.length]);

  const handleInputFocus = useCallback(() => {
    if (email.length > 0 && connections.length > 0) {
      setShowSuggestions(true);
    }
    
    // Use a delay to ensure keyboard is open before measuring
    setTimeout(() => {
      if (inputRef.current && scrollViewRef?.current) {
        inputRef.current.measureLayout(
          scrollViewRef.current.getInnerViewNode() as unknown as number,
          (x: number, y: number, width: number, height: number) => {
            // Scroll so the bottom of the input is just above the keyboard
            // The input's bottom position is y + height
            // We want this to be at the bottom of the visible screen
            const inputBottom = y + height;
            const scrollPosition = inputBottom + 10; // Just 10px padding
            
            scrollViewRef.current?.scrollTo({
              y: scrollPosition,
              animated: true
            });
          },
          () => {
            console.log('Failed to measure layout');
          }
        );
      }
    }, 300); // Give keyboard time to open
  }, [email.length, connections.length, scrollViewRef]);

  const handleInputBlur = useCallback(() => {
    // Delay to allow suggestion tap to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  return (
    <View ref={containerRef} style={styles.container}>
      <Text style={styles.title}>Invite Friends</Text>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Pair up with Your Friends"
            placeholderTextColor={theme.colors.text.secondary}
            value={email}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleInvite}
            blurOnSubmit={true}
            accessible={true}
            accessibilityLabel="Friend email input"
            accessibilityHint="Enter your friend's email address to invite them"
          />
          <Pressable 
            style={[styles.addButton, (!email.trim() || !email.includes('@')) && styles.addButtonDisabled]} 
            onPress={handleInvite}
            disabled={!email.trim() || !email.includes('@')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Send invite"
            accessibilityState={{ disabled: !email.trim() || !email.includes('@') }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer} pointerEvents="box-none">
            <ScrollView
              nestedScrollEnabled={true}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="always"
              style={{ maxHeight: scaleHeight(200) }}
            >
              {filteredSuggestions.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.suggestionItem,
                    index === selectedIndex && styles.suggestionItemSelected,
                    index === filteredSuggestions.length - 1 && styles.suggestionItemLast
                  ]}
                  onPress={() => handleSelectSuggestion(item)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                  accessibilityHint={`Tap to invite ${item.name} at ${item.email}`}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.suggestionEmail} numberOfLines={1}>
                        {item.email}
                      </Text>
                      {item.mutual_friends && item.mutual_friends > 0 && (
                        <Text style={styles.mutualFriends}>
                          {item.mutual_friends} mutual {item.mutual_friends === 1 ? 'friend' : 'friends'}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={16} color={theme.colors.text.tertiary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Loading state */}
        {loading && email.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          </View>
        )}
      </View>
      
      <Text style={styles.helperText}>
        {showSuggestions && filteredSuggestions.length > 0 
          ? `${filteredSuggestions.length} suggestion${filteredSuggestions.length > 1 ? 's' : ''} found`
          : 'Friends will receive invitations to join your dinner'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleWidth(48),
    justifyContent: 'center',
    width: scaleWidth(48),
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray300,
    opacity: 0.6,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(28),
    fontWeight: '400' as any,
  },
  container: {
    borderTopColor: Colors.gray200,
    borderTopWidth: 1,
    marginTop: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(24),
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(4),
  },
  input: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(28),
    borderWidth: 1,
    flexDirection: 'row',
    height: scaleHeight(56),
    paddingLeft: scaleWidth(20),
    paddingRight: scaleWidth(4),
    zIndex: 1001,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(16),
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: scaleHeight(60),
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    borderColor: Colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: scaleHeight(200),
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  suggestionItemSelected: {
    backgroundColor: Colors.gray50,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.primary.light || '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  avatarText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(2),
  },
  suggestionEmail: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  mutualFriends: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    marginTop: scaleHeight(2),
  },
  loadingContainer: {
    position: 'absolute',
    bottom: scaleHeight(60),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: scaleHeight(20),
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
});
