"use client";

import { create } from "zustand";

type LearningState = {
  celebration: string | null;
  setCelebration: (value: string | null) => void;
};

export const useLearningStore = create<LearningState>((set) => ({
  celebration: null,
  setCelebration: (value) => set({ celebration: value })
}));
