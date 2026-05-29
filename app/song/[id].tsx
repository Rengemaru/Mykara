import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { deleteScore } from '../../src/db/scores';
import { useSongDetail } from '../../src/hooks/useSongDetail';
import { ScoreRow } from '../../src/types';
import { ScoreBottomSheet } from '../../src/components/ScoreBottomSheet';
import { ScoreChart } from '../../src/components/ScoreChart';
import { EmptyState } from '../../src/components/EmptyState';

export default function SongDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const songId = Number(id);
  const { song, scores, loading, error, reload } = useSongDetail(songId);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingScore, setEditingScore] = useState<ScoreRow | null>(null);

  function handleDeleteScore(score: ScoreRow) {
    Alert.alert(
      'スコアを削除',
      `${score.scored_at}  ${score.score.toFixed(1)}点\nこの記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') return;
            try {
              deleteScore(score.id);
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

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState emoji="⏳" title="読み込み中..." />
      </View>
    );
  }

  if (error || !song) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          emoji="⚠️"
          title="データを取得できませんでした"
          subtitle={error ?? '曲が見つかりません'}
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const diff = scores.length >= 2
    ? scores[0].score - scores[1].score
    : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.headerArtist} numberOfLines={1}>{song.artist || '—'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/song/new?songId=${songId}`)}>
          <Text style={styles.editBtn}>編集</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={scores}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* 最高スコアカード */}
            <LinearGradient
              colors={['#ede9fe', '#f5f3ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bestCard}
            >
              <View>
                <Text style={styles.bestLabel}>最高スコア</Text>
                <Text style={styles.bestValue}>
                  {song.best_score != null && song.best_score > 0 ? song.best_score.toFixed(1) : '—'}
                </Text>
                {diff != null && (
                  <Text style={[styles.bestDiff, { color: diff >= 0 ? colors.green : colors.red }]}>
                    {diff >= 0 ? `↑ ${diff.toFixed(1)}pt` : `↓ ${Math.abs(diff).toFixed(1)}pt`} 前回比
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.bestLabel}>記録回数</Text>
                <Text style={styles.countValue}>{song.score_count}回</Text>
              </View>
            </LinearGradient>

            {/* グラフ（スコアが2件以上あるとき表示） */}
            {scores.length >= 2 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionLabel}>点数推移</Text>
                <ScoreChart scores={scores} />
              </View>
            )}

            {/* メモ */}
            {song.memo ? (
              <View style={styles.memoCard}>
                <Text style={styles.memoLabel}>メモ</Text>
                <ScrollView scrollEnabled={false}>
                  <Text style={styles.memoText}>{song.memo}</Text>
                </ScrollView>
              </View>
            ) : null}

            {/* 履歴セクションラベル */}
            {scores.length > 0 && (
              <Text style={styles.sectionLabel}>記録履歴</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🎤"
            title="まだスコアが記録されていません"
            subtitle="「点数を記録する」から最初のスコアを追加しましょう"
          />
        }
        renderItem={({ item }) => (
          <HistoryRow
            score={item}
            onEdit={() => {
              setEditingScore(item);
              setSheetVisible(true);
            }}
            onDelete={() => handleDeleteScore(item)}
          />
        )}
      />

      {/* 記録ボタン */}
      <View style={[styles.recordBtnWrap, { bottom: insets.bottom + 60 }]}>
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => {
            setEditingScore(null);
            setSheetVisible(true);
          }}
        >
          <Text style={styles.recordBtnText}>🎤 点数を記録する</Text>
        </TouchableOpacity>
      </View>

      {/* ボトムシート */}
      <ScoreBottomSheet
        visible={sheetVisible}
        song={song}
        editingScore={editingScore}
        onClose={() => setSheetVisible(false)}
        onSaved={() => {
          setSheetVisible(false);
          reload();
        }}
      />
    </View>
  );
}

interface HistoryRowProps {
  score: ScoreRow;
  onEdit: () => void;
  onDelete: () => void;
}

function HistoryRow({ score, onEdit, onDelete }: HistoryRowProps) {
  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeEditBtn]}
            onPress={onEdit}
          >
            <Text style={styles.swipeBtnText}>✏️{'\n'}編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeDeleteBtn]}
            onPress={onDelete}
          >
            <Text style={styles.swipeBtnText}>🗑{'\n'}削除</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.historyRow}>
        <Text style={styles.historyDate}>{score.scored_at}</Text>
        <Text style={styles.historyScore}>{score.score.toFixed(1)}</Text>
      </View>
    </Swipeable>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  backBtn: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  headerArtist: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 1,
  },
  editBtn: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 18,
  },
  listHeader: {
    gap: 13,
    paddingBottom: 8,
  },
  bestCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.15)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bestValue: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 34,
    color: colors.accent,
    lineHeight: 40,
  },
  bestDiff: {
    fontSize: 11,
    marginTop: 3,
  },
  countValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 22,
    color: colors.text,
    textAlign: 'right',
  },
  chartSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  memoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  memoLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  memoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontFamily: fonts.monoRegular,
    fontSize: 11,
    color: colors.text3,
    width: 52,
  },
  historyScore: {
    fontFamily: fonts.monoMedium,
    flex: 1,
    fontSize: 14,
    color: colors.accent,
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
    borderRadius: 10,
    minWidth: 56,
    paddingHorizontal: 8,
  },
  swipeEditBtn: {
    backgroundColor: colors.accent,
  },
  swipeDeleteBtn: {
    backgroundColor: colors.red,
  },
  swipeBtnText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  recordBtnWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
  },
  recordBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  recordBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
