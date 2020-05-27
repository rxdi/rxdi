import { InjectionToken } from '@rxdi/core';

export interface HotkeysConfig {
  globalBindings: [[string, Function]];
}

export const HotkeysConfig = new InjectionToken<HotkeysConfig>();
