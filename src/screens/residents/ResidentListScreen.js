import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  Card,
  Chip,
  FAB,
  Menu,
  Divider,
  IconButton,
  ActivityIndicator,
  useTheme,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchResidents,
  deleteResident,
  setFilters,
  setCurrentPage,
  clearError,
  clearSuccess,
} from '../../store/slices/residentsSlice';
import { useTranslation } from '../../i18n';
import PermissionGate from '../../components/common/PermissionGate';
import Toast from 'react-native-toast-message';

const ResidentListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const dispatch = useDispatch();
  
  const { 
    residents, 
    loading, 
    error, 
    success, 
    totalCount, 
    currentPage, 
    totalPages,
    filters,
  } = useSelector(state => state.residents);
  
  const { userRole } = useSelector(state => state.auth);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sectorMenuVisible, setSectorMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState(null);
  
  // Load residents on mount and when filters change
  useEffect(() => {
    loadResidents();
  }, [dispatch, filters, currentPage]);
  
  // Show toast on success or error
  useEffect(() => {
    if (success) {
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('residents.actionSuccess'),
      });
      dispatch(clearSuccess());
    }
    
    if (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error,
      });
      dispatch(clearError());
    }
  }, [success, error, dispatch]);
  
  const loadResidents = () => {
    dispatch(fetchResidents({
      search: filters.search,
      sector: filters.sector,
      type: filters.type,
      page: currentPage,
      limit: 50,
    }));
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchResidents({
      search: filters.search,
      sector: filters.sector,
      type: filters.type,
      page: 1,
    })).finally(() => {
      setRefreshing(false);
    });
  };
  
  const handleSearch = () => {
    dispatch(setFilters({ search: searchQuery }));
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    dispatch(setFilters({ search: '' }));
  };
  
  const handleSectorFilter = (sector) => {
    dispatch(setFilters({ sector }));
    setSectorMenuVisible(false);
  };
  
  const handleTypeFilter = (type) => {
    dispatch(setFilters({ type }));
    setTypeMenuVisible(false);
  };
  
  const clearFilters = () => {
    dispatch(setFilters({ search: '', sector: '', type: '' }));
    setSearchQuery('');
    setFilterMenuVisible(false);
  };
  
  const handleViewDetails = (resident) => {
    navigation.navigate('ResidentDetails', { id: resident.id, name: resident.name });
  };
  
  const handleEditResident = (resident) => {
    navigation.navigate('ResidentForm', { id: resident.id, isEditing: true });
  };
  
  const confirmDelete = (resident) => {
    setResidentToDelete(resident);
    setDeleteDialogVisible(true);
  };
  
  const handleDeleteResident = () => {
    if (residentToDelete) {
      dispatch(deleteResident(residentToDelete.id));
      setDeleteDialogVisible(false);
      setResidentToDelete(null);
    }
  };
  
  const handleAddResident = () => {
    navigation.navigate('ResidentForm', { isEditing: false });
  };
  
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      dispatch(setCurrentPage(page));
    }
  };
  
  const renderResidentItem = ({ item }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.residentName}>{item.name}</Text>
            
            <PermissionGate resource="residents" field="idNumber" action="view">
              <Text style={styles.residentDetails}>
                {t('residents.idNumber')}: {item.idNumber}
              </Text>
            </PermissionGate>
            
            <PermissionGate resource="residents" field="unitNumber" action="view">
              <Text style={styles.residentDetails}>
                {t('residents.unitNumber')}: {item.unitNumber}
              </Text>
            </PermissionGate>
          </View>
          
          <PermissionGate resource="residents" field="type" action="view">
            <Chip 
              mode="outlined" 
              style={{ 
                backgroundColor: item.type === 'owner' ? colors.primary + '20' : colors.accent + '20',
                borderColor: item.type === 'owner' ? colors.primary : colors.accent,
              }}
            >
              {item.type === 'owner' ? t('residents.owner') : t('residents.tenant')}
            </Chip>
          </PermissionGate>
        </View>
        
        <PermissionGate resource="residents" field="sector" action="view">
          <Text style={styles.residentDetails}>
            {t('residents.sector')}: {item.sector}
          </Text>
        </PermissionGate>
        
        <PermissionGate resource="residents" field="phone" action="view">
          <Text style={styles.residentDetails}>
            {t('residents.phone')}: {item.phone}
          </Text>
        </PermissionGate>
      </Card.Content>
      
      <Card.Actions>
        <PermissionGate resource="residents" action="view">
          <Button 
            mode="text" 
            onPress={() => handleViewDetails(item)}
            icon="eye"
          >
            {t('common.view')}
          </Button>
        </PermissionGate>
        
        <PermissionGate resource="residents" action="edit">
          <Button 
            mode="text" 
            onPress={() => handleEditResident(item)}
            icon="pencil"
          >
            {t('common.edit')}
          </Button>
        </PermissionGate>
        
        <PermissionGate resource="residents" action="delete">
          <Button 
            mode="text" 
            onPress={() => confirmDelete(item)}
            icon="delete"
            color={colors.error}
          >
            {t('common.delete')}
          </Button>
        </PermissionGate>
      </Card.Actions>
    </Card>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder={t('residents.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          onClearIconPress={clearSearch}
          style={styles.searchBar}
        />
        
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => setFilterMenuVisible(true)}
          color={
            filters.sector || filters.type 
              ? colors.primary 
              : colors.text
          }
        />
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={{ x: isRTL ? 20 : (Platform.OS === 'web' ? window.innerWidth - 70 : 300), y: 60 }}
        >
          <Menu.Item
            title={t('residents.filterBySector')}
            onPress={() => {
              setFilterMenuVisible(false);
              setSectorMenuVisible(true);
            }}
            right={() => filters.sector ? <Text style={{ color: colors.primary }}>{filters.sector}</Text> : null}
          />
          <Menu.Item
            title={t('residents.filterByType')}
            onPress={() => {
              setFilterMenuVisible(false);
              setTypeMenuVisible(true);
            }}
            right={() => filters.type ? <Text style={{ color: colors.primary }}>{filters.type}</Text> : null}
          />
          <Divider />
          <Menu.Item
            title={t('residents.clearFilters')}
            onPress={clearFilters}
          />
        </Menu>
        
        <Menu
          visible={sectorMenuVisible}
          onDismiss={() => setSectorMenuVisible(false)}
          anchor={{ x: isRTL ? 20 : (Platform.OS === 'web' ? window.innerWidth - 70 : 300), y: 60 }}
        >
          {['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5'].map((sector) => (
            <Menu.Item
              key={sector}
              title={sector}
              onPress={() => handleSectorFilter(sector)}
            />
          ))}
        </Menu>
        
        <Menu
          visible={typeMenuVisible}
          onDismiss={() => setTypeMenuVisible(false)}
          anchor={{ x: isRTL ? 20 : (Platform.OS === 'web' ? window.innerWidth - 70 : 300), y: 60 }}
        >
          <Menu.Item
            title={t('residents.owner')}
            onPress={() => handleTypeFilter('owner')}
          />
          <Menu.Item
            title={t('residents.tenant')}
            onPress={() => handleTypeFilter('tenant')}
          />
        </Menu>
      </View>
      
      {loading && residents.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={residents}
            renderItem={renderResidentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('residents.noResidentsFound')}</Text>
              </View>
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.pagination}>
                  <Button
                    mode="text"
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    icon="chevron-left"
                  >
                    {t('common.previous')}
                  </Button>
                  
                  <Text style={styles.paginationText}>
                    {t('common.pageInfo', { current: currentPage, total: totalPages })}
                  </Text>
                  
                  <Button
                    mode="text"
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    icon="chevron-right"
                    contentStyle={{ flexDirection: 'row-reverse' }}
                  >
                    {t('common.next')}
                  </Button>
                </View>
              ) : null
            }
          />
          
          <PermissionGate resource="residents" action="create">
            <FAB
              style={[styles.fab, { backgroundColor: colors.primary }]}
              icon="plus"
              onPress={handleAddResident}
              color="#fff"
            />
          </PermissionGate>
        </>
      )}
      
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>{t('residents.confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('residents.deleteWarning', { name: residentToDelete?.name })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleDeleteResident} color={colors.error}>
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  residentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  residentDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paginationText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ResidentListScreen;
