import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProCard from '../components/ProCard';
import { colors, fonts, spacing, radius, typography } from '../config/theme';

const { width } = Dimensions.get('window');
const TABLET_WIDTH = 768;
const isTablet = width >= TABLET_WIDTH;
const numColumns = isTablet ? 2 : 1;

const CATEGORIES = [
  { id: 'all', label: 'All', craft: null },
  { id: 'chef', label: 'Chefs', craft: 'Chef' },
  { id: 'bartender', label: 'Bartenders', craft: 'Bartender' },
  { id: 'musician', label: 'Musicians', craft: 'Musician' },
  { id: 'photographer', label: 'Photographers', craft: 'Photographer' },
  { id: 'florist', label: 'Florists', craft: 'Florist' },
  { id: 'planner', label: 'Planners', craft: 'Event Planner' },
];

const BrowseScreen = ({ navigation }) => {
  const [pros, setPros] = useState([]);
  const [filteredPros, setFilteredPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load pros from Firestore
  const loadPros = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'pro'),
        where('profileComplete', '==', true),
        orderBy('rating', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const prosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPros(prosData);
      applyFilters(prosData, selectedCategory, searchQuery);
    } catch (error) {
      console.error('Error loading pros:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Apply filters and search
  const applyFilters = useCallback((prosData, category, query) => {
    let filtered = [...prosData];

    // Filter by category
    if (category !== 'all') {
      const selectedCategoryObj = CATEGORIES.find((c) => c.id === category);
      if (selectedCategoryObj?.craft) {
        filtered = filtered.filter((pro) => pro.craft === selectedCategoryObj.craft);
      }
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (pro) =>
          (pro.displayName && pro.displayName.toLowerCase().includes(lowerQuery)) ||
          (pro.firstName && pro.firstName.toLowerCase().includes(lowerQuery)) ||
          (pro.lastName && pro.lastName.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredPros(filtered);
  }, []);

  // Initial load
  useEffect(() => {
    loadPros();
  }, [loadPros]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryId) => {
      setSelectedCategory(categoryId);
      applyFilters(pros, categoryId, searchQuery);
    },
    [pros, searchQuery, applyFilters]
  );

  // Handle search
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      applyFilters(pros, selectedCategory, query);
    },
    [pros, selectedCategory, applyFilters]
  );

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPros();
    setRefreshing(false);
  }, [loadPros]);

  // Navigate to pro profile
  const handleProPress = useCallback(
    (pro) => {
      navigation.navigate('ProProfile', { proId: pro.id });
    },
    [navigation]
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() => handleCategorySelect(item.id)}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item.id && styles.categoryChipTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderProCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <ProCard
        pro={{
          ...item,
          name: item.displayName || `${item.firstName} ${item.lastName}`,
          craft: item.craft || 'Professional',
          rate: item.hourlyRate || 0,
        }}
        onPress={() => handleProPress(item)}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.gray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Category Filter */}
      <Text style={styles.filterLabel}>Filter by craft</Text>
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryChip}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons
        name="magnify"
        size={48}
        color={colors.gray}
        style={styles.emptyStateIcon}
      />
      <Text style={styles.emptyStateTitle}>No professionals found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Try adjusting your filters or search terms
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.black,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.darkCard,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      borderRadius: radius.medium,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
      height: 48,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: colors.white,
      ...typography.body,
      fontFamily: fonts.sans,
      paddingVertical: spacing.md,
    },
    filterLabel: {
      ...typography.bodySmall,
      color: colors.gray,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    categoryList: {
      paddingRight: spacing.lg,
      gap: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.darkCard,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      marginRight: spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: colors.red,
      borderColor: colors.red,
    },
    categoryChipText: {
      ...typography.bodySmall,
      color: colors.white,
      fontWeight: '600',
    },
    categoryChipTextActive: {
      color: colors.whitePure,
    },
    cardContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xxxl,
    },
    emptyStateIcon: {
      marginBottom: spacing.lg,
      opacity: 0.5,
    },
    emptyStateTitle: {
      ...typography.h4,
      color: colors.white,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      ...typography.body,
      color: colors.gray,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    listContainer: {
      paddingHorizontal: numColumns === 2 ? spacing.md : 0,
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPros}
        renderItem={renderProCard}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.red}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          filteredPros.length === 0 && { flexGrow: 1 },
          styles.listContainer,
        ]}
      />
    </View>
  );
};

export default BrowseScreen;
