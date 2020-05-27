import { Module, ModuleWithProviders } from '@rxdi/core';

import { HotkeysConfig } from './hotkeys.interface';
import { HotKeysService } from './hotkeys.service';

@Module()
export class HotkeyModule {
 public static forRoot(
  config: HotkeysConfig = {} as HotkeysConfig,
 ): ModuleWithProviders {
  return {
   ngModule: HotkeyModule,
   providers: [HotKeysService, { provide: HotkeysConfig, useValue: config }],
  };
 }
}
