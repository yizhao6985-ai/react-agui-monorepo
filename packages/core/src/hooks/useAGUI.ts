/**
 * useAGUI：在组件内直接获取 AGUI 内容输出（当前线程、消息、运行方法等）
 */

import { useContext } from 'react';
import type { AGUIProviderValue } from '../context/AGUIContext';
import { AGUIContext } from '../context/AGUIContext';

export function useAGUI(): AGUIProviderValue {
  const ctx = useContext(AGUIContext);
  if (ctx === undefined) {
    throw new Error('useAGUI must be used within AGUIProvider');
  }
  return ctx;
}
