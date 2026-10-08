import { useSyncExternalStore } from 'react';
import { EngineState, MeshEngine } from './MeshEngine';

const EMPTY: EngineState = { peers: [], messages: [], transportLabel: '' };
const noopSubscribe = () => () => {};
const getEmpty = () => EMPTY;

export function useEngineState(engine: MeshEngine | null): EngineState {
  return useSyncExternalStore(
    engine ? engine.subscribe : noopSubscribe,
    engine ? engine.getState : getEmpty,
  );
}
