import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE: '@zubi_user_profile',
  TRIP_HISTORY: '@zubi_trip_history',
  FAVORITES: '@zubi_favorites',
  AUTH_TOKEN: '@zubi_auth_token',
  DRIVER_STATS: '@zubi_driver_stats',
  ACHIEVEMENTS: '@zubi_achievements',
  MESSAGES: '@zubi_messages',
  SETTINGS: '@zubi_settings',
};

class StorageService {
  // Generic storage methods
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return { success: true };
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return { success: false, error };
    }
  }

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return { success: false, error };
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing storage:', error);
      return { success: false, error };
    }
  }

  // User Profile
  async saveUserProfile(profile) {
    return await this.setItem(KEYS.USER_PROFILE, profile);
  }

  async getUserProfile() {
    return await this.getItem(KEYS.USER_PROFILE);
  }

  async updateUserProfile(updates) {
    const currentProfile = await this.getUserProfile();
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...updates };
      return await this.saveUserProfile(updatedProfile);
    }
    return { success: false, error: 'No profile found' };
  }

  // Auth Token
  async saveAuthToken(token) {
    return await this.setItem(KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken() {
    return await this.getItem(KEYS.AUTH_TOKEN);
  }

  async removeAuthToken() {
    return await this.removeItem(KEYS.AUTH_TOKEN);
  }

  // Trip History
  async saveTripHistory(trips) {
    return await this.setItem(KEYS.TRIP_HISTORY, trips);
  }

  async getTripHistory() {
    const history = await this.getItem(KEYS.TRIP_HISTORY);
    return history || [];
  }

  async addTrip(trip) {
    const history = await this.getTripHistory();
    const updatedHistory = [trip, ...history];
    return await this.saveTripHistory(updatedHistory);
  }

  // Favorites
  async saveFavorites(favorites) {
    return await this.setItem(KEYS.FAVORITES, favorites);
  }

  async getFavorites() {
    const favorites = await this.getItem(KEYS.FAVORITES);
    return favorites || [];
  }

  async addFavorite(favorite) {
    const favorites = await this.getFavorites();
    const updatedFavorites = [...favorites, { ...favorite, id: Date.now().toString() }];
    return await this.saveFavorites(updatedFavorites);
  }

  async removeFavorite(favoriteId) {
    const favorites = await this.getFavorites();
    const updatedFavorites = favorites.filter(f => f.id !== favoriteId);
    return await this.saveFavorites(updatedFavorites);
  }

  // Driver Stats
  async saveDriverStats(stats) {
    return await this.setItem(KEYS.DRIVER_STATS, stats);
  }

  async getDriverStats() {
    const stats = await this.getItem(KEYS.DRIVER_STATS);
    return stats || {
      totalTrips: 0,
      totalEarnings: 0,
      xp: 0,
      level: 'Iniciante',
      rating: 5.0,
      consecutiveDays: 0,
      lastTripDate: null,
    };
  }

  async updateDriverStats(updates) {
    const currentStats = await this.getDriverStats();
    const updatedStats = { ...currentStats, ...updates };
    return await this.saveDriverStats(updatedStats);
  }

  // Achievements
  async saveAchievements(achievements) {
    return await this.setItem(KEYS.ACHIEVEMENTS, achievements);
  }

  async getAchievements() {
    return await this.getItem(KEYS.ACHIEVEMENTS);
  }

  async unlockAchievement(achievementId) {
    const achievements = await this.getAchievements() || {};
    achievements[achievementId] = {
      ...achievements[achievementId],
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    };
    return await this.saveAchievements(achievements);
  }

  // Messages
  async saveMessages(tripId, messages) {
    const allMessages = await this.getItem(KEYS.MESSAGES) || {};
    allMessages[tripId] = messages;
    return await this.setItem(KEYS.MESSAGES, allMessages);
  }

  async getMessages(tripId) {
    const allMessages = await this.getItem(KEYS.MESSAGES) || {};
    return allMessages[tripId] || [];
  }

  async addMessage(tripId, message) {
    const messages = await this.getMessages(tripId);
    const updatedMessages = [...messages, { ...message, id: Date.now().toString() }];
    return await this.saveMessages(tripId, updatedMessages);
  }

  // Settings
  async saveSettings(settings) {
    return await this.setItem(KEYS.SETTINGS, settings);
  }

  async getSettings() {
    const settings = await this.getItem(KEYS.SETTINGS);
    return settings || {
      notifications: true,
      darkMode: false,
      language: 'pt-BR',
      soundEnabled: true,
    };
  }

  async updateSettings(updates) {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...updates };
    return await this.saveSettings(updatedSettings);
  }
}

export default new StorageService();
