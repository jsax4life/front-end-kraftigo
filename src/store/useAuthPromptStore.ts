import { create } from 'zustand';

interface AuthPromptState {
  isOpen: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
}

export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  isOpen: false,
  openPrompt: () => set({ isOpen: true }),
  closePrompt: () => set({ isOpen: false }),
}));
