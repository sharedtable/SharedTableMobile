import React, { memo, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { Icon } from './Icon';
import { theme, designTokens } from '@/theme';
import * as Haptics from 'expo-haptics';

interface DropdownOption {
  label: string;
  value: string | number;
  icon?: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Dropdown = memo<DropdownProps>(({
  options,
  value,
  onSelect,
  placeholder = 'Select an option',
  label,
  disabled = false,
  error,
  fullWidth = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const dropdownRef = useRef<View>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handlePress = () => {
    if (disabled) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    dropdownRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownLayout({ x: pageX, y: pageY, width, height });
      setIsOpen(true);
    });
  };

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    
    onSelect(option.value);
    setIsOpen(false);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable
        ref={dropdownRef}
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.dropdown,
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          disabled && styles.disabled,
          error && styles.error,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <Text
          style={[
            styles.text,
            !selectedOption && styles.placeholder,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={disabled ? theme.colors.gray['2'] : theme.colors.gray['4']}
        />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.menu,
              {
                top: dropdownLayout.y + dropdownLayout.height + 4,
                left: dropdownLayout.x,
                width: dropdownLayout.width,
              },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  disabled={item.disabled}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                    item.disabled && styles.optionDisabled,
                    item.value === value && styles.optionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.disabled && styles.optionTextDisabled,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Icon name="check" size={16} color={theme.colors.brand.primary} />
                  )}
                </Pressable>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

Dropdown.displayName = 'Dropdown';

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  dropdown: {
    height: 48,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray['1'],
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    backgroundColor: theme.colors.gray['1'],
    opacity: 0.9,
  },
  disabled: {
    backgroundColor: theme.colors.gray['1'],
    opacity: 0.6,
  },
  error: {
    borderColor: theme.colors.error.main,
  },
  text: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  placeholder: {
    color: theme.colors.gray['3'],
  },
  disabledText: {
    color: theme.colors.gray['2'],
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error.main,
    marginTop: theme.spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    maxHeight: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  list: {
    borderRadius: theme.borderRadius.md,
  },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  optionPressed: {
    backgroundColor: theme.colors.gray['1'],
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionSelected: {
    backgroundColor: `${theme.colors.brand.primary}10`,
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  optionTextDisabled: {
    color: theme.colors.gray['2'],
  },
  optionTextSelected: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});