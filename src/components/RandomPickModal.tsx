import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { truncateTabName } from '../constants/tabConfig';

export type RandomScope = {
  id: number;
  name: string;
  song_count: number;
};

interface Props {
  visible: boolean;
  scopes: RandomScope[];
  onPick: (scopeId: number) => void;
  onClose: () => void;
}

export function RandomPickModal({ visible, scopes, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />
          <Text style={styles.emoji}>🎲</Text>
          <Text style={styles.title}>ランダムに選曲</Text>
          <Text style={styles.subtitle}>どの中から選びますか？</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {scopes.map((scope) => {
              const disabled = scope.song_count === 0;
              return (
                <TouchableOpacity
                  key={scope.id}
                  style={[styles.option, disabled && styles.optionDisabled]}
                  onPress={() => !disabled && onPick(scope.id)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionName, disabled && styles.optionTextDisabled]}>
                    {truncateTabName(scope.name)}
                  </Text>
                  <Text style={[styles.optionCount, disabled && styles.optionTextDisabled]}>
                    {scope.song_count}曲
                  </Text>
                  <Text style={[styles.optionDice, disabled && styles.optionTextDisabled]}>🎲</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text2,
    marginBottom: 16,
  },
  list: {
    width: '100%',
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionCount: {
    fontSize: 12,
    color: colors.text3,
    fontFamily: fonts.monoMedium,
  },
  optionTextDisabled: {
    color: colors.text3,
  },
  optionDice: {
    fontSize: 16,
  },
});
