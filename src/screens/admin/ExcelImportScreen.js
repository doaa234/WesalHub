import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  useTheme,
  Portal,
  Dialog,
  Paragraph,
  Snackbar,
  DataTable,
  ProgressBar,
  Divider,
  Chip,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from '../../i18n';
import Header from '../../components/common/Header';
import { uploadExcelFile, validateExcelFile, importExcelData, downloadExcelTemplate } from '../../services/adminService';

const ExcelImportScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  
  // Handle file selection
  const handleSelectFile = async () => {
    try {
      setError(null);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('excel.fileTooLarge'));
        showSnackbar(t('excel.fileTooLarge'));
        return;
      }
      
      setSelectedFile(file);
      setValidationResult(null);
      setPreviewData(null);
    } catch (err) {
      console.error('Error picking document:', err);
      setError(t('excel.errorPickingFile'));
      showSnackbar(t('excel.errorPickingFile'));
    }
  };
  
  // Validate selected file
  const handleValidateFile = async () => {
    if (!selectedFile) return;
    
    try {
      setValidating(true);
      setProgress(0);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
      
      // Upload and validate file
      const result = await validateExcelFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted / 100);
      });
      
      setValidationResult(result);
      setPreviewData(result.preview);
      setValidating(false);
      
      // Show success or error message
      if (result.valid) {
        showSnackbar(t('excel.validationSuccess'));
      } else {
        showSnackbar(t('excel.validationErrors'));
      }
    } catch (err) {
      console.error('Error validating file:', err);
      setError(err.message || t('excel.validationFailed'));
      showSnackbar(t('excel.validationFailed'));
      setValidating(false);
    }
  };
  
  // Import data
  const handleImportData = async () => {
    if (!selectedFile || !validationResult || !validationResult.valid) return;
    
    try {
      setImporting(true);
      setProgress(0);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
      
      // Import data
      const result = await importExcelData(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted / 100);
      });
      
      setImporting(false);
      setConfirmDialogVisible(false);
      
      // Show success message
      showSnackbar(t('excel.importSuccess', { 
        imported: result.imported,
        total: result.total
      }));
      
      // Reset state
      setSelectedFile(null);
      setValidationResult(null);
      setPreviewData(null);
    } catch (err) {
      console.error('Error importing data:', err);
      setError(err.message || t('excel.importFailed'));
      showSnackbar(t('excel.importFailed'));
      setImporting(false);
      setConfirmDialogVisible(false);
    }
  };
  
  // Download template
  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      
      await downloadExcelTemplate();
      
      setDownloadingTemplate(false);
      showSnackbar(t('excel.templateDownloaded'));
    } catch (err) {
      console.error('Error downloading template:', err);
      setError(err.message || t('excel.templateDownloadFailed'));
      showSnackbar(t('excel.templateDownloadFailed'));
      setDownloadingTemplate(false);
    }
  };
  
  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Render validation errors
  const renderValidationErrors = () => {
    if (!validationResult || !validationResult.errors || validationResult.errors.length === 0) {
      return null;
    }
    
    return (
      <Card style={styles.errorCard}>
        <Card.Title 
          title={t('excel.validationErrors')} 
          left={(props) => <IconButton {...props} icon="alert-circle" color={colors.error} />}
        />
        <Card.Content>
          <ScrollView style={styles.errorList}>
            {validationResult.errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                {error.type === 'missing_headers' ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error.message}
                  </Text>
                ) : (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {t('excel.rowError', { row: error.row })}: 
                    {error.errors.map(e => ` ${e.message}`).join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  // Render data preview
  const renderDataPreview = () => {
    if (!previewData || !previewData.headers || !previewData.rows) {
      return null;
    }
    
    return (
      <Card style={styles.previewCard}>
        <Card.Title 
          title={t('excel.dataPreview')} 
          subtitle={t('excel.previewSubtitle', { count: previewData.totalRows })}
        />
        <Card.Content>
          <ScrollView horizontal>
            <DataTable>
              <DataTable.Header>
                {previewData.headers.map((header, index) => (
                  <DataTable.Title key={index}>{header}</DataTable.Title>
                ))}
              </DataTable.Header>
              
              {previewData.rows.map((row, rowIndex) => (
                <DataTable.Row key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <DataTable.Cell key={cellIndex}>
                      {cell !== undefined && cell !== null ? String(cell) : ''}
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('excel.importTitle')} />
      
      <ScrollView style={styles.content}>
        <Card style={styles.uploadCard}>
          <Card.Title 
            title={t('excel.uploadExcel')} 
            subtitle={t('excel.uploadInstructions')}
            left={(props) => <IconButton {...props} icon="file-excel" color={colors.primary} />}
          />
          <Card.Content>
            <View style={styles.fileSection}>
              {selectedFile ? (
                <View style={styles.selectedFile}>
                  <IconButton icon="file-excel" size={24} color={colors.primary} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Text>
                  </View>
                  <IconButton 
                    icon="close" 
                    size={20} 
                    onPress={() => setSelectedFile(null)}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.uploadArea, { borderColor: colors.primary }]} 
                  onPress={handleSelectFile}
                >
                  <IconButton icon="upload" size={32} color={colors.primary} />
                  <Text style={{ color: colors.primary }}>
                    {t('excel.selectFile')}
                  </Text>
                  <Text style={styles.fileHint}>
                    {t('excel.fileHint')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {(validating || importing) && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {validating ? t('excel.validating') : t('excel.importing')}
                </Text>
                <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleValidateFile}
                disabled={!selectedFile || validating || importing}
                loading={validating}
                style={styles.button}
              >
                {t('excel.validateButton')}
              </Button>
              
              <Button
                mode="contained"
                onPress={() => setConfirmDialogVisible(true)}
                disabled={!validationResult || !validationResult.valid || importing}
                loading={importing}
                style={[styles.button, { backgroundColor: validationResult?.valid ? colors.success : colors.disabled }]}
              >
                {t('excel.importButton')}
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {renderValidationErrors()}
        {renderDataPreview()}
        
        <Card style={styles.templateCard}>
          <Card.Title 
            title={t('excel.downloadTemplate')} 
            subtitle={t('excel.templateInstructions')}
          />
          <Card.Content>
            <Button
              mode="outlined"
              icon="download"
              onPress={handleDownloadTemplate}
              loading={downloadingTemplate}
            >
              {t('excel.downloadTemplateButton')}
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.helpCard}>
          <Card.Title 
            title={t('excel.helpTitle')} 
            left={(props) => <IconButton {...props} icon="help-circle" color={colors.primary} />}
          />
          <Card.Content>
            <Text style={styles.helpText}>{t('excel.helpText')}</Text>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.helpSectionTitle}>{t('excel.requiredFields')}</Text>
            <View style={styles.chipContainer}>
              <Chip style={styles.chip} mode="outlined">{t('excel.fieldName')}</Chip>
              <Chip style={styles.chip} mode="outlined">{t('excel.fieldUnitNumber')}</Chip>
              <Chip style={styles.chip} mode="outlined">{t('excel.fieldRole')}</Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.helpSectionTitle}>{t('excel.supportedLanguages')}</Text>
            <View style={styles.chipContainer}>
              <Chip style={styles.chip} mode="outlined">English</Chip>
              <Chip style={styles.chip} mode="outlined">Arabic</Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>{t('excel.confirmImport')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('excel.confirmImportMessage', { count: previewData?.totalRows || 0 })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleImportData} loading={importing}>
              {t('excel.confirmButton')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: t('common.dismiss'),
          onPress: () => setSnackbarVisible(false),
        }}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  uploadCard: {
    marginBottom: 16,
  },
  fileSection: {
    marginVertical: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileHint: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    fontWeight: 'bold',
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorCard: {
    marginVertical: 16,
  },
  errorList: {
    maxHeight: 200,
  },
  errorItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255,0,0,0.05)',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 14,
  },
  previewCard: {
    marginVertical: 16,
  },
  templateCard: {
    marginVertical: 16,
  },
  helpCard: {
    marginVertical: 16,
    marginBottom: 32,
  },
  helpText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  helpSectionTitle: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  }
});

export default ExcelImportScreen;