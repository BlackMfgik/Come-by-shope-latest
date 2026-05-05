import { create } from "zustand";

interface SearchState {
  liveQuery: string;
  setLiveQuery: (q: string) => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  liveQuery: "",
  setLiveQuery: (q) => set({ liveQuery: q }),
  clearQuery: () => set({ liveQuery: "" }),
}));
