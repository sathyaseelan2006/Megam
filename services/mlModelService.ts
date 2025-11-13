// ============================================================================
// ML MODEL SERVICE - TensorFlow.js LSTM for Air Quality Prediction
// ============================================================================
// Real neural network implementation using TensorFlow.js
// Architecture: LSTM (Long Short-Term Memory) for time-series forecasting
// ============================================================================

import { TrainingDataset, HistoricalDataPoint } from './dataCollectionService';

// TensorFlow.js instance (should be preloaded by mlPreloader)
let tf: typeof import('@tensorflow/tfjs') | null = null;

const loadTensorFlow = async () => {
  if (tf) {
    return tf;
  }
  
  // TensorFlow should already be loaded by preloader
  // But if not, load it now
  console.log('📦 Loading TensorFlow.js...');
  tf = await import('@tensorflow/tfjs');
  
  // Ensure it's ready
  await tf.ready();
  console.log('✅ TensorFlow.js ready:', tf.version, 'Backend:', tf.getBackend());
  
  return tf;
};

export interface ModelConfig {
  sequenceLength: number; // Number of past days to look at (window size)
  features: number; // Number of input features (AQI, PM2.5, etc.)
  lstmUnits: number; // LSTM layer size
  epochs: number; // Training iterations
  batchSize: number;
  learningRate: number;
}

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  valLoss: number;
  accuracy: number;
  estimatedTimeRemaining: number; // seconds
}

export interface PredictionResult {
  date: string;
  predictedAQI: number;
  confidence: number;
  uncertainty: number; // Standard deviation
}

// Default model configuration (optimized for performance)
const DEFAULT_CONFIG: ModelConfig = {
  sequenceLength: 7, // Use last 7 days to predict next day
  features: 7, // AQI, PM2.5, PM10, O3, NO2, SO2, CO
  lstmUnits: 32, // Reduced from 64 for faster training
  epochs: 30, // Reduced from 100 for faster training (still effective)
  batchSize: 32,
  learningRate: 0.001
};

/**
 * Normalize data to 0-1 range for neural network
 */
const normalizeData = (data: number[]): { normalized: number[]; min: number; max: number } => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  const normalized = data.map(value => (value - min) / range);
  return { normalized, min, max };
};

/**
 * Denormalize predictions back to original scale
 */
const denormalize = (normalized: number, min: number, max: number): number => {
  return normalized * (max - min) + min;
};

/**
 * Convert historical data to training sequences
 * Creates sliding windows: [day1, day2, ..., day7] → [day8]
 */
const createTrainingSequences = (
  dataset: TrainingDataset,
  config: ModelConfig
): { inputs: number[][][]; outputs: number[][] } => {
  const { data } = dataset;
  const { sequenceLength, features } = config;

  const inputs: number[][][] = [];
  const outputs: number[][] = [];

  // Extract feature matrix (each row = day, each column = feature)
  const featureMatrix: number[][] = data.map(point => [
    point.aqi,
    point.pm25,
    point.pm10,
    point.o3,
    point.no2,
    point.so2,
    point.co
  ]);

  // Normalize each feature column
  const normalizedMatrix: number[][] = [];
  const normParams: { min: number; max: number }[] = [];

  for (let col = 0; col < features; col++) {
    const column = featureMatrix.map(row => row[col]);
    const { normalized, min, max } = normalizeData(column);
    normParams.push({ min, max });
    
    normalized.forEach((value, row) => {
      if (!normalizedMatrix[row]) normalizedMatrix[row] = [];
      normalizedMatrix[row][col] = value;
    });
  }

  // Create sliding window sequences
  for (let i = 0; i < normalizedMatrix.length - sequenceLength; i++) {
    const inputSequence = normalizedMatrix.slice(i, i + sequenceLength);
    const outputValue = normalizedMatrix[i + sequenceLength][0]; // Predict AQI (first feature)
    
    inputs.push(inputSequence);
    outputs.push([outputValue]);
  }

  console.log(`📊 Created ${inputs.length} training sequences from ${data.length} days`);
  console.log(`📐 Input shape: [${sequenceLength}, ${features}], Output shape: [1]`);

  // Store normalization params for later use
  (createTrainingSequences as any).normParams = normParams;

  return { inputs, outputs };
};

/**
 * Build LSTM neural network model
 */
export const buildLSTMModel = async (config: ModelConfig = DEFAULT_CONFIG): Promise<any> => {
  const tfjs = await loadTensorFlow();
  console.log('🧠 Building LSTM neural network...');

  const model = tfjs.sequential();

  // Input layer: [batchSize, sequenceLength, features]
  model.add(tfjs.layers.lstm({
    units: config.lstmUnits,
    returnSequences: true, // Return full sequence for stacking
    inputShape: [config.sequenceLength, config.features]
  }));

  // Dropout for regularization (prevent overfitting)
  model.add(tfjs.layers.dropout({ rate: 0.2 }));

  // Second LSTM layer
  model.add(tfjs.layers.lstm({
    units: config.lstmUnits / 2,
    returnSequences: false // Only return last output
  }));

  // Dropout
  model.add(tfjs.layers.dropout({ rate: 0.2 }));

  // Dense output layer (predicts single AQI value)
  model.add(tfjs.layers.dense({ units: 1 }));

  // Compile with Adam optimizer and MSE loss
  model.compile({
    optimizer: tfjs.train.adam(config.learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae'] // Mean Absolute Error
  });

  console.log('✅ Model architecture:');
  model.summary();

  return model;
};

/**
 * Train the LSTM model on historical data
 */
export const trainModel = async (
  model: any,
  dataset: TrainingDataset,
  config: ModelConfig = DEFAULT_CONFIG,
  onProgress?: (progress: TrainingProgress) => void
): Promise<any> => {
  const tfjs = await loadTensorFlow();
  console.log('🏋️ Starting model training...');

  // Prepare training data
  const { inputs, outputs } = createTrainingSequences(dataset, config);

  // Split into training (80%) and validation (20%)
  const splitIndex = Math.floor(inputs.length * 0.8);
  
  const trainInputs = inputs.slice(0, splitIndex);
  const trainOutputs = outputs.slice(0, splitIndex);
  const valInputs = inputs.slice(splitIndex);
  const valOutputs = outputs.slice(splitIndex);

  console.log(`📊 Training set: ${trainInputs.length} sequences`);
  console.log(`📊 Validation set: ${valInputs.length} sequences`);

  // Convert to tensors with explicit shapes
  const xTrain = tfjs.tensor3d(trainInputs, [trainInputs.length, config.sequenceLength, config.features]);
  const yTrain = tfjs.tensor2d(trainOutputs, [trainOutputs.length, 1]);
  const xVal = tfjs.tensor3d(valInputs, [valInputs.length, config.sequenceLength, config.features]);
  const yVal = tfjs.tensor2d(valOutputs, [valOutputs.length, 1]);

  const startTime = Date.now();

  // Train the model
  const history = await model.fit(xTrain, yTrain, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationData: [xVal, yVal],
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const avgTimePerEpoch = elapsedTime / (epoch + 1);
        const remainingEpochs = config.epochs - (epoch + 1);
        const estimatedTimeRemaining = avgTimePerEpoch * remainingEpochs;

        const progress: TrainingProgress = {
          epoch: epoch + 1,
          totalEpochs: config.epochs,
          loss: logs?.loss || 0,
          valLoss: logs?.val_loss || 0,
          accuracy: 100 - (logs?.val_mae || 0) * 100, // Convert MAE to accuracy %
          estimatedTimeRemaining
        };

        console.log(`📈 Epoch ${epoch + 1}/${config.epochs} - Loss: ${progress.loss.toFixed(4)}, Val Loss: ${progress.valLoss.toFixed(4)}`);
        
        if (onProgress) {
          onProgress(progress);
        }
      }
    }
  });

  // Clean up tensors
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();

  const trainingTime = (Date.now() - startTime) / 1000;
  console.log(`✅ Training complete in ${trainingTime.toFixed(1)}s`);

  return history;
};

/**
 * Predict future AQI values using trained model
 */
export const predictFuture = async (
  model: any,
  recentData: HistoricalDataPoint[],
  days: number,
  config: ModelConfig = DEFAULT_CONFIG
): Promise<PredictionResult[]> => {
  const tfjs = await loadTensorFlow();
  console.log(`🔮 Predicting next ${days} days...`);

  // Allow predictions with as little as 3 days of data
  const minDataPoints = Math.min(3, config.sequenceLength);
  if (recentData.length < minDataPoints) {
    throw new Error(`Need at least ${minDataPoints} days of recent data (got ${recentData.length})`);
  }

  // Get normalization params from training
  const normParams = (createTrainingSequences as any).normParams as { min: number; max: number }[];
  if (!normParams) {
    throw new Error('Model must be trained before making predictions');
  }

  const predictions: PredictionResult[] = [];
  
  // Use last N days as starting sequence (adapt to available data)
  const effectiveSequenceLength = Math.min(config.sequenceLength, recentData.length);
  let currentSequence = recentData.slice(-effectiveSequenceLength);
  
  // Pad sequence if needed (repeat last values)
  while (currentSequence.length < config.sequenceLength) {
    currentSequence.unshift(currentSequence[0]);
  }

  for (let day = 1; day <= days; day++) {
    // Normalize current sequence
    const normalizedSequence: number[][] = currentSequence.map(point => {
      const features = [point.aqi, point.pm25, point.pm10, point.o3, point.no2, point.so2, point.co];
      return features.map((value, idx) => {
        const { min, max } = normParams[idx];
        return (value - min) / (max - min);
      });
      });

    // Convert to tensor [1, sequenceLength, features]
    const inputTensor = tfjs.tensor3d([normalizedSequence], [1, config.sequenceLength, config.features]);

    // Make prediction
    const outputTensor = model.predict(inputTensor) as any;
    const normalizedPrediction = (await outputTensor.data())[0];    // Denormalize
    const predictedAQI = denormalize(normalizedPrediction, normParams[0].min, normParams[0].max);

    // Calculate confidence (decreases with forecast distance)
    const baseConfidence = 90;
    const confidence = Math.max(40, baseConfidence - (day * 3));

    // Calculate uncertainty (increases with forecast distance)
    const uncertainty = Math.min(50, 5 + day * 2);

    // Generate future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + day);

    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedAQI: Math.round(Math.max(0, Math.min(500, predictedAQI))),
      confidence: Math.round(confidence),
      uncertainty: Math.round(uncertainty)
    });

    // Update sequence for next prediction (sliding window)
    // Append predicted day (with estimated pollutant values based on AQI)
    currentSequence = [
      ...currentSequence.slice(1),
      {
        timestamp: futureDate.getTime(),
        date: futureDate.toISOString().split('T')[0],
        aqi: predictedAQI,
        pm25: predictedAQI * 0.5, // Estimate PM2.5 from AQI
        pm10: predictedAQI * 0.7,
        o3: predictedAQI * 0.3,
        no2: predictedAQI * 0.2,
        so2: predictedAQI * 0.1,
        co: predictedAQI * 0.4,
        source: 'interpolated',
        confidence: 0.5
      }
    ];

    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();
  }

  console.log(`✅ Generated ${predictions.length} predictions`);
  return predictions;
};

/**
 * Save trained model to browser storage
 */
export const saveModel = async (
  model: any,
  locationKey: string
): Promise<void> => {
  const modelPath = `indexeddb://aqi-model-${locationKey}`;
  await model.save(modelPath);
  console.log(`💾 Model saved to ${modelPath}`);
};

/**
 * Load trained model from browser storage
 */
export const loadModel = async (locationKey: string): Promise<any | null> => {
  try {
    const tfjs = await loadTensorFlow();
    const modelPath = `indexeddb://aqi-model-${locationKey}`;
    const model = await tfjs.loadLayersModel(modelPath);
    console.log(`📦 Model loaded from ${modelPath}`);
    return model;
  } catch (error) {
    console.log('❌ No saved model found');
    return null;
  }
};

/**
 * Check if model exists for a location
 */
export const modelExists = async (locationKey: string): Promise<boolean> => {
  try {
    const tfjs = await loadTensorFlow();
    const modelPath = `indexeddb://aqi-model-${locationKey}`;
    const models = await tfjs.io.listModels();
    return modelPath in models;
  } catch {
    return false;
  }
};

/**
 * Get model info and metadata
 */
export const getModelInfo = (model: any) => {
  return {
    totalParams: model.countParams(),
    layers: model.layers.length,
    inputShape: model.inputs[0].shape,
    outputShape: model.outputs[0].shape,
    optimizer: 'Adam',
    loss: 'MSE'
  };
};
