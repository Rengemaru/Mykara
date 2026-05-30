import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { getDefaultMachine, setDefaultMachine, type Machine } from '../../src/lib/machine';
import { useMachine } from '../../src/contexts/MachineContext';

export default function MachineSelectScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useMachine();
  const [selected, setSelected] = useState<Machine>('DAM');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    getDefaultMachine().then(setSelected);
  }, []);

  const handleSelect = useCallback(async (m: Machine) => {
    setSelected(m);
    if (Platform.OS !== 'web') {
      await setDefaultMachine(m);
      await refresh();
    }
  }, [refresh]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>デフォルト機種</Text>
          <Text style={styles.subtitle}>点数記録時に最初に選ばれる機種</Text>
        </View>
      </View>

      <View style={styles.machineList}>
        {(['DAM', 'JOYSOUND'] as Machine[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.machineCard,
              selected === m && (m === 'DAM' ? styles.machineCardDam : styles.machineCardJoy),
            ]}
            onPress={() => handleSelect(m)}
          >
            <View style={[styles.machineIcon, m === 'DAM' ? styles.iconDam : styles.iconJoy]}>
              <Text style={[styles.machineIconText, { color: m === 'DAM' ? colors.dam : colors.joy }]}>
                {m === 'DAM' ? 'D' : 'J'}
              </Text>
            </View>
            <View style={styles.machineText}>
              <Text style={styles.machineName}>{m}</Text>
              <Text style={styles.machineDesc}>
                {m === 'DAM' ? '第一興商の精密採点' : 'エクシングの分析採点マスター'}
              </Text>
            </View>
            <View style={[
              styles.machineCheck,
              selected === m ? (m === 'DAM' ? styles.checkDam : styles.checkJoy) : styles.checkUnchecked,
            ]}>
              {selected === m && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sessionNote}>
        <Text style={styles.sessionNoteTitle}>💡 セッション記憶について</Text>
        <Text style={styles.sessionNoteText}>
          点数記録時に機種を変更すると、その日のうちは変更後の機種が記憶されます。
          翌日にアプリを開くと、ここで設定したデフォルト機種に戻ります。
        </Text>
      </View>
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    paddingBottom: 16,
  },
  backBtn: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: colors.text2,
    marginTop: 2,
  },
  machineList: {
    paddingHorizontal: 18,
    gap: 10,
  },
  machineCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  machineCardDam: {
    borderColor: colors.dam,
    backgroundColor: colors.damSoft,
  },
  machineCardJoy: {
    borderColor: colors.joy,
    backgroundColor: colors.joySoft,
  },
  machineIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDam: { backgroundColor: colors.damSoft },
  iconJoy: { backgroundColor: colors.joySoft },
  machineIconText: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 18,
  },
  machineText: { flex: 1 },
  machineName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  machineDesc: {
    fontSize: 10,
    color: colors.text2,
    marginTop: 2,
  },
  machineCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDam: { backgroundColor: colors.dam },
  checkJoy: { backgroundColor: colors.joy },
  checkUnchecked: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkMark: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  sessionNote: {
    margin: 18,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 11,
  },
  sessionNoteTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionNoteText: {
    fontSize: 11,
    color: colors.text2,
    lineHeight: 18,
  },
});
