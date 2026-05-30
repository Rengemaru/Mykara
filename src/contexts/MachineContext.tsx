import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getCurrentMachine, setSessionMachine, type Machine } from '../lib/machine';

type MachineContextValue = {
  currentMachine: Machine;
  setCurrentMachine: (m: Machine) => Promise<void>;
  refresh: () => Promise<void>;
};

const MachineContext = createContext<MachineContextValue | null>(null);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const [currentMachine, setCurrentMachineState] = useState<Machine>('DAM');

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const m = await getCurrentMachine();
    setCurrentMachineState(m);
  }, []);

  const setCurrentMachine = useCallback(async (m: Machine) => {
    if (Platform.OS !== 'web') {
      await setSessionMachine(m);
    }
    setCurrentMachineState(m);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MachineContext.Provider value={{ currentMachine, setCurrentMachine, refresh }}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine(): MachineContextValue {
  const ctx = useContext(MachineContext);
  if (!ctx) throw new Error('useMachine must be used within MachineProvider');
  return ctx;
}
