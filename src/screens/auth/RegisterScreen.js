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
  TextInput,
  Button,
  Text,
  useTheme,
  Snackbar,
  HelperText,
  Divider,
  Menu,
  IconButton,
  Avatar,
  Checkbox,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useDispatch } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { useTranslation } from '../../i18n';

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const dispatch = useDispatch();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    userRole: '',
    terms: '',
  });

  // User role options
  const userRoles = [
    { label: t('roles.admin'), value: 'admin' },
    { label: t('roles.cityManager'), value: 'cityManager' },
    { label: t('roles.dataEntry'), value: 'dataEntry' },
    { label: t('roles.securityOfficer'), value: 'securityOfficer' },
    { label: t('roles.gateStaff'), value: 'gateStaff' },
    { label: t('roles.resident'), value: 'resident' },
    { label: t('roles.customerSupport'), value: 'customerSupport' },
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      userRole: '',
      terms: '',
    };
    
    let isValid = true;

    if (!fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = t('validation.invalidEmail');
      isValid = false;
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('validation.phoneRequired');
      isValid = false;
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = t('validation.invalidPhone');
      isValid = false;
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
      isValid = false;
    } else if (!validatePassword(password)) {
      newErrors.password = t('validation.passwordStrength');
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
      isValid = false;
    }

    if (!userRole) {
      newErrors.userRole = t('validation.roleRequired');
      isValid = false;
    }

    if (!termsAccepted) {
      newErrors.terms = t('validation.termsRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle profile picture upload
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        setError(t('permissions.cameraRollDenied'));
        setSnackbarVisible(true);
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
      setError(t('errors.imagePickerFailed'));
      setSnackbarVisible(true);
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
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
          size: result.size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setError(t('errors.documentPickerFailed'));
      setSnackbarVisible(true);
    }
  };

  // Handle document removal
  const handleRemoveDocument = (index) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };

  // Handle registration submission
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare registration data
      const userData = {
        fullName,
        email,
        phoneNumber,
        password,
        userRole,
        profilePicture,
        documents,
      };
      
      // Call register action from Redux
      await dispatch(register(userData)).unwrap();
      
      // Show success message
      setError('');
      setSnackbarVisible(true);
      
      // Navigate to pending approval screen
      setTimeout(() => {
        navigation.navigate('PendingApproval');
      }, 2000);
    } catch (err) {
      setError(err.message || t('errors.registrationFailed'));
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {t('register.title', 'Create New Account')}
          </Text>
          
          {/* Profile Picture Upload */}
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity onPress={handlePickImage}>
              {profilePicture ? (
                <Avatar.Image 
                  source={{ uri: profilePicture }} 
                  size={100} 
                  style={styles.profileImage}
                />
              ) : (
                <Avatar.Icon 
                  icon="account" 
                  size={100} 
                  style={[styles.profileImage, { backgroundColor: colors.primary }]}
                />
              )}
              <View style={styles.cameraIconContainer}>
                <IconButton
                  icon="camera"
                  size={20}
                  color="#fff"
                  style={styles.cameraIcon}
                />
              </View>
            </TouchableOpacity>
            <Text style={[styles.uploadText, { color: colors.text }]}>
              {t('register.uploadProfilePicture')}
            </Text>
          </View>
          
          {/* Full Name */}
          <TextInput
            label={t('register.fullName')}
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            error={!!errors.fullName}
          />
          {errors.fullName ? (
            <HelperText type="error" visible={!!errors.fullName}>
              {errors.fullName}
            </HelperText>
          ) : null}
          
          {/* Email */}
          <TextInput
            label={t('register.email')}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
            error={!!errors.email}
          />
          {errors.email ? (
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          ) : null}
          
          {/* Phone Number */}
          <TextInput
            label={t('register.phoneNumber')}
            value={phoneNumber}
            onChangeText={(text) => {
              // Allow only numbers
              const numericValue = text.replace(/[^0-9]/g, '');
              setPhoneNumber(numericValue);
            }}
            style={styles.input}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Icon icon="phone" />}
            error={!!errors.phoneNumber}
          />
          {errors.phoneNumber ? (
            <HelperText type="error" visible={!!errors.phoneNumber}>
              {errors.phoneNumber}
            </HelperText>
          ) : null}
          
          {/* Password */}
          <TextInput
            label={t('register.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            error={!!errors.password}
          />
          {errors.password ? (
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
          ) : (
            <HelperText type="info" visible={!!password}>
              {t('register.passwordRequirements')}
            </HelperText>
          )}
          
          {/* Confirm Password */}
          <TextInput
            label={t('register.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword ? (
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          ) : null}
          
          {/* User Role Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { borderColor: errors.userRole ? colors.error : colors.outline },
              ]}
              onPress={() => setMenuVisible(true)}
            >
              <Text style={{ color: userRole ? colors.text : colors.placeholder }}>
                {userRole ? 
                  userRoles.find(role => role.value === userRole)?.label : 
                  t('register.selectRole')}
              </Text>
              <IconButton icon="menu-down" size={24} />
            </TouchableOpacity>
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={styles.menu}
            >
              {userRoles.map((role) => (
                <Menu.Item
                  key={role.value}
                  title={role.label}
                  onPress={() => {
                    setUserRole(role.value);
                    setMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          </View>
          {errors.userRole ? (
            <HelperText type="error" visible={!!errors.userRole}>
              {errors.userRole}
            </HelperText>
          ) : null}
          
          {/* Document Upload Section */}
          <View style={styles.documentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('register.documents')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              {t('register.documentsDescription')}
            </Text>
            
            <Button
              mode="outlined"
              icon="file-upload"
              onPress={handlePickDocument}
              style={styles.uploadButton}
            >
              {t('register.uploadDocument')}
            </Button>
            
            {documents.length > 0 && (
              <View style={styles.documentList}>
                {documents.map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <View style={styles.documentInfo}>
                      <IconButton icon="file-document" size={24} color={colors.primary} />
                      <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1} ellipsizeMode="middle">
                        {doc.name}
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => handleRemoveDocument(index)}
                      color={colors.error}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <Checkbox
                status={termsAccepted ? 'checked' : 'unchecked'}
                onPress={() => setTermsAccepted(!termsAccepted)}
                color={colors.primary}
              />
              <Text style={{ color: colors.text, marginLeft: 8 }}>
                {t('register.acceptTerms')}
                <Text style={{ color: colors.primary }}> {t('register.termsLink')}</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms ? (
              <HelperText type="error" visible={!!errors.terms}>
                {errors.terms}
              </HelperText>
            ) : null}
          </View>
          
          {/* Register Button */}
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={loading}
            disabled={loading}
          >
            {t('register.createAccount')}
          </Button>
          
          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={{ color: colors.text }}>
              {t('register.alreadyHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginText, { color: colors.primary }]}>
                {t('register.login')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: t('common.dismiss'),
          onPress: () => setSnackbarVisible(false),
        }}
        duration={3000}
      >
        {error || t('register.registrationSuccess')}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    marginBottom: 8,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#666',
    borderRadius: 15,
    padding: 2,
  },
  cameraIcon: {
    margin: 0,
  },
  uploadText: {
    marginTop: 4,
    fontSize: 14,
  },
  input: {
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 56,
  },
  menu: {
    width: '100%',
  },
  documentSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  uploadButton: {
    marginBottom: 16,
  },
  documentList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingVertical: 4,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default RegisterScreen;