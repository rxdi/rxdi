import { Module, ModuleWithProviders } from '@rxdi/core';

import { AltairPlugin } from './altair.plugin';
import { AltairConfig, DefaultAltairConfig } from './altair.tokens';
import { AltairStaticsPlugin } from './altair-static.plugin';

@Module({
 plugins: [AltairPlugin, AltairStaticsPlugin],
 providers: [
  {
   provide: AltairConfig,
   useValue: DefaultAltairConfig,
  },
 ],
})
export class AltairModule {
 public static forRoot(config: AltairConfig = DefaultAltairConfig): ModuleWithProviders {
  return {
   module: AltairModule,
   providers: [
    {
     provide: AltairConfig,
     useValue: config,
    },
   ],
  };
 }
}
