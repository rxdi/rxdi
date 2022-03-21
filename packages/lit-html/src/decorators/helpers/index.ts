import { TemplateResult } from '../../lit-html/lit-html';

export const pipe = (...fns: Function[]) => (x: TemplateResult) => fns.reduce((v, f) => f(v), x);
