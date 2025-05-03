import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  useTheme,
  Menu,
  Divider,
  Dialog,
  Portal,
  Button,
  Paragraph,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useTranslation } from '../../i18n';
import { useSelector } from 'react-redux';
import { deleteFile, downloadFile } from '../../services/fileService';
import { hasPermission } from '../../utils/permissionUtils';
import FileViewer from './FileViewer';
import config from '../../config';

const FileList = ({ files, onFileDeleted, onRefresh, loading }) => {
  const { colors, dark } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const user = useSelector(state => state.auth.user);
  const canDelete = hasPermission(user, 'residents', 'delete', 'files');
  const canDownload = hasPermission(user, 'residents', 'view', 'files');
  
  // Get file type display names from config
  const fileTypes = config.fileStorage.allowedFileTypes;
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle file selection
  const handleFilePress = (file) => {
    setSelectedFile(file);
    setFileViewerVisible(true);
  };
  
  // Handle file menu
  const handleFileMenu = (file) => {
    setSelectedFile(file);
    setMenuVisible(true);
  };
  
  // Handle file download
  const handleDownload = async () => {
    if (!selectedFile) return;
    
    try {
      await downloadFile(selectedFile.id);
      setMenuVisible(false);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  // Handle file delete
  const handleDelete = async () => {
    if (!selectedFile) return;
    
    try {
      setDeleting(true);
      await deleteFile(selectedFile.id);
      
      // Notify parent component
      if (onFileDeleted) {
        onFileDeleted(selectedFile.id);
      }
      
      setDeleting(false);
      setConfirmDeleteVisible(false);
    } catch (error) {
      console.error('Error deleting file:', error);
      setDeleting(false);
    }
  };
  
  // Render file icon based on type
  const renderFileIcon = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return 'file-pdf-box';
      case 'image/jpeg':
      case 'image/png':
        return 'file-image';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'file-word';
      default:
        return 'file';
    }
  };
  
  // Render file thumbnail
  const renderFileThumbnail = (file) => {
    if (file.mimeType.startsWith('image/') && file.thumbnailUrl) {
      return (
        <Image
          source={{ uri: file.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <View style={[styles.iconContainer, { backgroundColor: dark ? colors.surfaceVariant : colors.surface }]}>
        <IconButton
          icon={renderFileIcon(file.mimeType)}
          size={32}
          color={colors.primary}
        />
      </View>
    );
  };
  
  // Render file category chip
  const renderCategoryChip = (category) => {
    let icon = 'tag';
    let color = colors.primary;
    
    switch (category) {
      case 'contract':
        icon = 'file-document';
        color = '#4CAF50';
        break;
      case 'id':
        icon = 'card-account-details';
        color = '#2196F3';
        break;
      case 'ownership':
        icon = 'home';
        color = '#FF9800';
        break;
      default:
        break;
    }
    
    return (
      <Chip 
        icon={icon} 
        style={[styles.categoryChip, { backgroundColor: color + '20' }]}
        textStyle={{ color, fontSize: 12 }}
      >
        {t(`files.categories.${category}`)}
      </Chip>
    );
  };
  
  // Render file item
  const renderFileItem = ({ item }) => {
    return (
      <Card style={[styles.fileCard, { backgroundColor: dark ? colors.surface : colors.background }]}>
        <TouchableOpacity
          style={styles.fileCardContent}
          onPress={() => handleFilePress(item)}
          activeOpacity={0.7}
        >
          {renderFileThumbnail(item)}
          
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
              {item.name}
            </Text>
            
            <View style={styles.fileMetaRow}>
              <Text style={[styles.fileDate, { color: colors.onSurfaceVariant }]}>
                {formatDate(item.uploadedAt)}
              </Text>
              
              {renderCategoryChip(item.category)}
            </View>
          </View>
          
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => handleFileMenu(item)}
            color={colors.onSurface}
          />
        </TouchableOpacity>
      </Card>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('files.loading')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="file-outline"
          size={48}
          color={colors.onSurfaceVariant}
        />
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('files.noFilesUploaded')}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('files.attachedFiles')}
      </Text>
      
      {files && files.length > 0 ? (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.fileList}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={loading}
        />
      ) : (
        renderEmptyState()
      )}
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={{ marginTop: 40 }}
      >
        <Menu.Item
          icon="eye"
          onPress={() => {
            setMenuVisible(false);
            setFileViewerVisible(true);
          }}
          title={t('files.view')}
        />
        
        {canDownload && (
          <Menu.Item
            icon="download"
            onPress={handleDownload}
            title={t('files.download')}
          />
        )}
        
        <Divider />
        
        {canDelete && (
          <Menu.Item
            icon="delete"
            onPress={() => {
              setMenuVisible(false);
              setConfirmDeleteVisible(true);
            }}
            title={t('files.delete')}
            titleStyle={{ color: colors.error }}
          />
        )}
      </Menu>
      
      <Portal>
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
        >
          <Dialog.Title>{t('files.confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('files.confirmDeleteMessage', { fileName: selectedFile?.name })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={handleDelete}
              color={colors.error}
              loading={deleting}
              disabled={deleting}
            >
              {t('files.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <FileViewer
        file={selectedFile}
        visible={fileViewerVisible}
        onDismiss={() => setFileViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fileList: {
    paddingBottom: 16,
  },
  fileCard: {
    marginBottom: 12,
    elevation: 2,
  },
  fileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDate: {
    fontSize: 12,
    marginRight: 8,
  },
  categoryChip: {
    height: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

export default FileList;