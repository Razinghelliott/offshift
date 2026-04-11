import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db, storage } from '../config/firebase';
import { collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TextInput, FlatList } from 'react-native';

const { width } = Dimensions.get('window');

export default function ProDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    craft: 'Chef',
    rate: 100,
    specialties: [],
    portfolioPhotos: [],
    profilePhoto: null,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const crafts = ['Chef', 'Bartender', 'Musician', 'Photographer', 'Florist', 'Planner'];

  useEffect(() => {
    loadProfile();
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (hasChanges) {
        e.preventDefault();
        Alert.alert('Unsaved Changes', 'You have unsaved changes. Do you want to discard them?', [
          { text: 'Discard', onPress: () => navigation.dispatch(e.data.action) },
          { text: 'Cancel', onPress: () => {} },
        ]);
      }
    });
    return unsubscribe;
  }, [hasChanges, navigation]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || '',
          bio: data.bio || '',
          craft: data.craft || 'Chef',
          rate: data.rate || 100,
          specialties: data.specialties || [],
          portfolioPhotos: data.portfolioPhotos || [],
          profilePhoto: data.profilePhoto || null,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = async () => {
    try {
      setUploadingPhoto(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const filename = `users/${user.uid}/profile/${Date.now()}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        setProfile((prev) => ({
          ...prev,
          profilePhoto: url,
        }));
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile photo');
      console.error(error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePortfolioUpload = async () => {
    if (profile.portfolioPhotos.length >= 6) {
      Alert.alert('Limit Reached', 'You can only upload up to 6 portfolio photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const filename = `users/${user.uid}/portfolio/${Date.now()}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        setProfile((prev) => ({
          ...prev,
          portfolioPhotos: [...prev.portfolioPhotos, url],
        }));
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload portfolio photo');
      console.error(error);
    }
  };

  const handleRemovePortfolioPhoto = (index) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      {
        text: 'Remove',
        onPress: () => {
          setProfile((prev) => ({
            ...prev,
            portfolioPhotos: prev.portfolioPhotos.filter((_, i) => i !== index),
          }));
          setHasChanges(true);
        },
      },
      { text: 'Cancel' },
    ]);
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setProfile((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty('');
      setHasChanges(true);
    }
  };

  const removeSpecialty = (index) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profile.name,
        bio: profile.bio,
        craft: profile.craft,
        rate: profile.rate,
        specialties: profile.specialties,
        portfolioPhotos: profile.portfolioPhotos,
        profilePhoto: profile.profilePhoto,
        updatedAt: serverTimestamp(),
      });
      setHasChanges(false);
      Alert.alert('Success', 'Profile saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.red} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Change Indicator */}
        {hasChanges && (
          <View style={styles.changeIndicator}>
            <Ionicons name="alert-circle" size={16} color={theme.white} />
            <Text style={styles.changeIndicatorText}>You have unsaved changes</Text>
          </View>
        )}

        {/* Profile Photo */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handleProfilePhotoUpload}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto && <ActivityIndicator size="large" color={theme.red} />}
            {!uploadingPhoto && (
              <>
                {profile.profilePhoto ? (
                  <Image source={{ uri: profile.profilePhoto }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color={theme.white} />
                  </View>
                )}
                <View style={styles.photoOverlay}>
                  <Ionicons name="pencil" size={20} color={theme.white} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={theme.grayLight}
            value={profile.name}
            onChangeText={(text) => {
              setProfile((prev) => ({ ...prev, name: text }));
              setHasChanges(true);
            }}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself"
            placeholderTextColor={theme.grayLight}
            value={profile.bio}
            onChangeText={(text) => {
              setProfile((prev) => ({ ...prev, bio: text }));
              setHasChanges(true);
            }}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Craft */}
        <View style={styles.section}>
          <Text style={styles.label}>Craft</Text>
          <View style={styles.craftContainer}>
            {crafts.map((craft) => (
              <TouchableOpacity
                key={craft}
                style={[styles.craftButton, profile.craft === craft && styles.craftButtonActive]}
                onPress={() => {
                  setProfile((prev) => ({ ...prev, craft }));
                  setHasChanges(true);
                }}
              >
                <Text
                  style={[
                    styles.craftButtonText,
                    profile.craft === craft && styles.craftButtonTextActive,
                  ]}
                >
                  {craft}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rate */}
        <View style={styles.section}>
          <Text style={styles.label}>Hourly Rate: ${profile.rate}</Text>
          <View style={styles.rateSliderContainer}>
            <Text style={styles.rateLabel}>$25</Text>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((profile.rate - 25) / (500 - 25)) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.rateLabel}>$500</Text>
          </View>
          <TextInput
            style={styles.rateInput}
            keyboardType="number-pad"
            value={String(profile.rate)}
            onChangeText={(text) => {
              const num = parseInt(text) || 25;
              const clamped = Math.max(25, Math.min(500, num));
              setProfile((prev) => ({ ...prev, rate: clamped }));
              setHasChanges(true);
            }}
          />
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.label}>Specialties</Text>
          <View style={styles.specialtiesInputContainer}>
            <TextInput
              style={styles.specialtyInput}
              placeholder="Add specialty"
              placeholderTextColor={theme.grayLight}
              value={newSpecialty}
              onChangeText={setNewSpecialty}
            />
            <TouchableOpacity style={styles.addButton} onPress={addSpecialty}>
              <Ionicons name="add" size={24} color={theme.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.specialtyPills}>
            {profile.specialties.map((specialty, index) => (
              <View key={index} style={styles.pill}>
                <Text style={styles.pillText}>{specialty}</Text>
                <TouchableOpacity onPress={() => removeSpecialty(index)}>
                  <Ionicons name="close" size={16} color={theme.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio Photos */}
        <View style={styles.section}>
          <Text style={styles.label}>Portfolio Photos</Text>
          <View style={styles.portfolioGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <TouchableOpacity
                key={index}
                style={styles.portfolioSlot}
                onPress={() => {
                  if (index < profile.portfolioPhotos.length) {
                    handleRemovePortfolioPhoto(index);
                  } else {
                    handlePortfolioUpload();
                  }
                }}
                onLongPress={() => {
                  if (index < profile.portfolioPhotos.length) {
                    handleRemovePortfolioPhoto(index);
                  }
                }}
              >
                {index < profile.portfolioPhotos.length ? (
                  <>
                    <Image
                      source={{ uri: profile.portfolioPhotos[index] }}
                      style={styles.portfolioImage}
                    />
                    <View style={styles.portfolioOverlay}>
                      <Ionicons name="trash" size={20} color={theme.white} />
                    </View>
                  </>
                ) : (
                  <View style={styles.portfolioPlaceholder}>
                    <Ionicons name="add" size={32} color={theme.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? (
          <ActivityIndicator size="small" color={theme.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.red,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  changeIndicatorText: {
    color: theme.white,
    marginLeft: 8,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.grayLight,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: theme.darkCard,
    borderColor: theme.grayLight,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: theme.white,
    fontSize: 14,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  craftContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  craftButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.darkCard,
    borderWidth: 1,
    borderColor: theme.grayLight,
  },
  craftButtonActive: {
    backgroundColor: theme.red,
    borderColor: theme.red,
  },
  craftButtonText: {
    color: theme.grayLight,
    fontSize: 12,
    fontWeight: '600',
  },
  craftButtonTextActive: {
    color: theme.white,
  },
  rateSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rateLabel: {
    color: theme.grayLight,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: theme.darkCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 4,
    backgroundColor: theme.red,
  },
  rateInput: {
    backgroundColor: theme.darkCard,
    borderColor: theme.grayLight,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: theme.white,
    fontSize: 14,
  },
  specialtiesInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  specialtyInput: {
    flex: 1,
    backgroundColor: theme.darkCard,
    borderColor: theme.grayLight,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: theme.white,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.red,
  },
  pillText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: '600',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioSlot: {
    width: (width - 52) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.darkCard,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.grayLight,
    borderStyle: 'dashed',
  },
  portfolioOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.red,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
