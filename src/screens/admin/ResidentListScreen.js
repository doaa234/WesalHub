import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  FAB,
  Chip,
  Menu,
  Divider,
  IconButton,
  Dialog,
  Portal,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import { 
  fetchResidents, 
  deleteResident,
  setFilter,
  clearFilters,
} from '../../store/slices/residentSlice';
import Toast from '../../components/common/Toast';

const ResidentListScreen = () => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    residents, 
    loading, 
    error, 
    filters,
    totalPages,
    currentPage,
  } = useSelector(state => state.residents);
  const { userRole } = useSelector(state => state.auth);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  
  // Check permissions based on user role
  const canCreate = ['admin', 'dataEntry'].includes(userRole);
  const canUpdate = ['admin', 'manager', 'dataEntry'].includes(userRole);
  const canDelete = ['admin', 'manager'].includes(userRole);
  
  // Fetch residents on component mount and when filters change
  useFocusEffect(
    useCallback(() => {
      loadResidents();
    }, [dispatch, filters, currentPage])
  );
  
  const loadResidents = async () => {
    try {
      await dispatch(fetchResidents({ page: currentPage, ...filters })).unwrap();
    } catch (error) {
      showToast(error.message || t('residents.errorLoading'), 'error');
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadResidents();
    setRefreshing(false);
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      dispatch(setFilter({ search: searchQuery }));
    } else {
      dispatch(setFilter({ search: null }));
    }
  };
  
  const handleFilter = (filterType, value) => {
    dispatch(setFilter({ [filterType]: value }));
    setFilterMenuVisible(false);
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    dispatch(clearFilters());
    setFilterMenuVisible(false);
  };
  
  const handleViewDetails = (resident) => {
    navigation.navigate('ResidentDetails', { residentId: resident.id });
  };
  
  const handleEditResident = (resident) => {
    navigation.navigate('ResidentForm', { residentId: resident.id });
  };
  
  const handleDeleteResident = (resident) => {
    setSelectedResident(resident);
    setDeleteDialogVisible(true);
  };
  
  const confirmDelete = async () => {
    try {
      await dispatch(deleteResident(selectedResident.id)).unwrap();
      showToast(t('residents.deleteSuccess'), 'success');
      setDeleteDialogVisible(false);
      setSelectedResident(null);
    } catch (error) {
      showToast(error.message || t('residents.deleteError'), 'error');
    }
  };
  
  const handleAddResident = () => {
    navigation.navigate('ResidentForm');
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };
  
  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };
  
  const renderResidentItem = ({ item }) => {
    return (
      <Card 
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => handleViewDetails(item)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Title style={{ color: colors.text }}>{item.fullName}</Title>
              <Chip 
                style={{ backgroundColor: item.type === 'resident' ? colors.primary : colors.accent }}
                textStyle={{ color: '#fff' }}
              >
                {item.type === 'resident' ? t('residents.resident') : t('residents.tenant')}
              </Chip>
            </View>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('residents.idNumber')}:</Text>
              <Text style={styles.detailValue}>{item.idNumber}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('residents.unitNumber')}:</Text>
              <Text style={styles.detailValue}>{item.unitNumber}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('residents.sector')}:</Text>
              <Text style={styles.detailValue}>{item.sector}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('residents.phone')}:</Text>
              <Text style={styles.detailValue}>{item.phoneNumber}</Text>
            </View>
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="text" 
            onPress={() => handleViewDetails(item)}
            icon="eye"
          >
            {t('common.view')}
          </Button>
          
          {canUpdate && (
            <Button 
              mode="text" 
              onPress={() => handleEditResident(item)}
              icon="pencil"
            >
              {t('common.edit')}
            </Button>
          )}
          
          {canDelete && (
            <Button 
              mode="text" 
              onPress={() => handleDeleteResident(item)}
              icon="delete"
              color={colors.error}
            >
              {t('common.delete')}
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };
  
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          {Object.keys(filters).length > 0 
            ? t('residents.noResultsFound') 
            : t('residents.noResidents')}
        </Text>
        {Object.keys(filters).length > 0 && (
          <Button 
            mode="outlined" 
            onPress={clearAllFilters}
            style={{ marginTop: 16 }}
          >
            {t('residents.clearFilters')}
          </Button>
        )}
      </View>
    );
  };
  
  const renderFilterChips = () => {
    const activeFilters = [];
    
    if (filters.search) {
      activeFilters.push(
        <Chip 
          key="search" 
          style={styles.filterChip}
          onClose={() => handleFilter('search', null)}
        >
          {t('residents.search')}: {filters.search}
        </Chip>
      );
    }
    
    if (filters.type) {
      activeFilters.push(
        <Chip 
          key="type" 
          style={styles.filterChip}
          onClose={() => handleFilter('type', null)}
        >
          {filters.type === 'resident' ? t('residents.resident') : t('residents.tenant')}
        </Chip>
      );
    }
    
    if (filters.sector) {
      activeFilters.push(
        <Chip 
          key="sector" 
          style={styles.filterChip}
          onClose={() => handleFilter('sector', null)}
        >
          {t('residents.sector')}: {filters.sector}
        </Chip>
      );
    }
    
    return activeFilters.length > 0 ? (
      <View style={styles.filterChipsContainer}>
        {activeFilters}
        {activeFilters.length > 1 && (
          <Button 
            compact 
            mode="text" 
            onPress={clearAllFilters}
          >
            {t('residents.clearAll')}
          </Button>
        )}
      </View>
    ) : null;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('residents.title')}
        </Text>
        
        <View style={styles.searchFilterContainer}>
          <Searchbar
            placeholder={t('residents.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchBar}
          />
          
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setFilterMenuVisible(true)}
            color={Object.keys(filters).length > 0 ? colors.primary : colors.text}
          />
          
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.filterMenu}
          >
            <Menu.Item
              title={t('residents.filterByType')}
              disabled
              titleStyle={{ fontWeight: 'bold' }}
            />
            <Menu.Item
              title={t('residents.resident')}
              onPress={() => handleFilter('type', 'resident')}
              leadingIcon="home"
            />
            <Menu.Item
              title={t('residents.tenant')}
              onPress={() => handleFilter('type', 'tenant')}
              leadingIcon="key"
            />
            <Divider />
            
            <Menu.Item
              title={t('residents.filterBySector')}
              disabled
              titleStyle={{ fontWeight: 'bold' }}
            />
            <Menu.Item
              title={t('residents.sectorA')}
              onPress={() => handleFilter('sector', 'A')}
            />
            <Menu.Item
              title={t('residents.sectorB')}
              onPress={() => handleFilter('sector', 'B')}
            />
            <Menu.Item
              title={t('residents.sectorC')}
              onPress={() => handleFilter('sector', 'C')}
            />
            <Divider />
            
            <Menu.Item
              title={t('residents.clearFilters')}
              onPress={clearAllFilters}
              leadingIcon="filter-remove"
            />
          </Menu>
        </View>
      </View>
      
      {renderFilterChips()}
      
      {loading && residents.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={residents}
          renderItem={renderResidentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
      
      {canCreate && (
        <FAB
          style={[styles.fab, { backgroundColor: colors.primary }]}
          icon="plus"
          onPress={handleAddResident}
          label={t('residents.addNew')}
          extended
        />
      )}
      
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>{t('residents.deleteConfirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('residents.deleteConfirmMessage', { name: selectedResident?.fullName })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={confirmDelete} color={colors.error}>
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterMenu: {
    marginTop: 40,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ResidentListScreen;