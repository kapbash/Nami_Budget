import { storage } from './storage';

type HistoryState = {
  categories: any[];
  expenses: any[];
  deposits: any[];
  timestamp: number;
};

const MAX_HISTORY_SIZE = 50;
const HISTORY_KEY = 'transaction_history';
const CURRENT_INDEX_KEY = 'history_current_index';

export const historyManager = {
  async saveState(categories: any[], expenses: any[], deposits: any[]): Promise<void> {
    try {
      const history = await storage.getItem<HistoryState[]>(HISTORY_KEY) || [];
      const currentIndex = await storage.getItem<number>(CURRENT_INDEX_KEY) || -1;

      const newHistory = history.slice(0, currentIndex + 1);

      const newState: HistoryState = {
        categories,
        expenses,
        deposits,
        timestamp: Date.now(),
      };

      newHistory.push(newState);

      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      await storage.setItem(HISTORY_KEY, newHistory);
      await storage.setItem(CURRENT_INDEX_KEY, newHistory.length - 1);
    } catch (error) {
      console.error('Error saving history state:', error);
    }
  },

  async undo(): Promise<{ categories: any[]; expenses: any[]; deposits: any[] } | null> {
    try {
      const history = await storage.getItem<HistoryState[]>(HISTORY_KEY) || [];
      const currentIndex = await storage.getItem<number>(CURRENT_INDEX_KEY) || -1;

      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        await storage.setItem(CURRENT_INDEX_KEY, newIndex);

        const previousState = history[newIndex];
        return {
          categories: previousState.categories,
          expenses: previousState.expenses,
          deposits: previousState.deposits,
        };
      }

      return null;
    } catch (error) {
      console.error('Error undoing:', error);
      return null;
    }
  },

  async redo(): Promise<{ categories: any[]; expenses: any[]; deposits: any[] } | null> {
    try {
      const history = await storage.getItem<HistoryState[]>(HISTORY_KEY) || [];
      const currentIndex = await storage.getItem<number>(CURRENT_INDEX_KEY) || -1;

      if (currentIndex < history.length - 1) {
        const newIndex = currentIndex + 1;
        await storage.setItem(CURRENT_INDEX_KEY, newIndex);

        const nextState = history[newIndex];
        return {
          categories: nextState.categories,
          expenses: nextState.expenses,
          deposits: nextState.deposits,
        };
      }

      return null;
    } catch (error) {
      console.error('Error redoing:', error);
      return null;
    }
  },

  async canUndo(): Promise<boolean> {
    try {
      const currentIndex = await storage.getItem<number>(CURRENT_INDEX_KEY) || -1;
      return currentIndex > 0;
    } catch (error) {
      console.error('Error checking undo:', error);
      return false;
    }
  },

  async canRedo(): Promise<boolean> {
    try {
      const history = await storage.getItem<HistoryState[]>(HISTORY_KEY) || [];
      const currentIndex = await storage.getItem<number>(CURRENT_INDEX_KEY) || -1;
      return currentIndex < history.length - 1;
    } catch (error) {
      console.error('Error checking redo:', error);
      return false;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await storage.removeItem(HISTORY_KEY);
      await storage.removeItem(CURRENT_INDEX_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  async initializeHistory(categories: any[], expenses: any[], deposits: any[]): Promise<void> {
    try {
      const history = await storage.getItem<HistoryState[]>(HISTORY_KEY);

      if (!history || history.length === 0) {
        const initialState: HistoryState = {
          categories,
          expenses,
          deposits,
          timestamp: Date.now(),
        };

        await storage.setItem(HISTORY_KEY, [initialState]);
        await storage.setItem(CURRENT_INDEX_KEY, 0);
      }
    } catch (error) {
      console.error('Error initializing history:', error);
    }
  }
};
