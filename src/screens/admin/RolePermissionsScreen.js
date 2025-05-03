import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Divider,
  Switch,
  Button,
  Checkbox,
  RadioButton,
  Chip,
  Searchbar,
  ActivityIndicator,
  useTheme,
  Portal,
  Dialog,
  Paragraph,
  Snackbar,
  List,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import Header from '../../components/common/Header';
import { 
  fetchRoles, 
  fetchPermissions, 
  updateRolePermissions,
  updateFieldVisibility,
  updateFileAccess,
} from '../../store/slices/adminSlice';

const RolePermissionsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { roles, permissions, fieldDefinitions, fileTypes, loading, error } = useSelector(state => state.admin);
  
  // Local state
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [permissionChanges, setPermissionChanges] = useState({});
  const [fieldVisibilityChanges, setFieldVisibilityChanges] = useState({});
  const [fileAccessChanges, setFileAccessChanges] = useState({});
  const [activeTab, setActiveTab] = useState('fields');
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  
  // Load roles and permissions on mount
  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);
  
  // Filter permissions when search query changes
  useEffect(() => {
    if (!permissions) return;
    
    const filtered = permissions.filter(permission => 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredPermissions(filtered);
  }, [searchQuery, permissions]);
  
  // Reset changes when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setPermissionChanges({});
      setFieldVisibilityChanges({});
      setFileAccessChanges({});
    }
  }, [selectedRole]);
  
  // Handle role selection
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRoleMenuVisible(false);
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    setPermissionChanges(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId] ? true : !prev[permissionId]
    }));
  };
  
  // Handle field visibility change
  const handleFieldVisibilityChange = (fieldId, action) => {
    setFieldVisibilityChanges(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [action]: !prev[fieldId]?.[action]
      }
    }));
  };
  
  // Handle file access change
  const handleFileAccessChange = (fileTypeId, action) => {
    setFileAccessChanges(prev => ({
      ...prev,
      [fileTypeId]: {
        ...prev[fileTypeId],
        [action]: !prev[fileTypeId]?.[action]
      }
    }));
  };
  
  // Save changes
  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    
    try {
      // Update role permissions
      if (Object.keys(permissionChanges).length > 0) {
        await dispatch(updateRolePermissions({
          roleId: selectedRole.id,
          permissions: permissionChanges,
        })).unwrap();
      }
      
      // Update field visibility
      if (Object.keys(fieldVisibilityChanges).length > 0) {
        await dispatch(updateFieldVisibility({
          roleId: selectedRole.id,
          fieldVisibility: fieldVisibilityChanges,
        })).unwrap();
      }
      
      // Update file access
      if (Object.keys(fileAccessChanges).length > 0) {
        await dispatch(updateFileAccess({
          roleId: selectedRole.id,
          fileAccess: fileAccessChanges,
        })).unwrap();
      }
      
      // Reset changes
      setPermissionChanges({});
      setFieldVisibilityChanges({});
      setFileAccessChanges({});
      
      showSnackbar(t('admin.changesSaved'));
    } catch (error) {
      showSnackbar(error.message || t('admin.errorSavingChanges'));
    }
  };
  
  // Show confirmation dialog
  const showConfirmDialog = () => {
    setConfirmDialogVisible(true);
  };
  
  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Check if permission is granted for the selected role
  const isPermissionGranted = (permissionId) => {
    if (!selectedRole) return false;
    
    // Check if there's a pending change
    if (permissionChanges[permissionId] !== undefined) {
      return permissionChanges[permissionId];
    }
    
    // Check current permissions
    return selectedRole.permissions?.includes(permissionId) || false;
  };
  
  // Check if field action is allowed for the selected role
  const isFieldActionAllowed = (fieldId, action) => {
    if (!selectedRole) return false;
    
    // Check if there's a pending change
    if (fieldVisibilityChanges[fieldId]?.[action] !== undefined) {
      return fieldVisibilityChanges[fieldId][action];
    }
    
    // Check current field visibility
    return selectedRole.fieldVisibility?.[fieldId]?.[action] || false;
  };
  
  // Check if file action is allowed for the selected role
  const isFileActionAllowed = (fileTypeId, action) => {
    if (!selectedRole) return false;
    
    // Check if there's a pending change
    if (fileAccessChanges[fileTypeId]?.[action] !== undefined) {
      return fileAccessChanges[fileTypeId][action];
    }
    
    // Check current file access
    return selectedRole.fileAccess?.[fileTypeId]?.[action] || false;
  };
  
  // Render loading state
  if (loading && !roles) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('admin.rolePermissions')} showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('admin.rolePermissions')} showBackButton onBackPress={() => navigation.goBack()} />
      
      <View style={styles.roleSelector}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('admin.selectRole')}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.roleButton,
            { borderColor: colors.primary }
          ]}
          onPress={() => setRoleMenuVisible(true)}
        >
          <Text style={{ color: colors.primary }}>
            {selectedRole ? selectedRole.name : t('admin.selectRolePrompt')}
          </Text>
          <IconButton icon="chevron-down" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <Menu
          visible={roleMenuVisible}
          onDismiss={() => setRoleMenuVisible(false)}
          anchor={{ x: 20, y: 140 }}
        >
          {roles?.map(role => (
            <Menu.Item
              key={role.id}
              title={role.name}
              onPress={() => handleSelectRole(role)}
            />
          ))}
        </Menu>
      </View>
      
      {selectedRole ? (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'fields' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab('fields')}
            >
              <Text style={{ color: activeTab === 'fields' ? colors.primary : colors.text }}>
                {t('admin.fieldVisibility')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'files' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab('files')}
            >
              <Text style={{ color: activeTab === 'files' ? colors.primary : colors.text }}>
                {t('admin.fileAccess')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'permissions' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab('permissions')}
            >
              <Text style={{ color: activeTab === 'permissions' ? colors.primary : colors.text }}>
                {t('admin.generalPermissions')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'fields' && (
            <ScrollView style={styles.contentContainer}>
              <Text style={[styles.sectionDescription, { color: colors.text }]}>
                {t('admin.fieldVisibilityDescription')}
              </Text>
              
              {fieldDefinitions?.map(field => (
                <Card key={field.id} style={styles.card} mode="outlined">
                  <Card.Content>
                    <View style={styles.fieldHeader}>
                      <View>
                        <Text style={[styles.fieldName, { color: colors.text }]}>
                          {field.displayName}
                        </Text>
                        <Text style={styles.fieldDescription}>
                          {field.description}
                        </Text>
                      </View>
                      <Chip mode="outlined">
                        {field.entity}
                      </Chip>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.view')}</Text>
                      <Switch
                        value={isFieldActionAllowed(field.id, 'view')}
                        onValueChange={() => handleFieldVisibilityChange(field.id, 'view')}
                        color={colors.primary}
                      />
                    </View>
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.edit')}</Text>
                      <Switch
                        value={isFieldActionAllowed(field.id, 'edit')}
                        onValueChange={() => handleFieldVisibilityChange(field.id, 'edit')}
                        color={colors.primary}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
          
          {activeTab === 'files' && (
            <ScrollView style={styles.contentContainer}>
              <Text style={[styles.sectionDescription, { color: colors.text }]}>
                {t('admin.fileAccessDescription')}
              </Text>
              
              {fileTypes?.map(fileType => (
                <Card key={fileType.id} style={styles.card} mode="outlined">
                  <Card.Content>
                    <View style={styles.fieldHeader}>
                      <View>
                        <Text style={[styles.fieldName, { color: colors.text }]}>
                          {fileType.name}
                        </Text>
                        <Text style={styles.fieldDescription}>
                          {fileType.description}
                        </Text>
                      </View>
                      <Chip mode="outlined">
                        {fileType.category}
                      </Chip>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.view')}</Text>
                      <Switch
                        value={isFileActionAllowed(fileType.id, 'view')}
                        onValueChange={() => handleFileAccessChange(fileType.id, 'view')}
                        color={colors.primary}
                      />
                    </View>
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.upload')}</Text>
                      <Switch
                        value={isFileActionAllowed(fileType.id, 'upload')}
                        onValueChange={() => handleFileAccessChange(fileType.id, 'upload')}
                        color={colors.primary}
                      />
                    </View>
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.download')}</Text>
                      <Switch
                        value={isFileActionAllowed(fileType.id, 'download')}
                        onValueChange={() => handleFileAccessChange(fileType.id, 'download')}
                        color={colors.primary}
                      />
                    </View>
                    
                    <View style={styles.permissionRow}>
                      <Text style={{ color: colors.text }}>{t('admin.delete')}</Text>
                      <Switch
                        value={isFileActionAllowed(fileType.id, 'delete')}
                        onValueChange={() => handleFileAccessChange(fileType.id, 'delete')}
                        color={colors.primary}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
          
          {activeTab === 'permissions' && (
            <ScrollView style={styles.contentContainer}>
              <Text style={[styles.sectionDescription, { color: colors.text }]}>
                {t('admin.generalPermissionsDescription')}
              </Text>
              
              <Searchbar
                placeholder={t('admin.searchPermissions')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />
              
              {filteredPermissions?.map(permission => (
                <Card key={permission.id} style={styles.card} mode="outlined">
                  <Card.Content>
                    <View style={styles.permissionRow}>
                      <View>
                        <Text style={[styles.permissionName, { color: colors.text }]}>
                          {permission.name}
                        </Text>
                        <Text style={styles.permissionDescription}>
                          {permission.description}
                        </Text>
                      </View>
                      <Switch
                        value={isPermissionGranted(permission.id)}
                        onValueChange={() => handlePermissionToggle(permission.id)}
                        color={colors.primary}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setPermissionChanges({});
                setFieldVisibilityChanges({});
                setFileAccessChanges({});
              }}
              style={styles.actionButton}
              disabled={
                Object.keys(permissionChanges).length === 0 &&
                Object.keys(fieldVisibilityChanges).length === 0 &&
                Object.keys(fileAccessChanges).length === 0
              }
            >
              {t('common.cancel')}
            </Button>
            
            <Button
              mode="contained"
              onPress={showConfirmDialog}
              style={styles.actionButton}
              disabled={
                Object.keys(permissionChanges).length === 0 &&
                Object.keys(fieldVisibilityChanges).length === 0 &&
                Object.keys(fileAccessChanges).length === 0
              }
            >
              {t('common.save')}
            </Button>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('admin.selectRoleToManage')}
          </Text>
        </View>
      )}
      
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>{t('admin.confirmChanges')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('admin.confirmChangesDescription')}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={() => {
                setConfirmDialogVisible(false);
                handleSaveChanges();
              }}
              mode="contained"
            >
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
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
    </View>
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
  roleSelector: {
    padding: 16,
    paddingBottom: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  searchBar: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default RolePermissionsScreen;