import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { mapAreas, mapAreaLabels, MapAreaName } from '@/assets';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface MapAreaSelectorProps {
  selectedArea?: MapAreaName;
  onSelectArea: (area: MapAreaName) => void;
  title?: string;
}

export const MapAreaSelector: React.FC<MapAreaSelectorProps> = ({
  selectedArea,
  onSelectArea,
  title = 'Select Your Area',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.grid}>
        {(Object.keys(mapAreas) as MapAreaName[]).map((area) => (
          <TouchableOpacity
            key={area}
            style={[
              styles.areaCard,
              selectedArea === area && styles.selectedCard,
            ]}
            onPress={() => onSelectArea(area)}
            activeOpacity={0.7}
          >
            <Image
              source={mapAreas[area]}
              style={[
                styles.areaImage,
                selectedArea === area && styles.selectedImage,
              ]}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.areaLabel,
                selectedArea === area && styles.selectedLabel,
              ]}
            >
              {mapAreaLabels[area]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scaleWidth(16),
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(16),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.ui?.paleGray || '#F3F4F6',
  },
  selectedCard: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.light,
  },
  areaImage: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    marginBottom: scaleHeight(8),
    tintColor: theme.colors.primary.main,
  },
  selectedImage: {
    tintColor: theme.colors.white,
  },
  areaLabel: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});