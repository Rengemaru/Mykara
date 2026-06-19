import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { ScoreBottomSheet } from '../../src/components/ScoreBottomSheet';
import { SongCard } from '../../src/components/SongCard';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { deleteSong } from '../../src/db/songs';
import { getSessionSummary, SessionSummary } from '../../src/db/scores';
import { useSongs, ALL_TAB } from '../../src/hooks/useSongs';
import { useTabs } from '../../src/hooks/useTabs';
import { SongWithStats } from '../../src/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { tabsWithAll, reload: reloadTabs } = useTabs();
  const [activeTabId, setActiveTabId] = useState<number>(ALL_TAB.id);
  const [query, setQuery] = useState('');
  const { songs, loading, error, reload } = useSongs(activeTabId);

  useFocusEffect(
    useCallback(() => {
      reloadTabs();
      reload();
      reloadSessionSummary();
    }, [reloadTabs, reload])
  );
  const [scoringSong, setScoringsSong] = useState<SongWithStats | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const swipeRefs = useRef<Map<number, Swipeable | null>>(new Map());

  function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function reloadSessionSummary() {
    if (Platform.OS === 'web') return;
    try {
      const summary = getSessionSummary(todayString());
      setSessionSummary(summary.song_count > 0 ? summary : null);
    } catch (e) {
      console.error(e);
    }
  }

  function closeOtherSwipeables(currentId: number) {
    swipeRefs.current.forEach((ref, id) => {
      if (id !== currentId) ref?.close();
    });
  }

  function handleDeleteSong(song: SongWithStats) {
    Alert.alert(
      '曲を削除',
      `「${song.title}」を削除しますか？\nスコア履歴もすべて削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') { reload(); return; }
            try {
              deleteSong(song.id);
              reload();
            } catch (e) {
              console.error(e);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }

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
        <Text style={styles.appTitle}>歌帳</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => router.push('/help')}
            accessibilityLabel="ヘルプ"
            accessibilityRole="button"
          >
            <Text style={styles.helpBtnText}>？</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/song/new')}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* セッションサマリーバナー */}
      {sessionSummary && (
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionBannerText}>
            🎤 今日の記録
          </Text>
          <View style={styles.sessionBannerStats}>
            <Text style={styles.sessionBannerNum}>{sessionSummary.song_count}</Text>
            <Text style={styles.sessionBannerLabel}>曲</Text>
          </View>
          {sessionSummary.pb_count > 0 && (
            <>
              <Text style={styles.sessionBannerSep}>／</Text>
              <Text style={styles.sessionBannerPbIcon}>🎉</Text>
              <View style={styles.sessionBannerStats}>
                <Text style={styles.sessionBannerNum}>{sessionSummary.pb_count}</Text>
                <Text style={styles.sessionBannerLabel}>曲ベスト更新</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* タブ横スクロール */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabsWithAll.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveTabId(tab.id)}
            >
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                {tab.name}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {tab.song_count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
          <EmptyState emoji="⚠️" title="データを取得できませんでした" subtitle={error} />
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <EmptyState emoji="⏳" title="読み込み中..." />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            emoji="🎵"
            title={query ? '検索結果がありません' : 'まだ曲がありません'}
            subtitle={query ? '別のキーワードで試してみてください' : 'カラオケで歌った曲を追加しましょう'}
            actionLabel={query ? undefined : '＋ 最初の曲を追加する'}
            onAction={query ? undefined : () => router.push('/song/new')}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Swipeable
              ref={(ref) => { swipeRefs.current.set(item.id, ref); }}
              onSwipeableWillOpen={() => closeOtherSwipeables(item.id)}
              overshootRight={false}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <TouchableOpacity
                    style={[styles.swipeBtn, styles.swipeEditBtn]}
                    onPress={() => {
                      swipeRefs.current.get(item.id)?.close();
                      router.push(`/song/new?songId=${item.id}`);
                    }}
                  >
                    <Text style={styles.swipeBtnText}>✏️{'\n'}編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swipeBtn, styles.swipeDeleteBtn]}
                    onPress={() => {
                      swipeRefs.current.get(item.id)?.close();
                      handleDeleteSong(item);
                    }}
                  >
                    <Text style={styles.swipeBtnText}>🗑{'\n'}削除</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              <TouchableOpacity onPress={() => router.push(`/song/${item.id}`)}>
                <SongCard
                  song={item}
                  onPressRecord={() => setScoringsSong(item)}
                />
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      )}

      {scoringSong && (
        <ScoreBottomSheet
          visible={!!scoringSong}
          song={scoringSong}
          editingScore={null}
          onClose={() => setScoringsSong(null)}
          onSaved={() => {
            setScoringsSong(null);
            reload();
            reloadSessionSummary();
          }}
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
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  helpBtnText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '700',
    lineHeight: 20,
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
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sessionBannerText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    marginRight: 4,
  },
  sessionBannerStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  sessionBannerNum: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
  },
  sessionBannerLabel: {
    fontSize: 10,
    color: colors.accent,
  },
  sessionBannerSep: {
    fontSize: 10,
    color: colors.text3,
    marginHorizontal: 2,
  },
  sessionBannerPbIcon: {
    fontSize: 12,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 6,
    alignItems: 'center',
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
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(91, 76, 245, 0.15)',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text3,
    lineHeight: 14,
  },
  tabBadgeTextActive: {
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
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 8,
    gap: 6,
  },
  swipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    minWidth: 64,
    paddingHorizontal: 10,
  },
  swipeEditBtn: {
    backgroundColor: colors.accent,
  },
  swipeDeleteBtn: {
    backgroundColor: colors.red,
    marginRight: 0,
  },
  swipeBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
