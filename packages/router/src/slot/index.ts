import { RouterSlots } from './slot';

export { IRoute, RouterSlot } from "router-slot";

declare global {
  interface HTMLElementTagNameMap {
    "router-slots": RouterSlots;
  }
}

export * from "./slot";
