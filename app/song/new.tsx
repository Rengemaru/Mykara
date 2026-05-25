import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyStepper } from '../../src/components/KeyStepper';
import { colors } from '../../src/constants/colors';
import { insertSong, updateSong, getSongById } from '../../src/db/songs';
import { insertTab } from '../../src/db/tabs';
import { syncTabs } from '../../src/db/songTabs';
import { useTabs } from '../../src/hooks/useTabs';
import { MOCK_SONGS } from '../../src/db/mockData';

export default function SongFormScreen() {
  const insets = useSafeAreaInsets();
  const { songId } = useLocalSearchParams<{ songId?: string }>();
  const isEdit = !!songId;

  const { tabs, reload: reloadTabs } = useTabs();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [keyOffset, setKeyOffset] = useState<number | null>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [newTabModalVisible, setNewTabModalVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    try {
      const song = Platform.OS === 'web'
        ? MOCK_SONGS.find(s => s.id === Number(songId)) ?? null
        : getSongById(Number(songId));
      if (!song) return;
      setTitle(song.title);
      setArtist(song.artist);
      setKeyOffset(song.key_offset);
      setSelectedTabIds(song.tabs.map((t) => t.id));
    } catch (e) {
      console.error(e);
    }
  }, [songId, isEdit]);

  function toggleTab(tabId: number) {
    setSelectedTabIds((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  }

  function handleAddNewTab() {
    setNewTabName('');
    setNewTabModalVisible(true);
  }

  function handleConfirmNewTab() {
    if (!newTabName.trim()) return;
    if (Platform.OS === 'web') { setNewTabModalVisible(false); return; }
    try {
      const newId = insertTab(newTabName.trim());
      reloadTabs();
      setSelectedTabIds((prev) => [...prev, newId]);
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'タブの作成に失敗しました');
    }
    setNewTabModalVisible(false);
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('入力エラー', '曲名を入力してください');
      return;
    }
    if (Platform.OS === 'web') { router.back(); return; }
    try {
      if (isEdit) {
        updateSong(Number(songId), title.trim(), artist.trim(), keyOffset);
        syncTabs(Number(songId), selectedTabIds);
      } else {
        const newId = insertSong(title.trim(), artist.trim(), keyOffset);
        syncTabs(newId, selectedTabIds);
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '保存に失敗しました');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? '曲を編集' : '曲を追加'}</Text>
        </View>

        {/* フォーム */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 曲名 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>曲名</Text>
            <TextInput
              style={styles.fieldInput}
              value={title}
              onChangeText={setTitle}
              placeholder="曲名を入力"
              placeholderTextColor={colors.text3}
              returnKeyType="next"
            />
          </View>

          {/* アーティスト名 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>アーティスト名</Text>
            <TextInput
              style={styles.fieldInput}
              value={artist}
              onChangeText={setArtist}
              placeholder="アーティスト名を入力"
              placeholderTextColor={colors.text3}
              returnKeyType="done"
            />
          </View>

          {/* タブ選択 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>タブ（カテゴリ）</Text>
            <View style={styles.tabSelector}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabOption,
                    selectedTabIds.includes(tab.id) && styles.tabOptionSelected,
                  ]}
                  onPress={() => toggleTab(tab.id)}
                >
                  <Text style={[
                    styles.tabOptionText,
                    selectedTabIds.includes(tab.id) && styles.tabOptionTextSelected,
                  ]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.tabOptionAdd} onPress={handleAddNewTab}>
                <Text style={styles.tabOptionAddText}>＋ 新規作成</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* キーステッパー */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>キー（音域）</Text>
            <KeyStepper value={keyOffset} onChange={setKeyOffset} />
          </View>
        </ScrollView>

        {/* 新規タブ作成モーダル */}
        <Modal visible={newTabModalVisible} transparent animationType="fade" onRequestClose={() => setNewTabModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setNewTabModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>新しいタブを作成</Text>
            <TextInput
              style={styles.modalInput}
              value={newTabName}
              onChangeText={setNewTabName}
              placeholder="タブ名を入力"
              placeholderTextColor={colors.text3}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmNewTab}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNewTabModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirmNewTab}>
                <Text style={styles.modalConfirmText}>作成</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 保存ボタン */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              {isEdit ? '変更を保存する' : '曲を追加する'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.text2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  form: {
    paddingHorizontal: 18,
    gap: 16,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.text2,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: colors.text,
  },
  tabSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabOptionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(91, 76, 245, 0.25)',
  },
  tabOptionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
  },
  tabOptionTextSelected: {
    color: colors.accent,
  },
  tabOptionAdd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  tabOptionAddText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text3,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    position: 'absolute',
    top: '40%',
    left: 32,
    right: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    color: colors.text2,
  },
  modalConfirm: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
