import { NativeModule, requireNativeModule } from 'expo';

export interface SkeinBleNativeModule extends NativeModule<{
  onPacketReceived: (event: { payload: string }) => void;
}> {
  start(serviceUuid: string, charUuid: string): Promise<void>;
  stop(): Promise<void>;
  broadcast(payload: string): Promise<void>;
  addListener(eventName: 'onPacketReceived', listener: (event: { payload: string }) => void): { remove: () => void };
}

let nativeModule: SkeinBleNativeModule;
try {
  nativeModule = requireNativeModule<SkeinBleNativeModule>('SkeinBle');
} catch {
  // Fallback when running outside custom development build
  nativeModule = {
    start: async () => {
      throw new Error('SkeinBle native module is not installed in this build (requires a development build).');
    },
    stop: async () => {},
    broadcast: async () => {},
    addListener: () => ({ remove: () => {} }),
  } as unknown as SkeinBleNativeModule;
}

export default nativeModule;
