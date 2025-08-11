import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Keyboard } from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface InviteFriendsSectionProps {
  onInvite?: (email: string) => void;
}

export const InviteFriendsSection: React.FC<InviteFriendsSectionProps> = ({
  onInvite,
}) => {
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
      <Text style={styles.helperText}>
        Friends will receive invitations to join your dinner
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: scaleHeight(24),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(16),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: scaleWidth(28),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingLeft: scaleWidth(20),
    paddingRight: scaleWidth(4),
    height: scaleHeight(56),
  },
  input: {
    flex: 1,
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  addButton: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(12),
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: scaleFont(28),
    color: theme.colors.white,
    fontWeight: '400' as any,
  },
  helperText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(4),
  },
});