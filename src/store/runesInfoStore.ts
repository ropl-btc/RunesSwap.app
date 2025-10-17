import { create } from 'zustand';

import { type RuneInfo as OrdiscanRuneInfo } from '@/types/ordiscan';

interface RunesInfoState {
  selectedRuneInfo: OrdiscanRuneInfo | null;
  runeSearchQuery: string;
  setSelectedRuneInfo: (runeInfo: OrdiscanRuneInfo | null) => void;
  setRuneSearchQuery: (query: string) => void;
}

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
