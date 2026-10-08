import { SkeinBleNativeModule } from './SkeinBleModule';

const webFallback: SkeinBleNativeModule = {
  start: async () => {
    throw new Error('Bluetooth LE mesh is only supported on Android native development builds.');
  },
  stop: async () => {},
  broadcast: async () => {},
} as unknown as SkeinBleNativeModule;

export default webFallback;
