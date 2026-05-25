import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { insertScore, updateScore } from '../db/scores';
import { ScoreRow, SongWithStats } from '../types';

const MAX_SCORE = 100;

interface Props {
  visible: boolean;
  song: SongWithStats;
  editingScore: ScoreRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScoreBottomSheet({ visible, song, editingScore, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingScore) {
        setInput(String(editingScore.score));
        setDate(editingScore.scored_at);
      } else {
        setInput('');
        setDate(todayString());
      }
    }
  }, [visible, editingScore]);

  function todayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function handleKey(key: string) {
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (input.includes('.')) return;
      setInput((prev) => prev + '.');
      return;
    }
    const next = input + key;
    if (parseFloat(next) > MAX_SCORE) return;
    if (next.includes('.') && next.split('.')[1].length > 3) return;
    setInput(next);
  }

  function handleSave() {
    const score = parseFloat(input);
    if (isNaN(score) || score < 0 || score > MAX_SCORE) {
      Alert.alert('入力エラー', '0〜100の数値を入力してください');
      return;
    }
    if (!date) {
      Alert.alert('入力エラー', '日付を入力してください');
      return;
    }
    if (Platform.OS === 'web') {
      onSaved();
      return;
    }
    try {
      if (editingScore) {
        updateScore(editingScore.id, score, date);
      } else {
        insertScore(song.id, score, date);
      }
      onSaved();
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '保存に失敗しました');
    }
  }

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>
          {editingScore ? '点数を編集する' : '点数を記録する'}
        </Text>
        <Text style={styles.subtitle}>
          {song.title} ／ {song.artist || '—'}
          {editingScore ? ` ／ ${editingScore.scored_at}` : ''}
        </Text>

        {/* スコア表示 */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreNum}>{input || '0'}</Text>
          <Text style={styles.scoreUnit}>点</Text>
        </View>

        {/* テンキー */}
        <View style={styles.numpad}>
          {KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.numKey}
              onPress={() => handleKey(key)}
            >
              <Text style={[styles.numKeyText, key === '⌫' && styles.delKeyText]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 日付 */}
        <View style={styles.dateRow}>
          <Text>📅</Text>
          <View style={styles.dateVal}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        {/* 保存ボタン */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {editingScore ? '変更を保存する' : '記録する'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text2,
    marginBottom: 13,
  },
  scoreDisplay: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 9,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  scoreNum: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 28,
    color: colors.accent,
    letterSpacing: -0.4,
  },
  scoreUnit: {
    fontSize: 12,
    color: colors.text2,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 9,
  },
  numKey: {
    width: '30%',
    flexGrow: 1,
    height: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  delKeyText: {
    fontSize: 13,
    color: colors.text2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 11,
  },
  dateVal: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
