import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type PostType = 'text' | 'image' | 'recipe' | 'event' | 'poll' | 'review';

interface RecipeData {
  title: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  steps: string[];
}

interface EventData {
  title: string;
  date: Date;
  time: Date;
  location: string;
  spots: string;
  price: string;
  description: string;
}

interface PollData {
  question: string;
  options: string[];
  duration: number; // in days
}

interface ReviewData {
  restaurant: string;
  rating: number;
  cuisine: string;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  dishes: string;
  review: string;
}

const EnhancedCreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [_showLocationPicker, _setShowLocationPicker] = useState(false);
  
  // Recipe state
  const [recipe, setRecipe] = useState<RecipeData>({
    title: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: 'medium',
    ingredients: [''],
    steps: [''],
  });
  
  // Event state
  const [event, setEvent] = useState<EventData>({
    title: '',
    date: new Date(),
    time: new Date(),
    location: '',
    spots: '',
    price: '',
    description: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Poll state
  const [poll, setPoll] = useState<PollData>({
    question: '',
    options: ['', ''],
    duration: 1,
  });
  
  // Review state
  const [review, setReview] = useState<ReviewData>({
    restaurant: '',
    rating: 0,
    cuisine: '',
    price_range: '$$',
    dishes: '',
    review: '',
  });

  const _contentScale = useSharedValue(1);

  const POST_TYPES = [
    { id: 'text', label: 'Post', icon: 'create-outline', color: theme.colors.ios.blue },
    { id: 'image', label: 'Photo', icon: 'camera-outline', color: '#FF9500' },
    { id: 'recipe', label: 'Recipe', icon: 'restaurant-outline', color: '#FF2D55' },
    { id: 'event', label: 'Event', icon: 'calendar-outline', color: '#5856D6' },
    { id: 'poll', label: 'Poll', icon: 'stats-chart-outline', color: '#34C759' },
    { id: 'review', label: 'Review', icon: 'star-outline', color: '#FFCC00' },
  ];

  const pickImages = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant photo library permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages(result.assets.map(asset => asset.uri));
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant location permissions.');
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });

    if (address[0]) {
      setLocation({
        name: address[0].name || address[0].city || 'Current Location',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
  }, []);

  const handlePost = useCallback(async () => {
    // Validate based on post type
    switch (postType) {
      case 'text':
        if (!content.trim() && selectedImages.length === 0) {
          Alert.alert('Error', 'Please add some content or images');
          return;
        }
        break;
      case 'recipe':
        if (!recipe.title || recipe.ingredients.filter(i => i).length === 0) {
          Alert.alert('Error', 'Please fill in recipe details');
          return;
        }
        break;
      case 'event':
        if (!event.title || !event.location) {
          Alert.alert('Error', 'Please fill in event details');
          return;
        }
        break;
      case 'poll':
        if (!poll.question || poll.options.filter(o => o).length < 2) {
          Alert.alert('Error', 'Please add a question and at least 2 options');
          return;
        }
        break;
      case 'review':
        if (!review.restaurant || review.rating === 0) {
          Alert.alert('Error', 'Please fill in restaurant details and rating');
          return;
        }
        break;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setPosting(true);
    try {
      // TODO: Submit to API based on post type
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  }, [postType, content, selectedImages, recipe, event, poll, review, navigation]);

  const renderPostTypeSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.typeSelector}
      contentContainerStyle={styles.typeSelectorContent}
    >
      {POST_TYPES.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeButton,
            postType === type.id && styles.typeButtonActive,
            { borderColor: postType === type.id ? type.color : '#E5E7EB' }
          ]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setPostType(type.id as PostType);
          }}
        >
          <Ionicons
            name={type.icon as any}
            size={24}
            color={postType === type.id ? type.color : theme.colors.gray['500']}
          />
          <Text style={[
            styles.typeLabel,
            { color: postType === type.id ? type.color : theme.colors.gray['500'] }
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTextPost = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <TextInput
        style={styles.contentInput}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={2000}
      />
    </Animated.View>
  );

  const renderRecipePost = () => (
    <Animated.ScrollView 
      entering={FadeInDown.duration(300)}
      style={styles.recipeContainer}
      showsVerticalScrollIndicator={false}
    >
      <TextInput
        style={styles.input}
        placeholder="Recipe Title"
        value={recipe.title}
        onChangeText={(text) => setRecipe({ ...recipe, title: text })}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Prep Time"
          value={recipe.prep_time}
          onChangeText={(text) => setRecipe({ ...recipe, prep_time: text })}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Cook Time"
          value={recipe.cook_time}
          onChangeText={(text) => setRecipe({ ...recipe, cook_time: text })}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Servings"
          value={recipe.servings}
          onChangeText={(text) => setRecipe({ ...recipe, servings: text })}
          keyboardType="numeric"
        />
        <View style={[styles.input, styles.halfInput]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['easy', 'medium', 'hard'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  recipe.difficulty === level && styles.difficultyButtonActive
                ]}
                onPress={() => setRecipe({ ...recipe, difficulty: level as any })}
              >
                <Text style={[
                  styles.difficultyText,
                  recipe.difficulty === level && styles.difficultyTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Ingredients</Text>
      {recipe.ingredients.map((ingredient, index) => (
        <View key={index} style={styles.listItem}>
          <TextInput
            style={styles.listInput}
            placeholder={`Ingredient ${index + 1}`}
            value={ingredient}
            onChangeText={(text) => {
              const newIngredients = [...recipe.ingredients];
              newIngredients[index] = text;
              setRecipe({ ...recipe, ingredients: newIngredients });
            }}
          />
          {index === recipe.ingredients.length - 1 ? (
            <TouchableOpacity
              onPress={() => setRecipe({ ...recipe, ingredients: [...recipe.ingredients, ''] })}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary.main} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            >
              <Ionicons name="remove-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      <Text style={styles.sectionTitle}>Steps</Text>
      {recipe.steps.map((step, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.stepNumber}>{index + 1}.</Text>
          <TextInput
            style={styles.listInput}
            placeholder="Describe this step..."
            value={step}
            onChangeText={(text) => {
              const newSteps = [...recipe.steps];
              newSteps[index] = text;
              setRecipe({ ...recipe, steps: newSteps });
            }}
            multiline
          />
          {index === recipe.steps.length - 1 ? (
            <TouchableOpacity
              onPress={() => setRecipe({ ...recipe, steps: [...recipe.steps, ''] })}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary.main} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const newSteps = recipe.steps.filter((_, i) => i !== index);
                setRecipe({ ...recipe, steps: newSteps });
              }}
            >
              <Ionicons name="remove-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </Animated.ScrollView>
  );

  const renderEventPost = () => (
    <Animated.ScrollView 
      entering={FadeInDown.duration(300)}
      style={styles.eventContainer}
      showsVerticalScrollIndicator={false}
    >
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={event.title}
        onChangeText={(text) => setEvent({ ...event, title: text })}
      />
      
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={20} color="#6B7280" />
        <Text style={styles.dateText}>
          {format(event.date, 'EEEE, MMMM d, yyyy')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowTimePicker(true)}
      >
        <Ionicons name="time" size={20} color="#6B7280" />
        <Text style={styles.dateText}>
          {format(event.time, 'h:mm a')}
        </Text>
      </TouchableOpacity>
      
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={event.location}
        onChangeText={(text) => setEvent({ ...event, location: text })}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Available Spots"
          value={event.spots}
          onChangeText={(text) => setEvent({ ...event, spots: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Price per Person"
          value={event.price}
          onChangeText={(text) => setEvent({ ...event, price: text })}
          keyboardType="numeric"
        />
      </View>
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Event Description"
        value={event.description}
        onChangeText={(text) => setEvent({ ...event, description: text })}
        multiline
        numberOfLines={4}
      />
      
      {showDatePicker && (
        <DateTimePicker
          value={event.date}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) setEvent({ ...event, date });
          }}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={event.time}
          mode="time"
          display="default"
          onChange={(e, time) => {
            setShowTimePicker(false);
            if (time) setEvent({ ...event, time });
          }}
        />
      )}
    </Animated.ScrollView>
  );

  const renderPollPost = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.pollContainer}>
      <TextInput
        style={styles.input}
        placeholder="Ask a question..."
        value={poll.question}
        onChangeText={(text) => setPoll({ ...poll, question: text })}
      />
      
      {poll.options.map((option, index) => (
        <View key={index} style={styles.pollOption}>
          <TextInput
            style={styles.pollInput}
            placeholder={`Option ${index + 1}`}
            value={option}
            onChangeText={(text) => {
              const newOptions = [...poll.options];
              newOptions[index] = text;
              setPoll({ ...poll, options: newOptions });
            }}
          />
          {index >= 2 && (
            <TouchableOpacity
              onPress={() => {
                const newOptions = poll.options.filter((_, i) => i !== index);
                setPoll({ ...poll, options: newOptions });
              }}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {poll.options.length < 4 && (
        <TouchableOpacity
          style={styles.addOptionButton}
          onPress={() => setPoll({ ...poll, options: [...poll.options, ''] })}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary.main} />
          <Text style={styles.addOptionText}>Add Option</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Poll Duration:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 3, 7].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.durationButton,
                poll.duration === days && styles.durationButtonActive
              ]}
              onPress={() => setPoll({ ...poll, duration: days })}
            >
              <Text style={[
                styles.durationText,
                poll.duration === days && styles.durationTextActive
              ]}>
                {days} {days === 1 ? 'Day' : 'Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderReviewPost = () => (
    <Animated.ScrollView 
      entering={FadeInDown.duration(300)}
      style={styles.reviewContainer}
      showsVerticalScrollIndicator={false}
    >
      <TextInput
        style={styles.input}
        placeholder="Restaurant Name"
        value={review.restaurant}
        onChangeText={(text) => setReview({ ...review, restaurant: text })}
      />
      
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rating:</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setReview({ ...review, rating: star })}
            >
              <Ionicons
                name={star <= review.rating ? 'star' : 'star-outline'}
                size={32}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Cuisine Type"
          value={review.cuisine}
          onChangeText={(text) => setReview({ ...review, cuisine: text })}
        />
        <View style={[styles.halfInput]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['$', '$$', '$$$', '$$$$'].map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.priceButton,
                  review.price_range === price && styles.priceButtonActive
                ]}
                onPress={() => setReview({ ...review, price_range: price as any })}
              >
                <Text style={[
                  styles.priceText,
                  review.price_range === price && styles.priceTextActive
                ]}>
                  {price}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Recommended Dishes (comma separated)"
        value={review.dishes}
        onChangeText={(text) => setReview({ ...review, dishes: text })}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write your review..."
        value={review.review}
        onChangeText={(text) => setReview({ ...review, review: text })}
        multiline
        numberOfLines={6}
      />
    </Animated.ScrollView>
  );

  const renderMediaSection = () => (
    <View style={styles.mediaSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {selectedImages.map((uri, index) => (
          <View key={index} style={styles.imagePreview}>
            <Image source={{ uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => {
                setSelectedImages(selectedImages.filter((_, i) => i !== index));
              }}
            >
              <Ionicons name="close-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
          <Ionicons name="add" size={32} color="#6B7280" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <TouchableOpacity style={styles.toolButton} onPress={pickImages}>
        <Ionicons name="image" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolButton} onPress={getCurrentLocation}>
        <Ionicons name="location" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolButton}>
        <Ionicons name="pricetag" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolButton}>
        <Ionicons name="at" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {renderPostTypeSelector()}
        
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {postType === 'text' && renderTextPost()}
          {postType === 'image' && renderTextPost()}
          {postType === 'recipe' && renderRecipePost()}
          {postType === 'event' && renderEventPost()}
          {postType === 'poll' && renderPollPost()}
          {postType === 'review' && renderReviewPost()}
          
          {(postType === 'text' || postType === 'image') && selectedImages.length > 0 && renderMediaSection()}
          
          {location && (
            <View style={styles.locationTag}>
              <Ionicons name="location" size={16} color={theme.colors.primary.main} />
              <Text style={styles.locationText}>{location.name}</Text>
              <TouchableOpacity onPress={() => setLocation(null)}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          
          {tags.length > 0 && (
            <View style={styles.tags}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => setTags(tags.filter(t => t !== tag))}>
                    <Ionicons name="close" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        {(postType === 'text' || postType === 'image') && renderToolbar()}
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelText: {
    fontSize: scaleFont(16),
    color: theme.colors.gray['500'],
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
  },
  postText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    maxHeight: scaleHeight(80),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeSelectorContent: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(12),
  },
  typeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    minWidth: scaleWidth(80),
  },
  typeButtonActive: {
    backgroundColor: theme.colors.overlay.blue5,
  },
  typeLabel: {
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    padding: scaleWidth(16),
  },
  contentInput: {
    fontSize: scaleFont(16),
    color: theme.colors.gray['900'],
    lineHeight: scaleFont(22),
    minHeight: scaleHeight(120),
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFont(14),
    color: theme.colors.gray['900'],
    marginBottom: scaleHeight(12),
  },
  halfInput: {
    flex: 1,
    marginHorizontal: scaleWidth(4),
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -scaleWidth(4),
  },
  textArea: {
    minHeight: scaleHeight(100),
    textAlignVertical: 'top',
  },
  recipeContainer: {
    flex: 1,
  },
  eventContainer: {
    flex: 1,
  },
  pollContainer: {
    flex: 1,
  },
  reviewContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.gray['900'],
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(8),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  listInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    fontSize: scaleFont(14),
    marginRight: scaleWidth(8),
  },
  stepNumber: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.gray['500'],
    marginRight: scaleWidth(8),
    minWidth: scaleWidth(20),
  },
  difficultyButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(16),
    backgroundColor: theme.colors.gray['100'],
    marginRight: scaleWidth(8),
  },
  difficultyButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  difficultyText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
  },
  difficultyTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(12),
    gap: scaleWidth(8),
  },
  dateText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['900'],
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  pollInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFont(14),
    marginRight: scaleWidth(8),
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
  },
  addOptionText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(16),
  },
  durationLabel: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginRight: scaleWidth(12),
  },
  durationButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(16),
    backgroundColor: theme.colors.gray['100'],
    marginRight: scaleWidth(8),
  },
  durationButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  durationText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
  },
  durationTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  ratingLabel: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginRight: scaleWidth(12),
  },
  stars: {
    flexDirection: 'row',
    gap: scaleWidth(4),
  },
  priceButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(8),
    backgroundColor: theme.colors.gray['100'],
    marginRight: scaleWidth(8),
  },
  priceButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  priceText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    fontWeight: '600',
  },
  priceTextActive: {
    color: theme.colors.primary.main,
  },
  mediaSection: {
    marginVertical: scaleHeight(16),
  },
  imagePreview: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    marginRight: scaleWidth(8),
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(8),
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.overlay.mediumDark,
    borderRadius: scaleWidth(10),
  },
  addImageButton: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: scaleWidth(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray['100'],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(16),
    marginTop: scaleHeight(8),
    gap: scaleWidth(4),
  },
  locationText: {
    fontSize: scaleFont(13),
    color: theme.colors.gray['700'],
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(8),
    gap: scaleWidth(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.lighterGray,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(4),
  },
  tagText: {
    fontSize: scaleFont(13),
    color: theme.colors.primary.main,
  },
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(16),
  },
  toolButton: {
    padding: scaleWidth(8),
  },
});

export default EnhancedCreatePostScreen;