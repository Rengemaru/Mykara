import { useCallback, useEffect, useRef, useState } from 'react';
import { searchMusic } from '../api/itunesSearch';
import { MusicSuggestion } from '../types';

export function useMusicSearch(query: string, debounceMs = 300) {
  const [suggestions, setSuggestions] = useState<MusicSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      const results = await searchMusic(query.trim(), abortRef.current.signal);
      setSuggestions(results);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsSearching(false);
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { suggestions, isSearching, clearSuggestions };
}
