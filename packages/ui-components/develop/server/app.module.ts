import { Module } from '@rxdi/core';
import { HamburgerServerModule } from '../../src/hamburger/server';

@Module({
    imports: [HamburgerServerModule]
})
export class AppModule {}