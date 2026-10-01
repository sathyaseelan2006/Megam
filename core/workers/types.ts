export interface WorkerModelConfig {
  sequenceLength: number;
  features: number;
  lstmUnits: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
}

export interface WorkerTrainingDataPoint {
  date: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
}

export interface WorkerProgressPayload {
  epoch: number;
  totalEpochs: number;
  loss: number;
  valLoss?: number;
  accuracy: number;
}

export interface WorkerPredictionPoint {
  date: string;
  predictedAQI: number;
  confidence: number;
  uncertainty: number;
}

export type WorkerRequest =
  | { type: 'INIT' }
  | {
      type: 'TRAIN';
      payload: {
        locationKey: string;
        data: WorkerTrainingDataPoint[];
        config?: Partial<WorkerModelConfig>;
      };
    }
  | {
      type: 'PREDICT';
      payload: {
        locationKey: string;
        recentData: WorkerTrainingDataPoint[];
        daysToPredict: number;
      };
    };

export type WorkerResponse =
  | { type: 'INIT_SUCCESS'; backend: string }
  | { type: 'PROGRESS'; payload: WorkerProgressPayload }
  | {
      type: 'TRAIN_SUCCESS';
      payload: {
        locationKey: string;
        finalLoss: number;
        epochsTrained: number;
        durationMs: number;
      };
    }
  | {
      type: 'PREDICT_SUCCESS';
      payload: {
        locationKey: string;
        predictions: WorkerPredictionPoint[];
      };
    }
  | { type: 'ERROR'; error: string };
