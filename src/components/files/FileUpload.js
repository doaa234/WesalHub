import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  useTheme,
  ProgressBar,
  Chip,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from '../../i18n';
import { useSelector } from 'react-redux';
import { uploadFile } from '../../services/fileService';
import { hasPermission } from '../../utils/permissionUtils';
import config from '../../config';

const FileUpload = ({ residentId, onFileUploaded, category }) => {
  const { colors, dark } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  
  const user = useSelector(state => state.auth.user);
  const canUpload = hasPermission(user, 'residents', 'edit', 'files');
  
  // Get allowed file types from config
  const allowedFileTypes = config.fileStorage.allowedFileTypes;
  const maxFileSize = config.fileStorage.maxFileSize;
  
  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Pick a document
  const pickDocument = async () => {
    try {
      // Reset states
      setError(null);
      
      // Define the document types to pick based on config
      const documentTypes = Object.keys(allowedFileTypes).map(type => {
        // Convert MIME types to document types that expo-document-picker understands
        if (type === 'application/pdf') return 'application/pdf';
        if (type === 'image/jpeg') return 'image/jpeg';
        if (type === 'image/png') return 'image/png';
        if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') 
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return type;
      });
      
      const result = await DocumentPicker.getDocumentAsync({
        type: documentTypes,
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      // Check file size
      if (file.size > maxFileSize) {
        setError(t('files.fileTooLarge', { maxSize: formatBytes(maxFileSize) }));
        return;
      }
      
      // Check file type
      const fileType = file.mimeType;
      if (!Object.keys(allowedFileTypes).includes(fileType)) {
        setError(t('files.fileTypeNotAllowed'));
        return;
      }
      
      setSelectedFile(file);
      setConfirmDialogVisible(true);
    } catch (err) {
      console.error('Error picking document:', err);
      setError(t('files.errorPickingDocument'));
    }
  };
  
  // Upload the selected file
  const handleUpload = async () => {
    if (!selectedFile || !residentId || !category) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
      
      // Upload file with progress tracking
      const onProgress = (progress) => {
        setUploadProgress(progress);
      };
      
      const result = await uploadFile(residentId, category, formData, onProgress);
      
      // Reset states
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded(result);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(t('files.errorUploadingFile'));
      setUploading(false);
    }
  };
  
  // Cancel upload
  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
  };
  
  // Render file type chip
  const renderFileTypeChip = (fileType) => {
    let icon = 'file';
    let color = colors.primary;
    
    if (fileType === 'application/pdf') {
      icon = 'file-pdf-box';
      color = '#FF5252';
    } else if (fileType === 'image/jpeg' || fileType === 'image/png') {
      icon = 'file-image';
      color = '#4CAF50';
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      icon = 'file-word';
      color = '#2196F3';
    }
    
    return (
      <Chip 
        icon={icon} 
        style={[styles.chip, { backgroundColor: color + '20' }]}
        textStyle={{ color }}
      >
        {allowedFileTypes[fileType]}
      </Chip>
    );
  };
  
  if (!canUpload) {
    return null; // Don't render anything if user doesn't have permission
  }
  
  return (
    <Card style={[styles.container, { backgroundColor: dark ? colors.surface : colors.background }]}>
      <Card.Title 
        title={t('files.uploadFile')} 
        subtitle={t('files.selectFileToUpload')}
        left={(props) => <IconButton {...props} icon="upload" />}
      />
      <Card.Content>
        <View style={styles.allowedTypesContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('files.allowedFileTypes')}:
          </Text>
          <View style={styles.chipContainer}>
            {Object.keys(allowedFileTypes).map((type) => (
              <View key={type} style={styles.chipWrapper}>
                {renderFileTypeChip(type)}
              </View>
            ))}
          </View>
        </View>
        
        {selectedFile && (
          <View style={styles.selectedFileContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t('files.selectedFile')}:
            </Text>
            <View style={[styles.fileInfoContainer, { backgroundColor: colors.surfaceVariant }]}>
              <IconButton
                icon={selectedFile.mimeType.includes('image') ? 'file-image' : 
                      selectedFile.mimeType.includes('pdf') ? 'file-pdf-box' : 
                      selectedFile.mimeType.includes('word') ? 'file-word' : 'file'}
                size={24}
                color={colors.primary}
              />
              <View style={styles.fileInfo}>
                <Text style={{ color: colors.text }} numberOfLines={1} ellipsizeMode="middle">
                  {selectedFile.name}
                </Text>
                <Text style={{ color: colors.onSurfaceVariant }}>
                  {formatBytes(selectedFile.size)}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={handleCancel}
                color={colors.error}
              />
            </View>
          </View>
        )}
        
        {uploading && (
          <View style={styles.progressContainer}>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              {t('files.uploading')}: {Math.round(uploadProgress * 100)}%
            </Text>
            <ProgressBar progress={uploadProgress} color={colors.primary} />
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        )}
      </Card.Content>
      
      <Card.Actions style={styles.actions}>
        {!selectedFile ? (
          <Button
            mode="contained"
            onPress={pickDocument}
            disabled={uploading}
            icon="file-upload"
          >
            {t('files.selectFile')}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => setConfirmDialogVisible(true)}
            disabled={uploading}
            icon="upload"
            loading={uploading}
          >
            {t('files.upload')}
          </Button>
        )}
      </Card.Actions>
      
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>{t('files.confirmUpload')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('files.confirmUploadMessage', { fileName: selectedFile?.name })}
            </Paragraph>
            <Paragraph style={{ marginTop: 8 }}>
              {t('files.fileCategory')}: {t(`files.categories.${category}`)}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={() => {
                setConfirmDialogVisible(false);
                handleUpload();
              }}
              mode="contained"
            >
              {t('files.upload')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  allowedTypesContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chipWrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
  chip: {
    height: 32,
  },
  selectedFileContainer: {
    marginBottom: 16,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 4,
  },
  progressContainer: {
    marginVertical: 16,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default FileUpload;