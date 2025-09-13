import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase/client';
import { generateFoodCode } from '@/utils/generateFoodCode';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  invitesUsed: number;
  inviteLimit: number;
  invitesRemaining: number;
  successfulReferrals: number;
}

export const ReferAFriendScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = usePrivyAuth();
  const { userData: _userData } = useUserData();
  
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: '',
    referralLink: '',
    invitesUsed: 0,
    inviteLimit: 5,
    invitesRemaining: 5,
    successfulReferrals: 0,
  });
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [_isGeneratingCode, _setIsGeneratingCode] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Check if user already has a referral code
      let referralCode = '';
      let needsNewCode = false;
      
      // Create referral link
      const _referralLink = `https://getfare.app/join?code=${referralCode}`;
      
      // Fetch existing referral data
      const { data: existingReferral } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('user_id', user!.id)
        .single() as { data: any };
      
      if (existingReferral) {
        referralCode = existingReferral.referral_code;
        
        setReferralData({
          referralCode: existingReferral.referral_code,
          referralLink: `https://getfare.app/join?code=${existingReferral.referral_code}`,
          invitesUsed: existingReferral.invites_used || 0,
          inviteLimit: existingReferral.invite_limit || 5,
          invitesRemaining: (existingReferral.invite_limit || 5) - (existingReferral.invites_used || 0),
          successfulReferrals: existingReferral.successful_referrals || 0,
        });
      } else {
        needsNewCode = true;
      }
      
      // Generate a new food-based code if needed
      if (needsNewCode && user?.id) {
        // Try to generate a unique code
        let attempts = 0;
        let codeGenerated = false;
        let includeNumber = false;
        
        while (!codeGenerated && attempts < 20) {
          // After 5 attempts, start adding numbers for more uniqueness
          includeNumber = attempts >= 5;
          referralCode = generateFoodCode(includeNumber);
          
          // Check if code already exists
          const { data: existing } = await supabase
            .from('user_referrals')
            .select('id')
            .eq('referral_code', referralCode)
            .single();
          
          if (!existing) {
            // Save the new code
            const { error } = await (supabase
              .from('user_referrals') as any)
              .insert({
                user_id: user!.id,
                referral_code: referralCode,
                invite_limit: 5,
              });
            
            if (!error) {
              codeGenerated = true;
              
              setReferralData({
                referralCode,
                referralLink: `https://getfare.app/join?code=${referralCode}`,
                invitesUsed: 0,
                inviteLimit: 5,
                invitesRemaining: 5,
                successfulReferrals: 0,
              });
            }
          }
          
          attempts++;
        }
        
        if (!codeGenerated) {
          // Ultimate fallback: use timestamp-based code
          const timestamp = Date.now().toString(36).toUpperCase();
          referralCode = `TASTY-${timestamp}`;
          
          // Force save this one
          await (supabase
            .from('user_referrals') as any)
            .insert({
              user_id: user!.id,
              referral_code: referralCode,
              invite_limit: 5,
            });
          
          setReferralData({
            referralCode,
            referralLink: `https://getfare.app/join?code=${referralCode}`,
            invitesUsed: 0,
            inviteLimit: 5,
            invitesRemaining: 5,
            successfulReferrals: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (method: 'general' | 'whatsapp' | 'sms' | 'email' | 'copy') => {
    // Check if user has invites remaining
    if (referralData.invitesRemaining <= 0) {
      Alert.alert(
        'No Invites Remaining',
        'You\'ve used all your invites! Request more invites to continue sharing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request More', onPress: () => setShowWaitlistModal(true) }
        ]
      );
      return;
    }
    
    
    const message = `Join me on Fare! 🍽️\n\nConnect with amazing people over great food. Use my code ${referralData.referralCode} to get $10 off your first dinner.\n\n${referralData.referralLink}`;
    
    try {
      switch (method) {
        case 'general':
          await Share.share({
            message,
            title: 'Join Fare - Connect Over Food',
          });
          break;
          
        case 'whatsapp': {
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share via this method.');
          }
          break;
        }
          
        case 'sms': {
          const smsUrl = Platform.OS === 'ios' 
            ? `sms:&body=${encodeURIComponent(message)}`
            : `sms:?body=${encodeURIComponent(message)}`;
          await Linking.openURL(smsUrl);
          break;
        }
          
        case 'email': {
          const subject = 'Join me on Fare - Connect Over Food';
          const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          await Linking.openURL(emailUrl);
          break;
        }
          
        case 'copy':
          Clipboard.setString(referralData.referralLink);
          Alert.alert('Copied!', 'Referral link copied to clipboard');
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Unable to share. Please try again.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleRequestMoreInvites = async () => {
    try {
      const { error } = await (supabase
        .from('invite_requests') as any)
        .insert({
          user_id: user?.id,
        });
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          Alert.alert('Already Requested', 'You already have a pending request for more invites.');
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          'Request Submitted',
          'Your request for more invites has been submitted. We\'ll notify you once approved!'
        );
        setShowWaitlistModal(false);
      }
    } catch (error) {
      console.error('Error requesting invites:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar title="Refer a Friend" showBack onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Refer a Friend" showBack onBack={handleBack} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.giftIcon}>
            <Ionicons name="gift" size={50} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.heroTitle}>Share Fare, Get Rewards</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends and both get $10 off your next dinner
          </Text>
        </View>
        
        {/* Invites Remaining Card */}
        <View style={styles.invitesCard}>
          <View style={styles.invitesHeader}>
            <Text style={styles.invitesTitle}>Invites Available</Text>
            {referralData.invitesRemaining > 0 ? (
              <View style={styles.invitesCountContainer}>
                <Text style={styles.invitesCount}>{referralData.invitesRemaining}</Text>
                <Text style={styles.invitesTotal}>/ {referralData.inviteLimit}</Text>
              </View>
            ) : (
              <View style={styles.noInvitesContainer}>
                <Ionicons name="alert-circle" size={20} color="#FFA500" />
                <Text style={styles.noInvitesText}>No invites left</Text>
              </View>
            )}
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${(referralData.invitesRemaining / referralData.inviteLimit) * 100}%`,
                  backgroundColor: referralData.invitesRemaining > 0 ? theme.colors.primary.main : theme.colors.gray[300]
                }
              ]} 
            />
          </View>
          
          {referralData.invitesRemaining === 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.requestMoreButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => setShowWaitlistModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary.main} />
              <Text style={styles.requestMoreText}>Request More Invites</Text>
            </Pressable>
          )}
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Unique Food Code</Text>
          <View style={styles.codeContainer}>
            <View style={styles.codeEmoji}>
              <Text style={{ fontSize: 24 }}>🍽️</Text>
            </View>
            <Text style={styles.codeText}>{referralData.referralCode}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.copyButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => {
                Clipboard.setString(referralData.referralCode);
                Alert.alert('Copied!', 'Referral code copied to clipboard');
              }}
            >
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary.main} />
            </Pressable>
          </View>
          <Text style={styles.codeHint}>Share this tasty code with friends!</Text>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share Your Link</Text>
          <View style={styles.shareGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleShare('whatsapp')}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="white" />
              </View>
              <Text style={styles.shareButtonText}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleShare('sms')}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#4A90E2' }]}>
                <Ionicons name="chatbubble-outline" size={24} color="white" />
              </View>
              <Text style={styles.shareButtonText}>Message</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleShare('email')}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#EA4335' }]}>
                <Ionicons name="mail-outline" size={24} color="white" />
              </View>
              <Text style={styles.shareButtonText}>Email</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleShare('copy')}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#6C757D' }]}>
                <Ionicons name="link-outline" size={24} color="white" />
              </View>
              <Text style={styles.shareButtonText}>Copy Link</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.shareAllButton,
              pressed && styles.buttonPressed
            ]}
            onPress={() => handleShare('general')}
          >
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.shareAllButtonText}>Share</Text>
          </Pressable>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statNumber}>{referralData.invitesUsed}</Text>
              <Text style={styles.statLabel}>Friends Invited</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statNumber}>{referralData.successfulReferrals}</Text>
              <Text style={styles.statLabel}>Dinners Booked</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share your code</Text>
                <Text style={styles.stepDescription}>
                  Send your unique referral code to friends
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Friend joins Fare</Text>
                <Text style={styles.stepDescription}>
                  They sign up and book their first dinner
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Both get rewards</Text>
                <Text style={styles.stepDescription}>
                  You each receive $10 off your next dinner
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Referral rewards are applied after your friend completes their first dinner. 
            Terms and conditions apply.
          </Text>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
      
      {/* Request More Invites Modal */}
      {showWaitlistModal && (
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setShowWaitlistModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request More Invites</Text>
              <Pressable
                onPress={() => setShowWaitlistModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="people" size={50} color={theme.colors.primary.main} />
              </View>
              
              <Text style={styles.modalDescription}>
                You've used all {referralData.inviteLimit} of your invites! 
                We'd love to help you invite more friends.
              </Text>
              
              <View style={styles.modalInfo}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
                <Text style={styles.modalInfoText}>
                  We'll review your request and notify you once approved. 
                  Priority is given to active members.
                </Text>
              </View>
              
              <Pressable
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleRequestMoreInvites}
              >
                <Text style={styles.modalSubmitText}>Request 5 More Invites</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => setShowWaitlistModal(false)}
              >
                <Text style={styles.modalCancelText}>Maybe Later</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.7,
  },
  invitesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(12),
    padding: scaleWidth(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  invitesCountContainer: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  invitesCount: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(24),
    fontWeight: '700',
  },
  invitesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
  },
  invitesTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  invitesTotal: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
    fontWeight: '500',
    marginLeft: scaleWidth(4),
  },
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalBody: {
    padding: scaleWidth(20),
  },
  modalCancelButton: {
    alignItems: 'center',
    marginTop: scaleHeight(8),
    paddingVertical: scaleHeight(12),
  },
  modalCancelText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
  },
  modalCloseButton: {
    padding: scaleWidth(4),
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(20),
    marginHorizontal: scaleWidth(20),
    maxWidth: scaleWidth(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalDescription: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(24),
    marginVertical: scaleHeight(16),
    textAlign: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scaleWidth(20),
  },
  modalIconContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(232, 93, 93, 0.1)',
    borderRadius: scaleWidth(30),
    height: scaleWidth(100),
    justifyContent: 'center',
    width: scaleWidth(100),
  },
  modalInfo: {
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: scaleWidth(12),
    flexDirection: 'row',
    marginBottom: scaleHeight(20),
    padding: scaleWidth(12),
  },
  modalInfoText: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginLeft: scaleWidth(8),
  },
  modalOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalSubmitButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
  },
  modalSubmitText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(20),
    fontWeight: '600',
  },
  noInvitesContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scaleWidth(4),
  },
  noInvitesText: {
    color: '#FFA500',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  progressBar: {
    borderRadius: scaleWidth(4),
    height: '100%',
  },
  progressBarContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: scaleWidth(4),
    height: scaleHeight(8),
    overflow: 'hidden',
    width: '100%',
  },
  requestMoreButton: {
    alignItems: 'center',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    flexDirection: 'row',
    gap: scaleWidth(8),
    justifyContent: 'center',
    marginTop: scaleHeight(12),
    paddingVertical: scaleHeight(10),
  },
  requestMoreText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  codeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(12),
    padding: scaleWidth(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(16),
    borderStyle: 'dashed',
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaleHeight(12),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    position: 'relative',
  },
  codeEmoji: {
    marginRight: scaleWidth(12),
  },
  codeHint: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(13),
    fontStyle: 'italic',
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  codeLabel: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  codeText: {
    color: theme.colors.primary.main,
    flex: 1,
    fontSize: scaleFont(20),
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#F5F5F5',
    flex: 1,
  },
  copyButton: {
    padding: scaleWidth(8),
    position: 'absolute',
    right: scaleWidth(12),
  },
  giftIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(232, 93, 93, 0.1)',
    borderRadius: scaleWidth(30),
    height: scaleWidth(100),
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
    width: scaleWidth(100),
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(30),
  },
  heroSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(24),
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(28),
    fontWeight: '700',
    textAlign: 'center',
  },
  howItWorksSection: {
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(20),
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: scaleHeight(20),
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(16),
  },
  shareAllButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    flexDirection: 'row',
    gap: scaleWidth(8),
    justifyContent: 'center',
    marginTop: scaleHeight(20),
    paddingVertical: scaleHeight(14),
  },
  shareAllButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  shareButton: {
    alignItems: 'center',
    width: '23%',
  },
  shareButtonText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(8),
  },
  shareGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareIconContainer: {
    alignItems: 'center',
    borderRadius: scaleWidth(25),
    height: scaleWidth(50),
    justifyContent: 'center',
    width: scaleWidth(50),
  },
  shareSection: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(12),
    padding: scaleWidth(20),
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: scaleWidth(12),
    flex: 1,
    marginHorizontal: scaleWidth(4),
    minWidth: scaleWidth(90),
    paddingVertical: scaleHeight(20),
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(4),
  },
  statNumber: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(28),
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statsSection: {
    marginHorizontal: scaleWidth(20),
    marginVertical: scaleHeight(12),
  },
  step: {
    flexDirection: 'row',
    marginBottom: scaleHeight(20),
  },
  stepContent: {
    flex: 1,
    marginLeft: scaleWidth(16),
  },
  stepDescription: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginTop: scaleHeight(4),
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(15),
    height: scaleWidth(30),
    justifyContent: 'center',
    width: scaleWidth(30),
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  stepTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  stepsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
  },
  termsSection: {
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(10),
  },
  termsText: {
    color: theme.colors.text.tertiary,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(18),
    textAlign: 'center',
  },
});