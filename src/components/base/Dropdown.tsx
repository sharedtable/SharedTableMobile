import * as Haptics from 'expo-haptics';
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

import { Colors } from '@/constants/colors';
import { theme } from '@/theme';

import { Icon } from './Icon';

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

export const Dropdown = memo<DropdownProps>(
  ({
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

    const selectedOption = options.find((opt) => opt.value === value);

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
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
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
  }
);

Dropdown.displayName = 'Dropdown';

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.backgroundOverlay,
    flex: 1,
  },
  disabled: {
    backgroundColor: theme.colors.gray['1'],
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.gray['2'],
  },
  dropdown: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  error: {
    borderColor: theme.colors.error.main,
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  list: {
    borderRadius: theme.borderRadius.md,
  },
  menu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    maxHeight: 240,
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black['1'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionPressed: {
    backgroundColor: theme.colors.gray['1'],
  },
  optionSelected: {
    backgroundColor: `${theme.colors.brand.primary}10`,
  },
  optionText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.fontSize.base,
  },
  optionTextDisabled: {
    color: theme.colors.gray['2'],
  },
  optionTextSelected: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  placeholder: {
    color: theme.colors.gray['3'],
  },
  pressed: {
    backgroundColor: theme.colors.gray['1'],
    opacity: 0.9,
  },
  text: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    marginRight: theme.spacing.sm,
  },
});
