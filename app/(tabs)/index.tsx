import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SongCard } from '../../src/components/SongCard';
import { colors } from '../../src/constants/colors';
import { useSongs, ALL_TAB } from '../../src/hooks/useSongs';
import { useTabs } from '../../src/hooks/useTabs';
import { TabRow } from '../../src/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { tabsWithAll } = useTabs();
  const [activeTabId, setActiveTabId] = useState<number>(ALL_TAB.id);
  const [query, setQuery] = useState('');
  const { songs, loading, error } = useSongs(activeTabId);

  const filtered = useMemo(() => {
    if (!query.trim()) return songs;
    const q = query.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [songs, query]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>
          My<Text style={styles.appTitleAccent}>Kara</Text>
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/song/new')}
        >
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* タブ横スクロール */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {(tabsWithAll as readonly (typeof ALL_TAB | TabRow)[]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabPill, activeTabId === tab.id && styles.tabPillActive]}
            onPress={() => setActiveTabId(tab.id)}
          >
            <Text style={[styles.tabPillText, activeTabId === tab.id && styles.tabPillTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 検索バー */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="曲名・アーティスト名で検索"
          placeholderTextColor={colors.text3}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* 曲一覧 */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>まだ曲がありません</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => router.push('/song/new')}
          >
            <Text style={styles.emptyAddBtnText}>＋ 最初の曲を追加する</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/song/${item.id}`)}>
              <SongCard
                song={item}
                onPressRecord={() => {
                  // Phase 2-6で実装
                }}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  appTitleAccent: {
    color: colors.accent,
  },
  addBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: {
    fontSize: 20,
    color: colors.white,
    lineHeight: 24,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(91, 76, 245, 0.2)',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
  },
  tabPillTextActive: {
    color: colors.accent,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchIcon: {
    fontSize: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 100,
    gap: 7,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text2,
  },
  emptyAddBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text3,
  },
  errorText: {
    fontSize: 14,
    color: colors.red,
  },
});
