import { theme } from "@/theme";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import feedApi from '@/services/feedApi';

const CreatePostScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please grant camera roll permissions to select photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please grant camera permissions to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose from where you want to select an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handlePost = async () => {
    if (!content && !selectedImage) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    try {
      setPosting(true);
      
      let imageUrl = undefined;
      if (selectedImage) {
        // For MVP, we'll use the local URI
        // In production, upload to Supabase Storage or Cloudinary
        imageUrl = await feedApi.uploadImage(selectedImage);
        console.log('Image URL to post:', imageUrl);
      }

      const result = await feedApi.createPost(content, imageUrl);
      console.log('Post created:', result);
      
      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>New Post</Text>
        
        <TouchableOpacity
          onPress={handlePost}
          disabled={posting || (!content && !selectedImage)}
          style={[
            styles.headerButton,
            (!content && !selectedImage) && styles.disabledButton
          ]}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[
              styles.postText,
              (!content && !selectedImage) && styles.disabledText
            ]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your plate today?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
          autoFocus
        />

        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeImage}
            >
              <Ionicons name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={showImageOptions}
          >
            <Ionicons name="image-outline" size={28} color="#007AFF" />
            <Text style={styles.toolbarText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="location-outline" size={28} color="#007AFF" />
            <Text style={styles.toolbarText}>Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="pricetag-outline" size={28} color="#007AFF" />
            <Text style={styles.toolbarText}>Tag</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.charCount}>
          <Text style={styles.charCountText}>
            {content.length}/500
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray['200'],
    backgroundColor: theme.colors.white,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray['700'],
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.ios.blue,
  },
  postText: {
    fontSize: 16,
    color: theme.colors.ios.blue,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.gray['400'],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: theme.colors.gray['700'],
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: theme.colors.ui.lighterGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 14,
  },
  toolbar: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.lighterGray,
    marginTop: 16,
  },
  toolbarButton: {
    alignItems: 'center',
    marginRight: 32,
  },
  toolbarText: {
    fontSize: 12,
    color: theme.colors.ios.blue,
    marginTop: 4,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: 12,
    color: theme.colors.gray['400'],
  },
});

export default CreatePostScreen;