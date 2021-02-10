import { html } from './lit-html';

// export * from './directives/index';
export * from './lit-html';
export * from './directives/style-map';
export * from './directives/rx';
export * from './directives/class-map';
export * from './directives/unsafe-html';


export const h = <T>(v: T) => html`${v}`;

