import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  RadioButton,
  Divider,
  IconButton,
  useTheme,
  Menu,
  List,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  createResident,
  updateResident,
  fetchResidentById,
  clearCurrentResident,
} from '../../store/slices/residentsSlice';
import { useTranslation } from '../../i18n';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import FileAttachment from '../../components/files/FileAttachment';

const ResidentFormScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const dispatch = useDispatch();
  
  const { isEditing, id } = route.params || { isEditing: false };
  
  const { currentResident, loading, error } = useSelector(state => state.residents);
  
  // Form state
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [sector, setSector] = useState('');
  const [type, setType] = useState('owner');
  const [nationality, setNationality] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState([]);
  const [sectorMenuVisible, setSectorMenuVisible] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({
    name: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    unitNumber: '',
    sector: '',
  });
  
  // Sectors list
  const sectors = [
    { label: t('sectors.sector1', 'Sector 1'), value: 'Sector 1' },
    { label: t('sectors.sector2', 'Sector 2'), value: 'Sector 2' },
    { label: t('sectors.sector3', 'Sector 3'), value: 'Sector 3' },
    { label: t('sectors.sector4', 'Sector 4'), value: 'Sector 4' },
    { label: t('sectors.sector5', 'Sector 5'), value: 'Sector 5' },
  ];
  
  // Load resident data if editing
  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchResidentById(id));
    }
    
    return () => {
      dispatch(clearCurrentResident());
    };
  }, [dispatch, isEditing, id]);
  
  // Populate form with resident data when available
  useEffect(() => {
    if (isEditing && currentResident) {
      setName(currentResident.name || '');
      setIdNumber(currentResident.idNumber || '');
      setPhoneNumber(currentResident.phone || '');
      setEmail(currentResident.email || '');
      setUnitNumber(currentResident.unitNumber || '');
      setSector(currentResident.sector || '');
      setType(currentResident.type || 'owner');
      setNationality(currentResident.nationality || '');
      setMoveInDate(currentResident.moveInDate ? new Date(currentResident.moveInDate).toLocaleDateString() : '');
      setEmergencyContact(currentResident.emergencyContact || '');
      setNotes(currentResident.notes || '');
      setDocuments(currentResident.documents || []);
    }
  }, [isEditing, currentResident]);
  
  // Validation functions
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
  };
  
  const validateForm = () => {
    const newErrors = {
      name: '',
      idNumber: '',
      phoneNumber: '',
      email: '',
      unitNumber: '',
      sector: '',
    };
    
    let isValid = true;
    
    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired', 'Name is required');
      isValid = false;
    }
    
    if (!idNumber.trim()) {
      newErrors.idNumber = t('validation.idNumberRequired', 'ID number is required');
      isValid = false;
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('validation.phoneRequired', 'Phone number is required');
      isValid = false;
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = t('validation.invalidPhone', 'Invalid phone number format');
      isValid = false;
    }
    
    if (email && !validateEmail(email)) {
      newErrors.email = t('validation.invalidEmail', 'Invalid email format');
      isValid = false;
    }
    
    if (!unitNumber.trim()) {
      newErrors.unitNumber = t('validation.unitNumberRequired', 'Unit number is required');
      isValid = false;
    }
    
    if (!sector) {
      newErrors.sector = t('validation.sectorRequired', 'Sector is required');
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
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
          id: Date.now().toString(), // Temporary ID
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
          size: result.size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error', 'Error'),
        text2: t('errors.documentPickerFailed', 'Failed to pick document'),
      });
    }
  };
  
  // Handle document removal
  const handleRemoveDocument = (docId) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      // Scroll to first error
      return;
    }
    
    const residentData = {
      name,
      idNumber,
      phone: phoneNumber,
      email,
      unitNumber,
      sector,
      type,
      nationality,
      moveInDate: moveInDate ? new Date(moveInDate).toISOString() : '',
      emergencyContact,
      notes,
      documents,
    };
    
    if (isEditing) {
      dispatch(updateResident({ id, residentData }))
        .unwrap()
        .then(() => {
          Toast.show({
            type: 'success',
            text1: t('common.success', 'Success'),
            text2: t('residents.updateSuccess', 'Resident updated successfully'),
          });
          navigation.goBack();
        })
        .catch((error) => {
          Toast.show({
            type: 'error',
            text1: t('common.error', 'Error'),
            text2: error.message || t('residents.updateError', 'Failed to update resident'),
          });
        });
    } else {
      dispatch(createResident(residentData))
        .unwrap()
        .then(() => {
          Toast.show({
            type: 'success',
            text1: t('common.success', 'Success'),
            text2: t('residents.createSuccess', 'Resident created successfully'),
          });
          navigation.goBack();
        })
        .catch((error) => {
          Toast.show({
            type: 'error',
            text1: t('common.error', 'Error'),
            text2: error.message || t('residents.createError', 'Failed to create resident'),
          });
        });
    }
  };
  
  if (loading && isEditing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>{t('common.loading', 'Loading...')}</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          {/* Basic Information */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('residents.basicInfo', 'Basic Information')}
          </Text>
          
          <TextInput
            label={t('residents.name', 'Full Name')}
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
            error={!!errors.name}
          />
          {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}
          
          <TextInput
            label={t('residents.idNumber', 'ID Number')}
            value={idNumber}
            onChangeText={setIdNumber}
            style={styles.input}
            mode="outlined"
            error={!!errors.idNumber}
          />
          {errors.idNumber ? <HelperText type="error">{errors.idNumber}</HelperText> : null}
          
          <TextInput
            label={t('residents.nationality', 'Nationality')}
            value={nationality}
            onChangeText={setNationality}
            style={styles.input}
            mode="outlined"
          />
          
          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>{t('residents.type', 'Resident Type')}:</Text>
            <View style={styles.radioOptions}>
              <View style={styles.radioOption}>
                <RadioButton
                  value="owner"
                  status={type === 'owner' ? 'checked' : 'unchecked'}
                  onPress={() => setType('owner')}
                  color={colors.primary}
                />
                <Text onPress={() => setType('owner')}>
                  {t('residents.owner', 'Owner')}
                </Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="tenant"
                  status={type === 'tenant' ? 'checked' : 'unchecked'}
                  onPress={() => setType('tenant')}
                  color={colors.primary}
                />
                <Text onPress={() => setType('tenant')}>
                  {t('residents.tenant', 'Tenant')}
                </Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Contact Information */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('residents.contactInfo', 'Contact Information')}
          </Text>
          
          <TextInput
            label={t('residents.phoneNumber', 'Phone Number')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!errors.phoneNumber}
          />
          {errors.phoneNumber ? <HelperText type="error">{errors.phoneNumber}</HelperText> : null}
          
          <TextInput
            label={t('residents.email', 'Email')}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
          />
          {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}
          
          <TextInput
            label={t('residents.emergencyContact', 'Emergency Contact')}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <Divider style={styles.divider} />
          
          {/* Residence Information */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('residents.residenceInfo', 'Residence Information')}
          </Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                label={t('residents.unitNumber', 'Unit Number')}
                value={unitNumber}
                onChangeText={setUnitNumber}
                style={styles.input}
                mode="outlined"
                error={!!errors.unitNumber}
              />
              {errors.unitNumber ? <HelperText type="error">{errors.unitNumber}</HelperText> : null}
            </View>
          </View>
          
          <View>
            <Menu
              visible={sectorMenuVisible}
              onDismiss={() => setSectorMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={[
                    styles.sectorSelector,
                    { borderColor: errors.sector ? colors.error : colors.outline }
                  ]}
                  onPress={() => setSectorMenuVisible(true)}
                >
                  <Text style={{ color: sector ? colors.text : colors.placeholder }}>
                    {sector || t('residents.selectSector', 'Select Sector')}
                  </Text>
                  <IconButton icon="menu-down" size={24} />
                </TouchableOpacity>
              }
            >
              {sectors.map((item) => (
                <Menu.Item
                  key={item.value}
                  onPress={() => {
                    setSector(item.value);
                    setSectorMenuVisible(false);
                  }}
                  title={item.label}
                />
              ))}
            </Menu>
            {errors.sector ? <HelperText type="error">{errors.sector}</HelperText> : null}
          </View>
          
          <TextInput
            label={t('residents.moveInDate', 'Move-in Date')}
            value={moveInDate}
            onChangeText={setMoveInDate}
            style={styles.input}
            mode="outlined"
            placeholder="DD/MM/YYYY"
          />
          
          <Divider style={styles.divider} />
          
          {/* Documents */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('residents.documents', 'Documents')}
          </Text>
          
          <Button
            mode="outlined"
            icon="file-upload"
            onPress={handlePickDocument}
            style={styles.documentButton}
          >
            {t('residents.uploadDocument', 'Upload Document')}
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
                    <Text numberOfLines={1} style={styles.documentName}>
                      {doc.name}
                    </Text>
                  </View>
                  <IconButton
                    icon="close-circle"
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
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('residents.additionalInfo', 'Additional Information')}
          </Text>
          
          <TextInput
            label={t('residents.notes', 'Notes')}
            value={notes}
            onChangeText={setNotes}
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
              {isEditing
                ? t('common.update', 'Update')
                : t('common.save', 'Save')}
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  input: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  radioGroup: {
    marginVertical: 12,
  },
  radioLabel: {
    marginBottom: 8,
  },
  radioOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  documentButton: {
    marginVertical: 8,
  },
  documentList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
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
    marginBottom: 40,
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