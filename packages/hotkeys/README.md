# @rxdi/hotkeys

### Installation

```bash
npm i @rxdi/hotkeys
```

```ts
import { Module } from "@rxdi/core";
import { HotkeyModule } from "@rxdi/hotkeys";

@Module({
  imports: [
    HotkeyModule.forRoot({
      globalBindings: [
        [
          "ctrl+a",
          (e) => {
            console.log(e, "It works");
          },
        ],
      ],
    }),
  ],
})
export class AppModule {}
```

```ts
import { Injectable } from '@rxdi/core';
import { HotKeysService } from '@rxdi/hotkeys';

@Injectable()
export class HotkeysProvider {

 @Inject(HotKeysService)
 private hotkeys: HotKeysService;

 OnInit() {
   /* Binding from event */
  const sub = this.hotkeys.bind('ctrl+a').subscribe((stream) => {
   console.log('It works', stream);
  });

  /* Unbinding from event */
  sub.unsubscribe()
}
```
