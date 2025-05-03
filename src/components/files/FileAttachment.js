import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  useTheme,
  Divider,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from '../../i18n';
import fileService from '../../services/fileService';
import FilePreview from './FilePreview';
import PermissionAware from '../permissions/PermissionAware';

const FileAttachment = ({
  recordId,
  files = [],
  onFileAdded,
  onFileDeleted,
  maxFiles = 10,
  userRole,
}) => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Check if user can upload/delete files
  const canUpload = ['admin', 'manager'].includes(userRole);
  const canDelete = ['admin', 'manager'].includes(userRole);
  
  const handlePickDocument = async () => {
    try {
      if (files.length >= maxFiles) {
        Alert.alert(
          t('files.maxFilesReached'),
          t('files.maxFilesReachedMessage', { max: maxFiles })
        );
        return;
      }
      
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        const file = {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || fileService.getFileType(result.name),
          size: result.size,
        };
        
        try {
          // Validate file
          fileService.validateFile(file);
          
          // Save file
          const savedFile = await fileService.saveFile(file, recordId);
          
          // Notify parent component
          if (onFileAdded) {
            onFileAdded(savedFile);
          }
        } catch (error) {
          Alert.alert(t('common.error'), error.message);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(t('common.error'), t('files.pickError'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteFile = (file) => {
    Alert.alert(
      t('files.deleteFile'),
      t('files.deleteFileConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await fileService.deleteFile(file.path);
              
              // Notify parent component
              if (onFileDeleted) {
                onFileDeleted(file.id);
              }
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert(t('common.error'), t('files.deleteError'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleViewFile = (file) => {
    setSelectedFile(file);
    setPreviewVisible(true);
  };
  
  const renderFileItem = ({ item }) => (
    <Card style={styles.fileCard} mode="outlined">
      <Card.Content style={styles.fileContent}>
        <View style={styles.fileInfo}>
          <IconButton
            icon={getFileIcon(item.type)}
            size={24}
            color={getFileColor(item.type, colors)}
          />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(item.size)} • {formatDate(item.uploadDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.fileActions}>
          <IconButton
            icon="eye"
            size={20}
            onPress={() => handleViewFile(item)}
          />
          
          <PermissionAware
            permissionKey="profile.documents.delete"
            fallback={null}
          >
            {canDelete && (
              <IconButton
                icon="delete"
                size={20}
                color={colors.error}
                onPress={() => handleDeleteFile(item)}
              />
            )}
          </PermissionAware>
        </View>
      </Card.Content>
    </Card>
  );
  
  // Helper functions
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return 'file-pdf-box';
    if (fileType.includes('image')) return 'file-image';
    if (fileType.includes('word')) return 'file-word';
    return 'file-document';
  };
  
  const getFileColor = (fileType, colors) => {
    if (fileType.includes('pdf')) return '#E44D26';
    if (fileType.includes('image')) return '#4CAF50';
    if (fileType.includes('word')) return '#2B579A';
    return colors.primary;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('files.attachments')}</Text>
        
        <PermissionAware
          permissionKey="profile.documents.upload"
          fallback={null}
        >
          {canUpload && (
            <Button
              mode="contained"
              icon="upload"
              onPress={handlePickDocument}
              disabled={loading || files.length >= maxFiles}
            >
              {t('files.upload')}
            </Button>
          )}
        </PermissionAware>
      </View>
      
      {loading && (
        <ActivityIndicator style={styles.loader} />
      )}
      
      {files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('files.noFiles')}</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.fileList}
        />
      )}
      
      {/* File Preview Modal */}
      <FilePreview
        file={selectedFile}
        visible={previewVisible}
        onDismiss={() => setPreviewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileList: {
    paddingBottom: 10,
  },
  fileCard: {
    marginVertical: 4,
  },
  fileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.7,
  },
  loader: {
    margin: 20,
  },
});

export default FileAttachment;