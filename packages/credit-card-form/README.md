# @rxdi/credit-card-form

##### Install

```bash
npm install @rxdi/credit-card-form
```

## Consuming

```typescript
import "@rxdi/credit-card-form";
import { CardModel } from "@rxdi/credit-card-form";
import { html } from "@rxdi/lit-html";

const template = html`
  <credit-card-form
    @submit=${(e: CustomEvent<CardModel>) => {
      e.detail.card;
      e.detail.expiry;
      e.detail.cvc;
      e.detail.name;
    }}
  ></credit-card-form>
`;
```

## Preview

![image info](./docs-images/front.png)
![image info](./docs-images/back.png)