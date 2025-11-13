// User preferences for ML features
const ML_PREFERENCE_KEY = 'megam_ml_preference';

export type MLPreference = 'auto' | 'always' | 'never';

/**
 * Get user's ML preference
 */
export const getMLPreference = (): MLPreference => {
  try {
    const stored = localStorage.getItem(ML_PREFERENCE_KEY);
    if (stored === 'always' || stored === 'never') return stored;
    return 'auto'; // Default: smart loading
  } catch {
    return 'auto';
  }
};

/**
 * Set user's ML preference
 */
export const setMLPreference = (preference: MLPreference): void => {
  try {
    localStorage.setItem(ML_PREFERENCE_KEY, preference);
  } catch (error) {
    console.warn('Failed to save ML preference:', error);
  }
};

/**
 * Check if we should preload ML based on user preference and context
 */
export const shouldPreloadML = (
  preference: MLPreference,
  userHasInteracted: boolean
): boolean => {
  switch (preference) {
    case 'always':
      return true; // Always preload on app start
    case 'never':
      return false; // Never preload, always use Fast Mode
    case 'auto':
    default:
      return userHasInteracted; // Only preload when user shows interest
  }
};
