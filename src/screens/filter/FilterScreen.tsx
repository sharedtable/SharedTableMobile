import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface FilterData {
  atmosphere: AtmosphereTag[];
  cuisines: CuisineType[];
  priceRanges: PriceRange[];
  drinks: DrinkPreference[];
  additionalNotes: string;
}

interface FilterScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
  onApply?: (filters: FilterData) => void;
}

type AtmosphereTag =
  | 'CASUAL'
  | 'FORMAL'
  | 'COZY'
  | 'LIVELY'
  | 'RUSTIC'
  | 'QUIET/INTIMATE'
  | 'MODERN/CHIC';
type CuisineType =
  | 'Italian'
  | 'Japanese'
  | 'Mexican'
  | 'Chinese'
  | 'Indian'
  | 'Thai'
  | 'French'
  | 'Mediterranean'
  | 'American'
  | 'Korean';
type PriceRange = '$' | '$$' | '$$$' | '$$$$';
type DrinkPreference = 'Wine' | 'Cocktails' | 'Beer' | 'Non-Alcoholic' | 'Sake' | 'Spirits';

// interface FilterSection {
//   id: string;
//   title: string;
//   hasCount?: boolean;
//   count?: number;
//   isExpanded?: boolean;
// }

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
    setSelectedAtmosphere((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const togglePriceRange = (price: PriceRange) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const toggleDrink = (drink: DrinkPreference) => {
    setSelectedDrinks((prev) =>
      prev.includes(drink) ? prev.filter((d) => d !== drink) : [...prev, drink]
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
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
        <Pressable style={styles.sectionHeader} onPress={() => toggleSection(id)}>
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
        {renderFilterSection(
          'cuisine',
          'Cuisine',
          selectedCuisines.length,
          <View style={styles.tagsContainer}>
            {cuisineTypes.map((cuisine) => (
              <Pressable
                key={cuisine}
                style={[styles.tag, selectedCuisines.includes(cuisine) && styles.tagSelected]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedCuisines.includes(cuisine) && styles.tagTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {renderFilterSection(
          'priceRange',
          'Price Range',
          selectedPriceRanges.length,
          <View style={styles.optionsContainer}>
            {priceRanges.map((range) => (
              <Pressable
                key={range.value}
                style={styles.optionItem}
                onPress={() => togglePriceRange(range.value)}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>{range.label}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      selectedPriceRanges.includes(range.value) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedPriceRanges.includes(range.value) && (
                      <Icon name="check" size={14} color={theme.colors.white} />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {renderFilterSection(
          'atmosphere',
          'Atmosphere',
          selectedAtmosphere.length,
          <View style={styles.tagsContainer}>
            {atmosphereTags.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.tag, selectedAtmosphere.includes(tag) && styles.tagSelected]}
                onPress={() => toggleAtmosphere(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedAtmosphere.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {renderFilterSection(
          'drinkPreference',
          'Drink preference',
          selectedDrinks.length,
          <View style={styles.tagsContainer}>
            {drinkPreferences.map((drink) => (
              <Pressable
                key={drink}
                style={[styles.tag, selectedDrinks.includes(drink) && styles.tagSelected]}
                onPress={() => toggleDrink(drink)}
              >
                <Text
                  style={[styles.tagText, selectedDrinks.includes(drink) && styles.tagTextSelected]}
                >
                  {drink}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {renderFilterSection(
          'additional',
          "Anything you'd like us to keep in mind?",
          undefined,
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
        )}

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyButtonContainer}>
        <Pressable
          style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    paddingVertical: scaleHeight(16),
  },
  applyButtonContainer: {
    backgroundColor: theme.colors.white,
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  applyButtonPressed: {
    opacity: 0.8,
  },
  applyButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  cancelText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    height: scaleWidth(20),
    justifyContent: 'center',
    width: scaleWidth(20),
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  clearText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    marginLeft: scaleWidth(12),
    minWidth: scaleWidth(24),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
  },
  countText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  filterSection: {
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  optionItem: {
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    paddingVertical: scaleHeight(12),
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  optionsContainer: {
    paddingBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  refineDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
  refineSection: {
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
  },
  refineTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    marginBottom: scaleHeight(8),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
  },
  tagSelected: {
    backgroundColor: '#FFE4E4',
    borderColor: theme.colors.primary.main,
  },
  tagText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  tagTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
    paddingBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  textInput: {
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    minHeight: scaleHeight(80),
    padding: scaleWidth(12),
    textAlignVertical: 'top',
  },
  textInputContainer: {
    paddingBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
});
