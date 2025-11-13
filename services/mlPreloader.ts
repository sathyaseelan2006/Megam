// ML Preloader - Initialize TensorFlow.js on app start
// This loads the ML library in the background so predictions are instant

let tfLoaded = false;
let tfLoadingPromise: Promise<void> | null = null;

/**
 * Preload TensorFlow.js in the background
 * Call this when the app starts
 */
export const preloadTensorFlow = async (): Promise<void> => {
  // Prevent multiple simultaneous loads
  if (tfLoadingPromise) {
    return tfLoadingPromise;
  }

  if (tfLoaded) {
    return Promise.resolve();
  }

  console.log('🚀 Pre-loading TensorFlow.js in background...');
  
  tfLoadingPromise = (async () => {
    try {
      // Import TensorFlow.js
      const tf = await import('@tensorflow/tfjs');
      
      // Set backend to WebGL for GPU acceleration
      await tf.setBackend('webgl');
      await tf.ready();
      
      tfLoaded = true;
      console.log('✅ TensorFlow.js pre-loaded successfully!', tf.version, 'Backend:', tf.getBackend());
    } catch (error) {
      console.warn('⚠️ Failed to pre-load TensorFlow.js:', error);
      console.log('💡 ML features will use Fast Mode instead');
    } finally {
      tfLoadingPromise = null;
    }
  })();

  return tfLoadingPromise;
};

/**
 * Check if TensorFlow.js is ready
 */
export const isTensorFlowReady = (): boolean => {
  return tfLoaded;
};

/**
 * Wait for TensorFlow.js to be ready
 */
export const waitForTensorFlow = async (): Promise<boolean> => {
  if (tfLoaded) return true;
  if (tfLoadingPromise) {
    await tfLoadingPromise;
    return tfLoaded;
  }
  return false;
};
