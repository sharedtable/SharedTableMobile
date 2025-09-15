import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type PostDinnerSurveyParams = {
  bookingId: string;
  dinnerId: string;
};

type RootStackParamList = {
  PostDinnerSurvey: PostDinnerSurveyParams;
  Home: undefined;
  Profile: undefined;
};

interface DinerInfo {
  id: string;
  name: string;
  avatar?: string;
  dinerId: number;
  bio?: string;
}

interface SurveyData {
  // Page 1 - Food
  foodOverallRating: number;
  foodQuality: 'quality' | 'ambience' | 'variety' | 'value' | '';
  foodTasteRating: number;
  foodPreferencesMatch: 'well' | 'okay' | 'poorly' | '';
  eatAgain: 'yes' | 'no' | '';
  
  // Page 2 - People
  dinerConnections: Record<string, {
    enjoyableRating: number;
    feelMatch: 'yes' | 'no' | '';
    fitForGroup: number;
    dineAgain: 'yes' | 'maybe' | 'no' | '';
  }>;
  
  // Page 3 - Group
  groupEnjoymentRating: number;
  groupMatchRating: number;
  conversationRating: number;
  dineAgain: 'yes' | 'maybe' | 'no' | '';
  groupMatch: 'yes' | 'no' | 'somewhat' | '';
  
  // Additional
  anythingElse: string;
}

const PostDinnerSurveyScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostDinnerSurvey'>>();
  const { bookingId, dinnerId } = route.params;

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diners, setDiners] = useState<DinerInfo[]>([]);
  const [loadingDiners, setLoadingDiners] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<{
    name: string;
    address: string;
    cuisine: string;
  } | null>(null);
  
  const [surveyData, setSurveyData] = useState<SurveyData>({
    foodOverallRating: 0,
    foodQuality: '',
    foodTasteRating: 0,
    foodPreferencesMatch: '',
    eatAgain: '',
    dinerConnections: {},
    groupEnjoymentRating: 0,
    groupMatchRating: 0,
    conversationRating: 0,
    dineAgain: '',
    groupMatch: '',
    anythingElse: '',
  });

  // Fetch dinner attendees and restaurant info
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!bookingId) return;
      
      setLoadingDiners(true);
      try {
        const response = await api.getBookingGroupMembers(bookingId);
        
        if (response.success && response.data) {
          // Set restaurant info
          setRestaurantInfo(response.data.restaurant);
          
          // Set diners
          setDiners(response.data.diners);
          
          // Initialize diner connections
          const connections: Record<string, {
            enjoyableRating: number;
            feelMatch: 'yes' | 'no' | '';
            fitForGroup: number;
            dineAgain: 'yes' | 'maybe' | 'no' | '';
          }> = {};
          response.data.diners.forEach(diner => {
            connections[diner.id] = {
              enjoyableRating: 0,
              feelMatch: '',
              fitForGroup: 0,
              dineAgain: '',
            };
          });
          setSurveyData(prev => ({ ...prev, dinerConnections: connections }));
        } else {
          // Fallback to mock data if API fails
          const mockDiners: DinerInfo[] = [
            { id: '1', name: 'Bryan Wolf', dinerId: 1, bio: 'Love trying new cuisines' },
            { id: '2', name: 'Tamara Schmidt', dinerId: 3, bio: 'Foodie and wine enthusiast' },
          ];
          setDiners(mockDiners);
          
          const connections: Record<string, {
            enjoyableRating: number;
            feelMatch: 'yes' | 'no' | '';
            fitForGroup: number;
            dineAgain: 'yes' | 'maybe' | 'no' | '';
          }> = {};
          mockDiners.forEach(diner => {
            connections[diner.id] = {
              enjoyableRating: 0,
              feelMatch: '',
              fitForGroup: 0,
              dineAgain: '',
            };
          });
          setSurveyData(prev => ({ ...prev, dinerConnections: connections }));
        }
      } catch (error) {
        console.error('Failed to fetch group data:', error);
        // Use mock data on error
        const mockDiners: DinerInfo[] = [
          { id: '1', name: 'Bryan Wolf', dinerId: 1, bio: 'Love trying new cuisines' },
          { id: '2', name: 'Tamara Schmidt', dinerId: 3, bio: 'Foodie and wine enthusiast' },
        ];
        setDiners(mockDiners);
        
        const connections: Record<string, {
          enjoyableRating: number;
          feelMatch: 'yes' | 'no' | '';
          fitForGroup: number;
          dineAgain: 'yes' | 'maybe' | 'no' | '';
        }> = {};
        mockDiners.forEach(diner => {
          connections[diner.id] = {
            enjoyableRating: 0,
            feelMatch: '',
            fitForGroup: 0,
            dineAgain: '',
          };
        });
        setSurveyData(prev => ({ ...prev, dinerConnections: connections }));
      } finally {
        setLoadingDiners(false);
      }
    };
    
    // Fetch data when component mounts or when navigating to page 2
    if (bookingId && (currentPage === 1 || currentPage === 2)) {
      fetchGroupData();
    }
  }, [bookingId, currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Transform survey data for API
      const apiData = {
        bookingId,
        dinnerId,
        ratings: {
          restaurant: surveyData.foodOverallRating,
          conversation: surveyData.conversationRating,
          chemistry: surveyData.groupMatchRating,
          overall: surveyData.groupEnjoymentRating,
        },
        feedback: surveyData.anythingElse,
        matches: Object.entries(surveyData.dinerConnections)
          .filter(([_, data]) => data.feelMatch === 'yes')
          .map(([dinerId]) => dinerId),
        additionalData: {
          foodQuality: surveyData.foodQuality,
          foodTasteRating: surveyData.foodTasteRating,
          foodPreferencesMatch: surveyData.foodPreferencesMatch,
          eatAgain: surveyData.eatAgain,
          dineAgain: surveyData.dineAgain,
          groupMatch: surveyData.groupMatch,
        },
      };

      await api.submitPostDinnerSurvey(apiData);

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Profile'),
          },
        ]
      );
    } catch (_error) {
      Alert.alert('Error', 'Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingId, dinnerId, surveyData, navigation]);

  const renderStarRating = (value: number, onChange: (rating: number) => void, color = theme.colors.primary.main) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={scaleWidth(32)}
              color={star <= value ? color : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentPage / totalPages) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    );
  };

  const renderPage1 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>How was your dinner? 🍽️</Text>
      {restaurantInfo && (
        <Text style={styles.restaurantName}>{restaurantInfo.name}</Text>
      )}
      <Text style={styles.pageSubtitle}>
        Your feedback helps us serve up better flavors and dining vibes every time.
      </Text>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>What did you like about it?*</Text>
        <View style={styles.optionsGrid}>
          {[
            { value: 'quality', label: 'QUALITY OF THE FOOD', color: theme.colors.primary.main },
            { value: 'ambience', label: 'AMBIENCE', color: theme.colors.primary.main },
            { value: 'variety', label: 'VARIETY / MENU OPTIONS', color: theme.colors.primary.main },
            { value: 'value', label: 'VALUE FOR MONEY', color: theme.colors.primary.main },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                surveyData.foodQuality === option.value && styles.optionButtonSelected
              ]}
              onPress={() => setSurveyData(prev => ({ ...prev, foodQuality: option.value as 'quality' | 'ambience' | 'variety' | 'value' }))}
            >
              <Text style={[
                styles.optionButtonText,
                surveyData.foodQuality === option.value && styles.optionButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>How would you rate the taste of the food? *</Text>
        {renderStarRating(
          surveyData.foodTasteRating,
          (rating) => setSurveyData(prev => ({ ...prev, foodTasteRating: rating })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>How well did the food match your preferences? *</Text>
        {renderStarRating(
          surveyData.foodOverallRating,
          (rating) => setSurveyData(prev => ({ ...prev, foodOverallRating: rating })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Would you want to eat here again? *</Text>
        {renderStarRating(
          surveyData.eatAgain === 'yes' ? 5 : (surveyData.eatAgain === 'no' ? 1 : 0),
          (rating) => setSurveyData(prev => ({ ...prev, eatAgain: rating >= 3 ? 'yes' : 'no' })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Anything else?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Tell us everything! Which dish wowed you the most, and what could've been better?"
          placeholderTextColor="#9CA3AF"
          value={surveyData.anythingElse}
          onChangeText={(text) => setSurveyData(prev => ({ ...prev, anythingElse: text }))}
          multiline
          numberOfLines={4}
        />
      </View>
    </ScrollView>
  );

  const renderPage2 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>How was your dinner? 🤝</Text>
      <Text style={styles.pageSubtitle}>
        Your feedback helps us create even better matches and more memorable connections.
      </Text>

      {loadingDiners ? (
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      ) : (
        diners.map((diner) => (
          <View key={diner.id} style={styles.dinerCard}>
            <View style={styles.dinerHeader}>
              <View style={styles.dinerAvatar}>
                <Ionicons name="person-circle" size={48} color="#D1D5DB" />
              </View>
              <View style={styles.dinerInfo}>
                <Text style={styles.dinerLabel}>Diner {diner.dinerId}</Text>
                <Text style={styles.dinerName}>{diner.name}</Text>
                <Text style={styles.dinerSubtext}>Diner {diner.dinerId} of 6</Text>
              </View>
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionText}>How enjoyable was it to dine with {diner.name.split(' ')[0]}? *</Text>
              {renderStarRating(
                surveyData.dinerConnections[diner.id]?.enjoyableRating || 0,
                (rating) => setSurveyData(prev => ({
                  ...prev,
                  dinerConnections: {
                    ...prev.dinerConnections,
                    [diner.id]: {
                      ...prev.dinerConnections[diner.id],
                      enjoyableRating: rating,
                    },
                  },
                })),
                theme.colors.primary.main
              )}
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Did you feel {diner.name.split(' ')[0]} was a good match for you as a dining partner? *
              </Text>
              {renderStarRating(
                surveyData.dinerConnections[diner.id]?.feelMatch === 'yes' ? 5 : 
                (surveyData.dinerConnections[diner.id]?.feelMatch === 'no' ? 1 : 0),
                (rating) => setSurveyData(prev => ({
                  ...prev,
                  dinerConnections: {
                    ...prev.dinerConnections,
                    [diner.id]: {
                      ...prev.dinerConnections[diner.id],
                      feelMatch: rating >= 3 ? 'yes' : 'no',
                    },
                  },
                })),
                theme.colors.primary.main
              )}
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Did {diner.name.split(' ')[0]} feel like a good fit for the group overall?</Text>
              {renderStarRating(
                surveyData.dinerConnections[diner.id]?.fitForGroup || 0,
                (rating) => setSurveyData(prev => ({
                  ...prev,
                  dinerConnections: {
                    ...prev.dinerConnections,
                    [diner.id]: {
                      ...prev.dinerConnections[diner.id],
                      fitForGroup: rating,
                    },
                  },
                })),
                theme.colors.primary.main
              )}
            </View>

            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Would you want to dine with {diner.name.split(' ')[0]} again? *</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.choiceButton,
                    styles.yesButton,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'yes' && styles.selectedButton
                  ]}
                  onPress={() => setSurveyData(prev => ({
                    ...prev,
                    dinerConnections: {
                      ...prev.dinerConnections,
                      [diner.id]: {
                        ...prev.dinerConnections[diner.id],
                        dineAgain: 'yes',
                      },
                    },
                  }))}
                >
                  <Text style={[
                    styles.choiceButtonText,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'yes' && styles.selectedButtonText
                  ]}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.choiceButton,
                    styles.maybeButton,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'maybe' && styles.selectedButton
                  ]}
                  onPress={() => setSurveyData(prev => ({
                    ...prev,
                    dinerConnections: {
                      ...prev.dinerConnections,
                      [diner.id]: {
                        ...prev.dinerConnections[diner.id],
                        dineAgain: 'maybe',
                      },
                    },
                  }))}
                >
                  <Text style={[
                    styles.choiceButtonText,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'maybe' && styles.selectedButtonText
                  ]}>MAYBE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.choiceButton,
                    styles.noButton,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'no' && styles.selectedButton
                  ]}
                  onPress={() => setSurveyData(prev => ({
                    ...prev,
                    dinerConnections: {
                      ...prev.dinerConnections,
                      [diner.id]: {
                        ...prev.dinerConnections[diner.id],
                        dineAgain: 'no',
                      },
                    },
                  }))}
                >
                  <Text style={[
                    styles.choiceButtonText,
                    surveyData.dinerConnections[diner.id]?.dineAgain === 'no' && styles.selectedButtonText
                  ]}>NO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderPage3 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>How was your dinner? 😊</Text>
      <Text style={styles.pageSubtitle}>
        Your feedback helps us create even better matches and more memorable connections.
      </Text>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>How enjoyable was your dinner group? *</Text>
        {renderStarRating(
          surveyData.groupEnjoymentRating,
          (rating) => setSurveyData(prev => ({ ...prev, groupEnjoymentRating: rating })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>
          Did you feel a good match with your dining partner(s)? *
        </Text>
        {renderStarRating(
          surveyData.groupMatchRating,
          (rating) => setSurveyData(prev => ({ ...prev, groupMatchRating: rating })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Did the conversation feel engaging? *</Text>
        {renderStarRating(
          surveyData.conversationRating,
          (rating) => setSurveyData(prev => ({ ...prev, conversationRating: rating })),
          theme.colors.primary.main
        )}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Would you want to dine with them again? *</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.yesButton,
              surveyData.dineAgain === 'yes' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, dineAgain: 'yes' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.dineAgain === 'yes' && styles.selectedButtonText
            ]}>YES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.maybeButton,
              surveyData.dineAgain === 'maybe' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, dineAgain: 'maybe' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.dineAgain === 'maybe' && styles.selectedButtonText
            ]}>MAYBE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.noButton,
              surveyData.dineAgain === 'no' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, dineAgain: 'no' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.dineAgain === 'no' && styles.selectedButtonText
            ]}>NO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>
          Did you feel a good match with your dining group/partner? *
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.yesButton,
              surveyData.groupMatch === 'yes' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, groupMatch: 'yes' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.groupMatch === 'yes' && styles.selectedButtonText
            ]}>YES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.noButton,
              surveyData.groupMatch === 'no' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, groupMatch: 'no' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.groupMatch === 'no' && styles.selectedButtonText
            ]}>NO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              styles.somewhatButton,
              surveyData.groupMatch === 'somewhat' && styles.selectedButton
            ]}
            onPress={() => setSurveyData(prev => ({ ...prev, groupMatch: 'somewhat' }))}
          >
            <Text style={[
              styles.choiceButtonText,
              surveyData.groupMatch === 'somewhat' && styles.selectedButtonText
            ]}>SOMEWHAT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );


  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return renderPage1();
      case 2:
        return renderPage2();
      case 3:
        return renderPage3();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Dinner Survey</Text>
        <View style={styles.headerRight} />
      </View>

      {renderProgressBar()}

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderCurrentPage()}
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {currentPage < totalPages ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleNext}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  backButton: {
    width: scaleWidth(40),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: scaleWidth(40),
  },
  progressBarContainer: {
    height: scaleHeight(4),
    backgroundColor: theme.colors.ui?.paleGray || '#F3F4F6',
    marginHorizontal: scaleWidth(20),
    borderRadius: scaleWidth(2),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
  },
  content: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(20),
  },
  pageTitle: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
  },
  pageSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(24),
    lineHeight: scaleFont(20),
  },
  questionSection: {
    marginBottom: scaleHeight(24),
  },
  questionText: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(12),
    fontWeight: '500',
  },
  starContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  optionButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    marginBottom: scaleHeight(8),
    backgroundColor: theme.colors.ui?.paleGray || '#F3F4F6',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary.main,
  },
  optionButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    color: theme.colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: theme.colors.white,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  choiceButton: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: theme.colors.ui?.borderLight || '#E5E7EB',
  },
  yesButton: {
    borderColor: theme.colors.primary.main,
  },
  maybeButton: {
    borderColor: theme.colors.primary.main,
  },
  noButton: {
    borderColor: theme.colors.primary.main,
  },
  somewhatButton: {
    borderColor: theme.colors.primary.main,
  },
  selectedButton: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  choiceButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  selectedButtonText: {
    color: theme.colors.white,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.ui?.borderLight || '#E5E7EB',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    minHeight: scaleHeight(100),
    textAlignVertical: 'top',
  },
  dinerCard: {
    backgroundColor: theme.colors.ui?.offWhite || '#F9FAFB',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(20),
  },
  dinerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  dinerAvatar: {
    marginRight: scaleWidth(12),
  },
  dinerInfo: {
    flex: 1,
  },
  dinerLabel: {
    fontSize: scaleFont(10),
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  dinerName: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginVertical: scaleHeight(2),
  },
  dinerSubtext: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  footer: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui?.paleGray || '#F3F4F6',
  },
  submitButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restaurantName: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
});

export default PostDinnerSurveyScreen;