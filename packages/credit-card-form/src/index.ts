import { CreditCardComponent } from "./credit-card";
import { CreditCardFormComponent } from "./form";

export * from "./credit-card";
export * from "./form";
export * from "./helpers";
export * from "./validators";

declare global {
  interface HTMLElementTagNameMap {
    "credit-card": CreditCardComponent;
    "credit-card-form": CreditCardFormComponent;
  }
}
