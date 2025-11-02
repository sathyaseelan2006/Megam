import { HistoryEntry } from '../types';

const HISTORY_KEY = 'megamo_search_history';
const MAX_HISTORY_ITEMS = 50;

export const historyService = {
  // Get all history entries
  getHistory(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (!stored) return [];
      const history = JSON.parse(stored) as HistoryEntry[];
      // Sort by timestamp descending (most recent first)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  // Add new entry to history
  addToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    try {
      const history = this.getHistory();
      
      // Check if location already exists (within 0.01 degree radius)
      const existingIndex = history.findIndex(
        h => Math.abs(h.location.lat - entry.location.lat) < 0.01 && 
             Math.abs(h.location.lng - entry.location.lng) < 0.01
      );

      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...entry,
        timestamp: Date.now(),
        isFavorite: existingIndex >= 0 ? history[existingIndex].isFavorite : false
      };

      // Remove existing entry if found
      if (existingIndex >= 0) {
        history.splice(existingIndex, 1);
      }

      // Add new entry at the beginning
      history.unshift(newEntry);

      // Keep only the most recent MAX_HISTORY_ITEMS
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  },

  // Toggle favorite status
  toggleFavorite(id: string): void {
    try {
      const history = this.getHistory();
      const entry = history.find(h => h.id === id);
      if (entry) {
        entry.isFavorite = !entry.isFavorite;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  // Get favorites
  getFavorites(): HistoryEntry[] {
    return this.getHistory().filter(h => h.isFavorite);
  },

  // Delete entry
  deleteEntry(id: string): void {
    try {
      const history = this.getHistory().filter(h => h.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  },

  // Clear all history
  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  // Get recent searches (last 10)
  getRecentSearches(): HistoryEntry[] {
    return this.getHistory().slice(0, 10);
  }
};
