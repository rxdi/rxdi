import { Module } from '@rxdi/core';
import { HamburgerComponent } from './hamburger.component';
import { GraphqlModule } from '@rxdi/graphql-client';

@Module({
  components: [HamburgerComponent],
  imports: [GraphqlModule.forRoot()]
})
export class HamburgerClientModule {}
