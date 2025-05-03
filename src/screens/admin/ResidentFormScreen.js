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
  RadioButton,
  HelperText,
  Divider,
  IconButton,
  Avatar,
  Chip,
  useTheme,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import {
  createResident,
  updateResident,
  fetchResidentById,
} from '../../store/slices/residentSlice';
import Toast from '../../components/common/Toast';

const ResidentFormScreen = () => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const residentId = route.params?.residentId;
  const isEditing = !!residentId;
  
  // Redux state
  const { loading, error } = useSelector(state => state.residents);
  const { userRole } = useSelector(state => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    type: 'resident', // 'resident' or 'tenant'
    unitNumber: '',
    sector: '',
    buildingNumber: '',
    floorNumber: '',
    moveInDate: '',
    contractEndDate: '',
    notes: '',
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  
  // Load resident data if editing
  useEffect(() => {
    if (isEditing) {
      loadResidentData();
    }
  }, [isEditing, residentId]);
  
  // Check for unsaved changes before navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!unsavedChanges) return;
      
      // Prevent default behavior of leaving the screen
      e.preventDefault();
      
      // Show dialog
      setDiscardDialogVisible(true);
    });
    
    return unsubscribe;
  }, [navigation, unsavedChanges]);
  
  const loadResidentData = async () => {
    try {
      const resident = await dispatch(fetchResidentById(residentId)).unwrap();
      
      setFormData({
        fullName: resident.fullName,
        idNumber: resident.idNumber,
        phoneNumber: resident.phoneNumber,
        email: resident.email,
        type: resident.type,
        unitNumber: resident.unitNumber,
        sector: resident.sector,
        buildingNumber: resident.buildingNumber,
        floorNumber: resident.floorNumber,
        moveInDate: resident.moveInDate,
        contractEndDate: resident.contractEndDate,
        notes: resident.notes,
      });
      
      if (resident.profilePicture) {
        setProfilePicture(resident.profilePicture);
      }
      
      if (resident.documents && resident.documents.length > 0) {
        setDocuments(resident.documents);
      }
    } catch (error) {
      showToast(error.message || t('residents.errorLoadingResident'), 'error');
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.required');
    }
    
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = t('validation.required');
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('validation.required');
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t('validation.invalidPhone');
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    
    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = t('validation.required');
    }
    
    if (!formData.sector.trim()) {
      newErrors.sector = t('validation.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast(t('permissions.cameraRollDenied'), 'error');
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
        setUnsavedChanges(true);
      }
    } catch (error) {
      showToast(t('errors.imagePickerFailed'), 'error');
    }
  };
  
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        const newDocument = {
          id: Date.now().toString(),
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
          size: result.size,
        };
        
        setDocuments(prev => [...prev, newDocument]);
        setUnsavedChanges(true);
      }
    } catch (error) {
      showToast(t('errors.documentPickerFailed'), 'error');
    }
  };
  
  const handleRemoveDocument = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setUnsavedChanges(true);
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast(t('validation.fixErrors'), 'error');
      return;
    }
    
    try {
      const residentData = {
        ...formData,
        profilePicture,
        documents,
      };
      
      if (isEditing) {
        await dispatch(updateResident({ id: residentId, data: residentData })).unwrap();
        showToast(t('residents.updateSuccess'), 'success');
      } else {
        await dispatch(createResident(residentData)).unwrap();
        showToast(t('residents.createSuccess'), 'success');
      }
      
      setUnsavedChanges(false);
      
      // Navigate back after a short delay to show the toast
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      showToast(error.message || t('residents.saveFailed'), 'error');
    }
  };
  
  const handleCancel = () => {
    if (unsavedChanges) {
      setDiscardDialogVisible(true);
    } else {
      navigation.goBack();
    }
  };
  
  const confirmDiscard = () => {
    setDiscardDialogVisible(false);
    navigation.goBack();
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };
  
  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };
  
  if (loading && isEditing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleCancel}
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? t('residents.editResident') : t('residents.addResident')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.formContainer}>
          {/* Profile Picture */}
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
              {t('residents.uploadProfilePicture')}
            </Text>
          </View>
          
          {/* Resident Type */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('residents.residentType')}
          </Text>
          <RadioButton.Group
            onValueChange={(value) => handleInputChange('type', value)}
            value={formData.type}
          >
            <View style={styles.radioGroup}>
              <View style={styles.radioButton}>
                <RadioButton value="resident" />
                <Text>{t('residents.resident')}</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton value="tenant" />
                <Text>{t('residents.tenant')}</Text>
              </View>
            </View>
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          {/* Personal Information */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('residents.personalInfo')}
          </Text>
          
          <TextInput
            label={t('residents.fullName')}
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            style={styles.input}
            mode="outlined"
            error={!!errors.fullName}
          />
          {errors.fullName && (
            <HelperText type="error" visible={!!errors.fullName}>
              {errors.fullName}
            </HelperText>
          )}
          
          <TextInput
            label={t('residents.idNumber')}
            value={formData.idNumber}
            onChangeText={(value) => handleInputChange('idNumber', value)}
            style={styles.input}
            mode="outlined"
            error={!!errors.idNumber}
          />
          {errors.idNumber && (
            <HelperText type="error" visible={!!errors.idNumber}>
              {errors.idNumber}
            </HelperText>
          )}
          
          <TextInput
            label={t('residents.phoneNumber')}
            value={formData.phoneNumber}
            onChangeText={(value) => {
              // Allow only numbers
              const numericValue = value.replace(/[^0-9]/g, '');
              handleInputChange('phoneNumber', numericValue);
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!errors.phoneNumber}
          />
          {errors.phoneNumber && (
            <HelperText type="error" visible={!!errors.phoneNumber}>
              {errors.phoneNumber}
            </HelperText>
          )}
          
          <TextInput
            label={t('residents.email')}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
          />
          {errors.email && (
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          )}
          
          <Divider style={styles.divider} />
          
          {/* Residence Information */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('residents.residenceInfo')}
          </Text>
          
          <TextInput
            label={t('residents.unitNumber')}
            value={formData.unitNumber}
            onChangeText={(value) => handleInputChange('unitNumber', value)}
            style={styles.input}
            mode="outlined"
            error={!!errors.unitNumber}
          />
          {errors.unitNumber && (
            <HelperText type="error" visible={!!errors.unitNumber}>
              {errors.unitNumber}
            </HelperText>
          )}
          
          <TextInput
            label={t('residents.sector')}
            value={formData.sector}
            onChangeText={(value) => handleInputChange('sector', value)}
            style={styles.input}
            mode="outlined"
            error={!!errors.sector}
          />
          {errors.sector && (
            <HelperText type="error" visible={!!errors.sector}>
              {errors.sector}
            </HelperText>
          )}
          
          <TextInput
            label={t('residents.buildingNumber')}
            value={formData.buildingNumber}
            onChangeText={(value) => handleInputChange('buildingNumber', value)}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label={t('residents.floorNumber')}
            value={formData.floorNumber}
            onChangeText={(value) => handleInputChange('floorNumber', value)}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label={t('residents.moveInDate')}
            value={formData.moveInDate}
            onChangeText={(value) => handleInputChange('moveInDate', value)}
            style={styles.input}
            mode="outlined"
            placeholder="DD/MM/YYYY"
          />
          
          {formData.type === 'tenant' && (
            <TextInput
              label={t('residents.contractEndDate')}
              value={formData.contractEndDate}
              onChangeText={(value) => handleInputChange('contractEndDate', value)}
              style={styles.input}
              mode="outlined"
              placeholder="DD/MM/YYYY"
            />
          )}
          
          <Divider style={styles.divider} />
          
          {/* Documents */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('residents.documents')}
          </Text>
          
          <Button
            mode="outlined"
            icon="file-upload"
            onPress={handlePickDocument}
            style={styles.documentButton}
          >
            {t('residents.uploadDocument')}
          </Button>
          
          {documents.length > 0 && (
            <View style={styles.documentList}>
              {documents.map((doc) => (
                <View key={doc.id} style={styles.documentItem}>
                  <View style={styles.documentInfo}>
                    <IconButton
                      icon={doc.type?.includes('pdf') ? 'file-pdf-box' : 'file-image'}
                      size={24}
                      color={doc.type?.includes('pdf') ? '#F40F02' : '#2196F3'}
                    />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    color={colors.error}
                    onPress={() => handleRemoveDocument(doc.id)}
                  />
                </View>
              ))}
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          {/* Additional Notes */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('residents.additionalInfo')}
          </Text>
          
          <TextInput
            label={t('residents.notes')}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
          
          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              {isEditing ? t('common.update') : t('common.save')}
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
          </View>
        </View>
      </ScrollView>
      
      {/* Discard Changes Dialog */}
      <Portal>
        <Dialog visible={discardDialogVisible} onDismiss={() => setDiscardDialogVisible(false)}>
          <Dialog.Title>{t('common.discardChanges')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('common.discardChangesMessage')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDiscardDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={confirmDiscard}>
              {t('common.discard')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Toast */}
      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
        />
      )}
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  divider: {
    marginVertical: 24,
  },
  documentButton: {
    marginBottom: 16,
  },
  documentList: {
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 24,
  },
  submitButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },
});

export default ResidentFormScreen;