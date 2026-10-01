import {
  WorkerRequest,
  WorkerResponse,
  WorkerProgressPayload,
  WorkerTrainingDataPoint,
  WorkerPredictionPoint,
  WorkerModelConfig,
} from './types';
import { Result, Ok, Err } from '../types/result';
import MLWorkerConstructor from './ml.worker?worker';

export class MLWorkerClient {
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new MLWorkerConstructor();

      this.worker.postMessage({ type: 'INIT' } as WorkerRequest);
      this.isInitialized = true;
    } catch (e) {
      console.warn('[MLWorkerClient] Failed to initialize Web Worker. Falling back to local thread:', e);
      this.worker = null;
      this.isInitialized = false;
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.worker && this.isInitialized);
  }

  public async train(
    locationKey: string,
    data: WorkerTrainingDataPoint[],
    config?: Partial<WorkerModelConfig>,
    onProgress?: (progress: WorkerProgressPayload) => void
  ): Promise<Result<{ durationMs: number; finalLoss: number }, Error>> {
    if (!this.worker) {
      return Err(new Error('ML Web Worker is unavailable in this environment'));
    }

    return new Promise((resolve) => {
      const messageHandler = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;

        if (msg.type === 'PROGRESS') {
          onProgress?.(msg.payload);
        } else if (msg.type === 'TRAIN_SUCCESS') {
          this.worker?.removeEventListener('message', messageHandler);
          resolve(
            Ok({
              durationMs: msg.payload.durationMs,
              finalLoss: msg.payload.finalLoss,
            })
          );
        } else if (msg.type === 'ERROR') {
          this.worker?.removeEventListener('message', messageHandler);
          resolve(Err(new Error(msg.error)));
        }
      };

      this.worker.addEventListener('message', messageHandler);

      this.worker.postMessage({
        type: 'TRAIN',
        payload: {
          locationKey,
          data,
          config,
        },
      } as WorkerRequest);
    });
  }

  public async predict(
    locationKey: string,
    recentData: WorkerTrainingDataPoint[],
    daysToPredict: number = 7
  ): Promise<Result<WorkerPredictionPoint[], Error>> {
    if (!this.worker) {
      return Err(new Error('ML Web Worker is unavailable in this environment'));
    }

    return new Promise((resolve) => {
      const messageHandler = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;

        if (msg.type === 'PREDICT_SUCCESS') {
          this.worker?.removeEventListener('message', messageHandler);
          resolve(Ok(msg.payload.predictions));
        } else if (msg.type === 'ERROR') {
          this.worker?.removeEventListener('message', messageHandler);
          resolve(Err(new Error(msg.error)));
        }
      };

      this.worker.addEventListener('message', messageHandler);

      this.worker.postMessage({
        type: 'PREDICT',
        payload: {
          locationKey,
          recentData,
          daysToPredict,
        },
      } as WorkerRequest);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

export const globalMLWorker = new MLWorkerClient();
