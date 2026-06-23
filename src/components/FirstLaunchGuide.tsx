import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface Props {
  visible: boolean;
  onRegister: () => void;
  onLater: () => void;
}

export function FirstLaunchGuide({ visible, onRegister, onLater }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.emoji}>🎤</Text>
          <Text style={styles.title}>最初の曲を登録しましょう！</Text>
          <Text style={styles.body}>
            歌った曲と点数を記録すると、{'\n'}上達の推移がグラフで確認できるようになります。
          </Text>

          <View style={styles.steps}>
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepText}>右上の ＋ をタップして曲を登録</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.stepText}>曲カードの ✏️ で点数を記録</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
              <Text style={styles.stepText}>曲をタップして推移グラフを確認</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onRegister}>
            <Text style={styles.primaryBtnText}>＋ 最初の曲を登録する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onLater}>
            <Text style={styles.laterBtnText}>あとで</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  steps: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  stepText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  laterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  laterBtnText: {
    fontSize: 13,
    color: colors.text3,
  },
});
