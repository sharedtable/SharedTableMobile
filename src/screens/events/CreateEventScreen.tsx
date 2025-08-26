import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';

interface EventFormData {
  title: string;
  description: string;
  cuisine_type: string;
  dining_style: string;
  restaurant_name: string;
  address: string;
  city: string;
  event_date: Date;
  start_time: Date;
  end_time: Date;
  min_guests: number;
  max_guests: number;
  price_per_person: string;
  price_includes: string;
  payment_method: string;
  dietary_accommodations: string[];
  age_restriction: string;
  dress_code: string;
  languages_spoken: string[];
  cover_image: string | null;
  tags: string[];
  visibility: 'public' | 'friends_only' | 'invite_only';
}

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    cuisine_type: '',
    dining_style: 'Group Dining',
    restaurant_name: '',
    address: '',
    city: '',
    event_date: new Date(),
    start_time: new Date(),
    end_time: new Date(),
    min_guests: 2,
    max_guests: 6,
    price_per_person: '',
    price_includes: '',
    payment_method: 'split_bill',
    dietary_accommodations: [],
    age_restriction: 'all_ages',
    dress_code: 'casual',
    languages_spoken: ['English'],
    cover_image: null,
    tags: [],
    visibility: 'public',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const cuisineTypes = [
    'American', 'Chinese', 'Italian', 'Japanese', 'Mexican', 
    'Thai', 'Indian', 'Korean', 'Mediterranean', 'French', 'Other'
  ];

  const diningStyles = [
    'Group Dining', 'Family Style', 'Fine Dining', 'Casual Dining',
    'Potluck', 'Cooking Class', 'Food Tour', 'Wine Tasting'
  ];

  const paymentMethods = [
    { value: 'split_bill', label: 'Split Bill at Restaurant' },
    { value: 'host_pays', label: 'Host Pays' },
    { value: 'prepaid', label: 'Prepaid via App' },
    { value: 'venmo_later', label: 'Venmo/PayPal Later' },
  ];

  const dietaryOptions = [
    'Vegetarian Options', 'Vegan Options', 'Gluten-Free Options',
    'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free'
  ];

  const updateFormData = (key: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleDietaryOption = (option: string) => {
    const current = formData.dietary_accommodations;
    if (current.includes(option)) {
      updateFormData('dietary_accommodations', current.filter(d => d !== option));
    } else {
      updateFormData('dietary_accommodations', [...current, option]);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData('cover_image', result.assets[0].uri);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title || !formData.description || !formData.cuisine_type) {
          Alert.alert('Missing Information', 'Please fill in all required fields.');
          return false;
        }
        break;
      case 2:
        if (!formData.restaurant_name || !formData.address || !formData.city) {
          Alert.alert('Missing Information', 'Please provide restaurant details.');
          return false;
        }
        break;
      case 3:
        if (!formData.price_per_person || formData.max_guests < formData.min_guests) {
          Alert.alert('Invalid Information', 'Please check pricing and guest limits.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreate = async () => {
    if (!validateStep(currentStep)) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setCreating(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        cuisine_type: formData.cuisine_type,
        dining_style: formData.dining_style,
        restaurant_name: formData.restaurant_name,
        address: formData.address,
        city: formData.city,
        event_date: format(formData.event_date, 'yyyy-MM-dd'),
        start_time: format(formData.start_time, 'HH:mm:ss'),
        end_time: format(formData.end_time, 'HH:mm:ss'),
        min_guests: formData.min_guests,
        max_guests: formData.max_guests,
        price_per_person: parseFloat(formData.price_per_person),
        price_includes: formData.price_includes,
        payment_method: formData.payment_method,
        dietary_accommodations: formData.dietary_accommodations,
        age_restriction: formData.age_restriction,
        dress_code: formData.dress_code,
        languages_spoken: formData.languages_spoken,
        cover_image: formData.cover_image || undefined,
        tags: formData.tags,
        visibility: formData.visibility,
      };

      const response = await api.createEvent(eventData);
      
      if (response.success && response.data) {
        Alert.alert(
          'Event Created!',
          'Your dining event has been published and is now visible to others.',
          [
            {
              text: 'View Event',
              onPress: () => {
                navigation.goBack();
                // Navigate to the created event
                // navigation.navigate('EventDetails', { eventId: response.data.id });
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create event');
      }
    } catch {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Authentic Sichuan Dinner"
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your event, what to expect, and what makes it special..."
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{formData.description.length}/500</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cuisine Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {cuisineTypes.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.chip,
                  formData.cuisine_type === cuisine && styles.chipSelected
                ]}
                onPress={() => updateFormData('cuisine_type', cuisine)}
              >
                <Text style={[
                  styles.chipText,
                  formData.cuisine_type === cuisine && styles.chipTextSelected
                ]}>
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dining Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {diningStyles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.chip,
                  formData.dining_style === style && styles.chipSelected
                ]}
                onPress={() => updateFormData('dining_style', style)}
              >
                <Text style={[
                  styles.chipText,
                  formData.dining_style === style && styles.chipTextSelected
                ]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity style={styles.imageUpload} onPress={handlePickImage}>
          {formData.cover_image ? (
            <Image source={{ uri: formData.cover_image }} style={styles.uploadedImage} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              <Text style={styles.uploadText}>Tap to add photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location & Time</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Chengdu Taste"
          value={formData.restaurant_name}
          onChangeText={(text) => updateFormData('restaurant_name', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Full street address"
          value={formData.address}
          onChangeText={(text) => updateFormData('address', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Los Angeles"
          value={formData.city}
          onChangeText={(text) => updateFormData('city', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Date *</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#6B7280" />
          <Text style={styles.dateText}>
            {format(formData.event_date, 'EEEE, MMMM d, yyyy')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Start Time *</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.dateText}>
              {format(formData.start_time, 'h:mm a')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: scaleWidth(12) }]}>
          <Text style={styles.label}>End Time</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Ionicons name="time" size={20} color="#6B7280" />
            <Text style={styles.dateText}>
              {format(formData.end_time, 'h:mm a')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.event_date}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) updateFormData('event_date', date);
          }}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={formData.start_time}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowStartTimePicker(false);
            if (date) updateFormData('start_time', date);
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={formData.end_time}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) updateFormData('end_time', date);
          }}
        />
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pricing & Capacity</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Min Guests</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => updateFormData('min_guests', Math.max(1, formData.min_guests - 1))}
            >
              <Ionicons name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{formData.min_guests}</Text>
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => updateFormData('min_guests', formData.min_guests + 1)}
            >
              <Ionicons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: scaleWidth(12) }]}>
          <Text style={styles.label}>Max Guests *</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => updateFormData('max_guests', Math.max(formData.min_guests, formData.max_guests - 1))}
            >
              <Ionicons name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{formData.max_guests}</Text>
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => updateFormData('max_guests', formData.max_guests + 1)}
            >
              <Ionicons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price per Person *</Text>
        <View style={styles.priceInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.priceField}
            placeholder="0.00"
            value={formData.price_per_person}
            onChangeText={(text) => updateFormData('price_per_person', text)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>What's Included in Price</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Appetizers, main course, dessert, tea"
          value={formData.price_includes}
          onChangeText={(text) => updateFormData('price_includes', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={styles.radioOption}
            onPress={() => updateFormData('payment_method', method.value)}
          >
            <View style={styles.radio}>
              {formData.payment_method === method.value && (
                <View style={styles.radioSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>{method.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dietary Accommodations</Text>
        <View style={styles.checkboxContainer}>
          {dietaryOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.checkboxOption}
              onPress={() => toggleDietaryOption(option)}
            >
              <View style={styles.checkbox}>
                {formData.dietary_accommodations.includes(option) && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.primary.main} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age Restriction</Text>
        <View style={styles.segmentedControl}>
          {['all_ages', '18+', '21+'].map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.segment,
                formData.age_restriction === age && styles.segmentSelected
              ]}
              onPress={() => updateFormData('age_restriction', age)}
            >
              <Text style={[
                styles.segmentText,
                formData.age_restriction === age && styles.segmentTextSelected
              ]}>
                {age === 'all_ages' ? 'All Ages' : age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dress Code</Text>
        <View style={styles.segmentedControl}>
          {['casual', 'business_casual', 'formal'].map((dress) => (
            <TouchableOpacity
              key={dress}
              style={[
                styles.segment,
                formData.dress_code === dress && styles.segmentSelected
              ]}
              onPress={() => updateFormData('dress_code', dress)}
            >
              <Text style={[
                styles.segmentText,
                formData.dress_code === dress && styles.segmentTextSelected
              ]}>
                {dress.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Visibility</Text>
        <View style={styles.visibilityOption}>
          <View>
            <Text style={styles.visibilityTitle}>Public</Text>
            <Text style={styles.visibilityDesc}>Anyone can see and join</Text>
          </View>
          <Switch
            value={formData.visibility === 'public'}
            onValueChange={(value) => updateFormData('visibility', value ? 'public' : 'friends_only')}
            trackColor={{ false: '#D1D5DB', true: theme.colors.primary.light }}
            thumbColor={formData.visibility === 'public' ? theme.colors.primary.main : '#9CA3AF'}
          />
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(currentStep / totalSteps) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.createButton, creating && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.createButtonText}>
                {creating ? 'Creating...' : 'Create Event'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: scaleFont(14),
    color: '#EF4444',
  },
  progressContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  progressBar: {
    height: scaleHeight(4),
    backgroundColor: '#E5E7EB',
    borderRadius: scaleWidth(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
  },
  progressText: {
    fontSize: scaleFont(12),
    color: '#6B7280',
    marginTop: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleWidth(20),
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: scaleHeight(20),
  },
  inputGroup: {
    marginBottom: scaleHeight(20),
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#374151',
    marginBottom: scaleHeight(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFont(14),
    color: '#111827',
  },
  textArea: {
    minHeight: scaleHeight(100),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: scaleFont(11),
    color: '#9CA3AF',
    marginTop: scaleHeight(4),
    textAlign: 'right',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  chip: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  chipText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
  },
  chipTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  imageUpload: {
    height: scaleHeight(150),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(10),
  },
  uploadText: {
    fontSize: scaleFont(14),
    color: '#9CA3AF',
    marginTop: scaleHeight(8),
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
  },
  dateText: {
    fontSize: scaleFont(14),
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(8),
  },
  numberButton: {
    padding: scaleWidth(8),
  },
  numberValue: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: scaleWidth(16),
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
  },
  currencySymbol: {
    fontSize: scaleFont(16),
    color: '#6B7280',
    marginRight: scaleWidth(4),
  },
  priceField: {
    flex: 1,
    fontSize: scaleFont(16),
    color: '#111827',
    paddingVertical: scaleHeight(12),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
  },
  radio: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: theme.colors.primary.main,
  },
  radioLabel: {
    fontSize: scaleFont(14),
    color: '#374151',
  },
  checkboxContainer: {
    gap: scaleHeight(8),
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(6),
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: scaleFont(14),
    color: '#374151',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    alignItems: 'center',
    backgroundColor: 'white',
  },
  segmentSelected: {
    backgroundColor: theme.colors.primary.light,
  },
  segmentText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
  },
  segmentTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  visibilityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
  },
  visibilityTitle: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#111827',
  },
  visibilityDesc: {
    fontSize: scaleFont(12),
    color: '#6B7280',
    marginTop: scaleHeight(2),
  },
  bottomActions: {
    padding: scaleWidth(20),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: 'white',
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CreateEventScreen;