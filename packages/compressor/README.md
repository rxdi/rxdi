# @rxdi/compressor

##### Install

```bash
npm install @rxdi/compressor
```

## Consuming

```typescript
import { LZWService } from '@rxdi/compressor';

const myObject = { name: 'Kristiyan Tachev' }
const compressed = LZWService.compress(myObject)

const decompressed = LZWService.decompress(compressed);
/* Prints: { name: 'Kristiyan Tachev' } */
```
