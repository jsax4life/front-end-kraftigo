// Utility for managing user profile data in localStorage
// Used for data that frontend needs but backend doesn't store

const USER_PROFILE_KEY = 'kraftigo_user_profile';

interface UserProfile {
  fullName?: string;
  email?: string;
}

export const userProfileStorage = {
  // Save user profile data
  save: (profile: UserProfile) => {
    try {
      const existing = userProfileStorage.get();
      const updated = { ...existing, ...profile };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  },

  // Get user profile data
  get: (): UserProfile => {
    try {
      const data = localStorage.getItem(USER_PROFILE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {};
    }
  },

  // Get specific field
  getField: (field: keyof UserProfile): string | undefined => {
    const profile = userProfileStorage.get();
    return profile[field];
  },

  // Clear user profile data
  clear: () => {
    try {
      localStorage.removeItem(USER_PROFILE_KEY);
    } catch (error) {
      console.error('Failed to clear user profile:', error);
    }
  },
};
