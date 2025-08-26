import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Keyboard } from 'react-native';

import { theme } from '@/theme';
import { Colors } from '@/constants/colors';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface InviteFriendsSectionProps {
  onInvite?: (email: string) => void;
}

export const InviteFriendsSection: React.FC<InviteFriendsSectionProps> = ({ onInvite }) => {
  const [email, setEmail] = useState('');

  const handleInvite = () => {
    if (email.trim()) {
      onInvite?.(email);
      setEmail('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invite Friends</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pair up with Your Friends"
          placeholderTextColor={theme.colors.text.secondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleInvite}
          blurOnSubmit={true}
        />
        <Pressable style={styles.addButton} onPress={handleInvite}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.helperText}>Friends will receive invitations to join your dinner</Text>
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
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(16),
  },
});
