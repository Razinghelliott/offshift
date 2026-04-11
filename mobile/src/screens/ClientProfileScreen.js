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
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: null,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile.email}
            editable={false}
          />
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor={theme.grayLight}
            value={profile.phone}
            onChangeText={(text) => {
              setProfile((prev) => ({ ...prev, phone: text }));
              setHasChanges(true);
            }}
            keyboardType="phone-pad"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={theme.white} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, (saving || !hasChanges) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? (
          <ActivityIndicator size="small" color={theme.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
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
  inputDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.red,
    borderRadius: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: theme.red,
    fontSize: 16,
    fontWeight: '600',
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
