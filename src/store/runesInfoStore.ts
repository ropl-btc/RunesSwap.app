import { create } from 'zustand';

import { type RuneInfo as OrdiscanRuneInfo } from '@/types/ordiscan';

/**
 * State definition for the Runes information store.
 */
interface RunesInfoState {
  /** Currently selected Rune information. */
  selectedRuneInfo: OrdiscanRuneInfo | null;
  /** Current search query for Runes. */
  runeSearchQuery: string;
  /** Sets the selected Rune information. */
  setSelectedRuneInfo: (runeInfo: OrdiscanRuneInfo | null) => void;
  /** Sets the Rune search query. */
  setRuneSearchQuery: (query: string) => void;
}

/**
 * Zustand store for managing global Rune information state.
 * Handles selected Rune details and search query persistence across components.
 */
export const useRunesInfoStore = create<RunesInfoState>((set) => ({
  selectedRuneInfo: null,
  runeSearchQuery: '',
  setSelectedRuneInfo: (runeInfo) => set({ selectedRuneInfo: runeInfo }),
  setRuneSearchQuery: (query) => set({ runeSearchQuery: query }),
}));

// Typed selectors to avoid broad subscriptions in components
export const selectSelectedRuneInfo = (state: RunesInfoState) =>
  state.selectedRuneInfo;
export const selectRuneSearchQuery = (state: RunesInfoState) =>
  state.runeSearchQuery;
export const selectSetSelectedRuneInfo = (state: RunesInfoState) =>
  state.setSelectedRuneInfo;
export const selectSetRuneSearchQuery = (state: RunesInfoState) =>
  state.setRuneSearchQuery;
