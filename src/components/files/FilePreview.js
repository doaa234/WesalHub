import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from '../../i18n';
import fileService from '../../services/fileService';

const { width, height } = Dimensions.get('window');

const FilePreview = ({ file, visible, onDismiss }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (visible && file) {
      loadFile();
    } else {
      setFileContent(null);
      setError(null);
    }
  }, [visible, file]);
  
  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get decrypted file content
      const content = await fileService.getFile(file.path);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file:', error);
      setError(t('files.previewError'));
    } finally {
      setLoading(false);
    }
  };
  
  const renderPreview = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>{t('files.loading')}</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    
    if (!fileContent) {
      return null;
    }
    
    // Handle different file types
    if (file.type.includes('image')) {
      return (
        <ScrollView 
          style={styles.previewContainer}
          contentContainerStyle={styles.imageContainer}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <Image
            source={{ uri: `data:${file.type};base64,${fileContent}` }}
            style={styles.image}
            resizeMode="contain"
          />
        </ScrollView>
      );
    }
    
    if (file.type.includes('pdf')) {
      return (
        <WebView
          source={{
            uri: `data:application/pdf;base64,${fileContent}`,
          }}
          style={styles.webView}
        />
      );
    }
    
    if (file.type.includes('word')) {
      return (
        <View style={styles.unsupportedContainer}>
          <IconButton icon="file-word" size={40} color="#2B579A" />
          <Text style={styles.unsupportedText}>
            {t('files.docxPreviewUnsupported')}
          </Text>
          <Button
            mode="contained"
            onPress={() => {/* Download functionality */}}
            style={styles.downloadButton}
          >
            {t('files.download')}
          </Button>
        </View>
      );
    }
    
    // Fallback for unsupported file types
    return (
      <View style={styles.unsupportedContainer}>
        <IconButton icon="file-document" size={40} color={colors.primary} />
        <Text style={styles.unsupportedText}>
          {t('files.previewUnsupported')}
        </Text>
      </View>
    );
  };
  
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.background }
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file?.name || ''}
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
          />
        </View>
        
        {renderPreview()}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    height: height * 0.8,
    width: width * 0.9,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  previewContainer: {
    flex: 1,
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 10,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  downloadButton: {
    marginTop: 10,
  },
});

export default FilePreview;