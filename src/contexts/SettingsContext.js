import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_BEEP_ID } from '../utils/beepSynth';
import { getItem, setItem } from '../utils/secureStorage';

const BEEP_SOUND_KEY = 'beep_sound_id';

export const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [beepSoundId, setBeepSoundIdState] = useState(DEFAULT_BEEP_ID);

  useEffect(() => {
    (async () => {
      const stored = await getItem(BEEP_SOUND_KEY);
      if (stored) setBeepSoundIdState(stored);
    })();
  }, []);

  const setBeepSoundId = useCallback((id) => {
    setBeepSoundIdState(id);
    setItem(BEEP_SOUND_KEY, id);
  }, []);

  const value = useMemo(() => ({ beepSoundId, setBeepSoundId }), [beepSoundId, setBeepSoundId]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
