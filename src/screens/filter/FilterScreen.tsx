import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

interface FilterScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  onApply?: (filters: any) => void;
}

type AtmosphereTag = 'CASUAL' | 'FORMAL' | 'COZY' | 'LIVELY' | 'RUSTIC' | 'QUIET/INTIMATE' | 'MODERN/CHIC';
type CuisineType = 'Italian' | 'Japanese' | 'Mexican' | 'Chinese' | 'Indian' | 'Thai' | 'French' | 'Mediterranean' | 'American' | 'Korean';
type PriceRange = '$' | '$$' | '$$$' | '$$$$';
type DrinkPreference = 'Wine' | 'Cocktails' | 'Beer' | 'Non-Alcoholic' | 'Sake' | 'Spirits';

interface FilterSection {
  id: string;
  title: string;
  hasCount?: boolean;
  count?: number;
  isExpanded?: boolean;
}

const atmosphereTags: AtmosphereTag[] = [
  'CASUAL',
  'FORMAL',
  'COZY',
  'LIVELY',
  'RUSTIC',
  'QUIET/INTIMATE',
  'MODERN/CHIC',
];

const cuisineTypes: CuisineType[] = [
  'Italian',
  'Japanese',
  'Mexican',
  'Chinese',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'American',
  'Korean',
];

const priceRanges: { value: PriceRange; label: string }[] = [
  { value: '$', label: '$ (Under $30)' },
  { value: '$$', label: '$$ ($30-$60)' },
  { value: '$$$', label: '$$$ ($60-$100)' },
  { value: '$$$$', label: '$$$$ ($100+)' },
];

const drinkPreferences: DrinkPreference[] = [
  'Wine',
  'Cocktails',
  'Beer',
  'Non-Alcoholic',
  'Sake',
  'Spirits',
];

export const FilterScreen: React.FC<FilterScreenProps> = ({ onNavigate, onApply }) => {
  const insets = useSafeAreaInsets();
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<AtmosphereTag[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRange[]>([]);
  const [selectedDrinks, setSelectedDrinks] = useState<DrinkPreference[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cuisine: false,
    priceRange: false,
    atmosphere: true,
    drinkPreference: false,
    additional: false,
  });

  const handleCancel = () => {
    onNavigate?.('profile');
  };

  const handleClearAll = () => {
    setSelectedAtmosphere([]);
    setSelectedCuisines([]);
    setSelectedPriceRanges([]);
    setSelectedDrinks([]);
    setAdditionalNotes('');
  };

  const handleApply = () => {
    const filters = {
      atmosphere: selectedAtmosphere,
      cuisines: selectedCuisines,
      priceRanges: selectedPriceRanges,
      drinks: selectedDrinks,
      additionalNotes,
    };
    onApply?.(filters);
    onNavigate?.('profile');
  };

  const toggleAtmosphere = (tag: AtmosphereTag) => {
    setSelectedAtmosphere(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const togglePriceRange = (price: PriceRange) => {
    setSelectedPriceRanges(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

  const toggleDrink = (drink: DrinkPreference) => {
    setSelectedDrinks(prev => 
      prev.includes(drink) 
        ? prev.filter(d => d !== drink)
        : [...prev, drink]
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const renderFilterSection = (
    id: string,
    title: string,
    count?: number,
    children?: React.ReactNode
  ) => {
    const isExpanded = expandedSections[id];
    
    return (
      <View key={id} style={styles.filterSection}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection(id)}
        >
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {count !== undefined && count > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.text.secondary}
          />
        </Pressable>
        {isExpanded && children}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + scaleHeight(16) }]}>
        <Pressable onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Filter</Text>
        <Pressable onPress={handleClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Refine Your Experience Section */}
        <View style={styles.refineSection}>
          <Text style={styles.refineTitle}>Refine Your Experience</Text>
          <Text style={styles.refineDescription}>
            Before every dinner, you choose the vibe: update your taste, your type, or both.
          </Text>
        </View>

        {/* Filter Sections */}
        {renderFilterSection('cuisine', 'Cuisine', selectedCuisines.length, (
          <View style={styles.tagsContainer}>
            {cuisineTypes.map((cuisine) => (
              <Pressable
                key={cuisine}
                style={[
                  styles.tag,
                  selectedCuisines.includes(cuisine) && styles.tagSelected,
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={[
                  styles.tagText,
                  selectedCuisines.includes(cuisine) && styles.tagTextSelected,
                ]}>
                  {cuisine}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
        
        {renderFilterSection('priceRange', 'Price Range', selectedPriceRanges.length, (
          <View style={styles.optionsContainer}>
            {priceRanges.map((range) => (
              <Pressable
                key={range.value}
                style={styles.optionItem}
                onPress={() => togglePriceRange(range.value)}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>{range.label}</Text>
                  <View style={[
                    styles.checkbox,
                    selectedPriceRanges.includes(range.value) && styles.checkboxSelected,
                  ]}>
                    {selectedPriceRanges.includes(range.value) && (
                      <Icon name="check" size={14} color={theme.colors.white} />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
        
        {renderFilterSection('atmosphere', 'Atmosphere', selectedAtmosphere.length, (
          <View style={styles.tagsContainer}>
            {atmosphereTags.map((tag) => (
              <Pressable
                key={tag}
                style={[
                  styles.tag,
                  selectedAtmosphere.includes(tag) && styles.tagSelected,
                ]}
                onPress={() => toggleAtmosphere(tag)}
              >
                <Text style={[
                  styles.tagText,
                  selectedAtmosphere.includes(tag) && styles.tagTextSelected,
                ]}>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
        
        {renderFilterSection('drinkPreference', 'Drink preference', selectedDrinks.length, (
          <View style={styles.tagsContainer}>
            {drinkPreferences.map((drink) => (
              <Pressable
                key={drink}
                style={[
                  styles.tag,
                  selectedDrinks.includes(drink) && styles.tagSelected,
                ]}
                onPress={() => toggleDrink(drink)}
              >
                <Text style={[
                  styles.tagText,
                  selectedDrinks.includes(drink) && styles.tagTextSelected,
                ]}>
                  {drink}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
        
        {renderFilterSection('additional', "Anything you'd like us to keep in mind?", undefined, (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., allergies, dietary restrictions, special occasions..."
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
            />
          </View>
        ))}

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.applyButtonPressed,
          ]}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
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
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelText: {
    fontSize: scaleFont(16),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  clearText: {
    fontSize: scaleFont(16),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  scrollView: {
    flex: 1,
  },
  refineSection: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  refineTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(8),
  },
  refineDescription: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  countBadge: {
    marginLeft: scaleWidth(12),
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    minWidth: scaleWidth(24),
    alignItems: 'center',
  },
  countText: {
    fontSize: scaleFont(12),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
    gap: scaleWidth(8),
  },
  tag: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(8),
  },
  tagSelected: {
    backgroundColor: '#FFE4E4',
    borderColor: theme.colors.primary.main,
  },
  tagText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  tagTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  applyButtonContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  applyButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(27),
    alignItems: 'center',
  },
  applyButtonPressed: {
    opacity: 0.8,
  },
  applyButtonText: {
    fontSize: scaleFont(16),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  optionsContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
  },
  optionItem: {
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    flex: 1,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  textInputContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    minHeight: scaleHeight(80),
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    textAlignVertical: 'top',
  },
});