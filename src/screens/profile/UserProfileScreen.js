import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Divider,
  IconButton,
  Switch,
  HelperText,
  useTheme,
  Portal,
  Dialog,
  Snackbar,
  Chip,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import { updateUserProfile, changePassword, updatePreferences } from '../../store/slices/userSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { setLanguage } from '../../store/slices/i18nSlice';
import Header from '../../components/common/Header';
import { useProfilePermissions } from '../../components/permissions/ProfilePermissionsProvider';
import PermissionAware from '../../components/permissions/PermissionAware';

const UserProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, isRTL, language } = useTranslation();
  const dispatch = useDispatch();
  
  const { user, loading } = useSelector(state => state.user);
  const { theme } = useSelector(state => state.theme);
  const { userRole } = useSelector(state => state.auth);
  
  // Get profile permissions
  const { permissions, loading: permissionsLoading } = useProfilePermissions();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // UI state
  const [profilePicture, setProfilePicture] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const [isArabic, setIsArabic] = useState(language === 'ar');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [documents, setDocuments] = useState([]);
  
  // Validation state
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
      
      if (user.profilePicture) {
        setProfilePicture(user.profilePicture);
      }
      
      if (user.documents) {
        setDocuments(user.documents);
      }
    }
  }, [user]);
  
  // Handle profile picture upload
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showSnackbar(t('permissions.cameraRollDenied'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showSnackbar(t('errors.imagePickerFailed'));
    }
  };
  
  // Handle document upload
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setDocuments([...documents, {
          id: Date.now().toString(),
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
          size: result.size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showSnackbar(t('errors.documentPickerFailed'));
    }
  };
  
  // Handle document download
  const handleDownloadDocument = (document) => {
    // In a real app, this would trigger a download
    showSnackbar(t('profile.documentDownloading'));
  };
  
  // Handle document removal
  const handleRemoveDocument = (documentId) => {
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };
  
  // Handle profile form input changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Handle password form input changes
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.fullName.trim()) {
      errors.fullName = t('validation.fullNameRequired');
    }
    
    if (!profileData.email.trim()) {
      errors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = t('validation.invalidEmail');
    }
    
    if (!profileData.phoneNumber.trim()) {
      errors.phoneNumber = t('validation.phoneRequired');
    } else if (!/^\d{10,15}$/.test(profileData.phoneNumber)) {
      errors.phoneNumber = t('validation.invalidPhone');
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = t('validation.currentPasswordRequired');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('validation.newPasswordRequired');
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('validation.passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordData.newPassword)) {
      errors.newPassword = t('validation.passwordStrength');
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('validation.passwordsDoNotMatch');
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }
    
    try {
      await dispatch(updateUserProfile({
        ...profileData,
        profilePicture,
        documents,
      })).unwrap();
      
      setEditMode(false);
      showSnackbar(t('profile.updateSuccess'));
    } catch (error) {
      showSnackbar(error.message || t('profile.updateError'));
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      
      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showSnackbar(t('profile.passwordChangeSuccess'));
    } catch (error) {
      showSnackbar(error.message || t('profile.passwordChangeError'));
    }
  };
  
  // Handle theme toggle
  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    dispatch(toggleTheme());
  };
  
  // Handle language toggle
  const handleToggleLanguage = () => {
    const newLanguage = isArabic ? 'en' : 'ar';
    setIsArabic(!isArabic);
    dispatch(setLanguage(newLanguage));
  };
  
  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Render loading state
  if (loading || permissionsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('profile.title')} showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Header title={t('profile.title')} showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <PermissionAware
            permissionKey="profilePicture.view"
            fallback={
              <Avatar.Icon size={100} icon="account" style={{ backgroundColor: colors.primary }} />
            }
          >
            {profilePicture ? (
              <Avatar.Image
                size={100}
                source={{ uri: profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Icon size={100} icon="account" style={{ backgroundColor: colors.primary }} />
            )}
          </PermissionAware>
          
          <PermissionAware permissionKey="profilePicture.edit">
            <TouchableOpacity
              style={[styles.editPictureButton, { backgroundColor: colors.primary }]}
              onPress={handlePickImage}
            >
              <IconButton icon="camera" color="#fff" size={20} />
            </TouchableOpacity>
          </PermissionAware>
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.fullName || t('profile.unknownUser')}
            </Text>
            
            <Chip 
              mode="outlined" 
              style={styles.roleChip}
            >
              {t(`roles.${userRole}`, userRole)}
            </Chip>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Basic Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('profile.basicInfo')}
            </Text>
            
            <PermissionAware permissionKey="basicInfo.edit">
              {!editMode ? (
                <Button
                  mode="text"
                  onPress={() => setEditMode(true)}
                  disabled={loading}
                >
                  {t('common.edit')}
                </Button>
              ) : (
                <Button
                  mode="text"
                  onPress={() => setEditMode(false)}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
              )}
            </PermissionAware>
          </View>
          
          <PermissionAware permissionKey="basicInfo.view">
            <View style={styles.formContainer}>
              <TextInput
                label={t('profile.fullName')}
                value={profileData.fullName}
                onChangeText={(value) => handleProfileChange('fullName', value)}
                style={styles.input}
                mode="outlined"
                disabled={!editMode}
                error={!!profileErrors.fullName}
              />
              {profileErrors.fullName && (
                <HelperText type="error">{profileErrors.fullName}</HelperText>
              )}
              
              <TextInput
                label={t('profile.email')}
                value={profileData.email}
                onChangeText={(value) => handleProfileChange('email', value)}
                style={styles.input}
                mode="outlined"
                disabled={!editMode}
                error={!!profileErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {profileErrors.email && (
                <HelperText type="error">{profileErrors.email}</HelperText>
              )}
              
              <TextInput
                label={t('profile.phoneNumber')}
                value={profileData.phoneNumber}
                onChangeText={(value) => handleProfileChange('phoneNumber', value)}
                style={styles.input}
                mode="outlined"
                disabled={!editMode}
                error={!!profileErrors.phoneNumber}
                keyboardType="phone-pad"
              />
              {profileErrors.phoneNumber && (
                <HelperText type="error">{profileErrors.phoneNumber}</HelperText>
              )}
              
              {editMode && (
                <Button
                  mode="contained"
                  onPress={handleUpdateProfile}
                  style={styles.button}
                  loading={loading}
                  disabled={loading}
                >
                  {t('common.save')}
                </Button>
              )}
            </View>
          </PermissionAware>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('profile.security')}
            </Text>
            
            {!changePasswordMode ? (
              <Button
                mode="text"
                onPress={() => setChangePasswordMode(true)}
                disabled={loading}
              >
                {t('profile.changePassword')}
              </Button>
            ) : (
              <Button
                mode="text"
                onPress={() => setChangePasswordMode(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
            )}
          </View>
          
          {changePasswordMode && (
            <View style={styles.formContainer}>
              <TextInput
                label={t('profile.currentPassword')}
                value={passwordData.currentPassword}
                onChangeText={(value) => handlePasswordChange('currentPassword', value)}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showCurrentPassword}
                error={!!passwordErrors.currentPassword}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? "eye-off" : "eye"}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
              />
              {passwordErrors.currentPassword && (
                <HelperText type="error">{passwordErrors.currentPassword}</HelperText>
              )}
              
              <TextInput
                label={t('profile.newPassword')}
                value={passwordData.newPassword}
                onChangeText={(value) => handlePasswordChange('newPassword', value)}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showNewPassword}
                error={!!passwordErrors.newPassword}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? "eye-off" : "eye"}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />
              {passwordErrors.newPassword && (
                <HelperText type="error">{passwordErrors.newPassword}</HelperText>
              )}
              
              <TextInput
                label={t('profile.confirmPassword')}
                value={passwordData.confirmPassword}
                onChangeText={(value) => handlePasswordChange('confirmPassword', value)}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                error={!!passwordErrors.confirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {passwordErrors.confirmPassword && (
                <HelperText type="error">{passwordErrors.confirmPassword}</HelperText>
              )}
              
              <Button
                mode="contained"
                onPress={handleChangePassword}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                {t('profile.updatePassword')}
              </Button>
            </View>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Documents Section */}
        <PermissionAware permissionKey="documents.view">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profile.documents')}
              </Text>
              
              <PermissionAware permissionKey="documents.upload">
                <Button
                  mode="text"
                  onPress={handlePickDocument}
                  disabled={loading}
                  icon="upload"
                >
                  {t('profile.uploadDocument')}
                </Button>
              </PermissionAware>
            </View>
            
            {documents.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {t('profile.noDocuments')}
              </Text>
            ) : (
              <View style={styles.documentsList}>
                {documents.map((doc, index) => (
                  <View key={doc.id || index} style={styles.documentItem}>
                    <View style={styles.documentInfo}>
                      <IconButton
                        icon={doc.type?.includes('pdf') ? 'file-pdf-box' : 'file-image'}
                        size={24}
                        color={colors.primary}
                      />
                      <Text style={{ color: colors.text }} numberOfLines={1} ellipsizeMode="middle">
                        {doc.name}
                      </Text>
                    </View>
                    
                    <View style={styles.documentActions}>
                      <PermissionAware permissionKey="documents.download">
                        <IconButton
                          icon="download"
                          size={20}
                          color={colors.primary}
                          onPress={() => handleDownloadDocument(doc)}
                        />
                      </PermissionAware>
                      
                      <PermissionAware permissionKey="documents.delete">
                        <IconButton
                          icon="delete"
                          size={20}
                          color={colors.error}
                          onPress={() => handleRemoveDocument(doc.id)}
                        />
                      </PermissionAware>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </PermissionAware>
        
        <Divider style={styles.divider} />
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('profile.preferences')}
          </Text>
          
          <View style={styles.preferenceItem}>
            <Text style={{ color: colors.text }}>{t('profile.darkMode')}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              color={colors.primary}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={{ color: colors.text }}>{t('profile.arabicLanguage')}</Text>
            <Switch
              value={isArabic}
              onValueChange={handleToggleLanguage}
              color={colors.primary}
            />
          </View>
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t('common.dismiss'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#ccc',
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleChip: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  documentsList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default UserProfileScreen;