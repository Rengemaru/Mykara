import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { getDb } from '../../src/db/client';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  function handleDeleteAll() {
    Alert.alert(
      'すべてのデータを削除',
      'この操作は取り消せません。曲・スコア・タブのすべてが削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            try {
              const db = getDb();
              db.execSync('DELETE FROM scores;');
              db.execSync('DELETE FROM song_tabs;');
              db.execSync('DELETE FROM songs;');
              db.execSync('DELETE FROM tabs;');
              Alert.alert('完了', 'すべてのデータを削除しました');
            } catch (e) {
              console.error(e);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* タブ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>タブ管理</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/tabs')}
            >
              <View style={[styles.rowIcon, styles.iconPurple]}>
                <Text style={styles.rowEmoji}>🗂</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>タブを編集する</Text>
                <Text style={styles.rowSub}>追加・名前変更・削除・並び替え</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>データ管理</Text>
          <View style={styles.group}>
            <TouchableOpacity style={styles.row} onPress={handleDeleteAll}>
              <View style={[styles.rowIcon, styles.iconRed]}>
                <Text style={styles.rowEmoji}>🗑</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.dangerLabel}>すべてのデータを削除</Text>
                <Text style={styles.rowSub}>この操作は取り消せません</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>アプリ情報</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, styles.iconGray]}>
                <Text style={styles.rowEmoji}>ℹ️</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>バージョン</Text>
              </View>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
            <View style={[styles.row, styles.rowNoBorder]}>
              <View style={[styles.rowIcon, styles.iconGray]}>
                <Text style={styles.rowEmoji}>📄</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>プライバシーポリシー</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 18,
    gap: 20,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.text3,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingLeft: 2,
  },
  group: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconPurple: { backgroundColor: colors.accentSoft },
  iconRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  iconGray: { backgroundColor: colors.surface2 },
  rowEmoji: { fontSize: 15 },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  rowSub: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  rowChevron: {
    fontSize: 18,
    color: colors.text3,
  },
  rowValue: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
    marginRight: 4,
  },
  dangerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.red,
  },
});
