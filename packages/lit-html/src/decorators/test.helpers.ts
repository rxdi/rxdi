
import { Container } from '@rxdi/core';
import { TemplateResult } from '../lit-html/lit-html';
import { RXDIElement } from './tokens';

export function setElement<T>(element: T, container: HTMLElement): T {
  element['setElement'](container);
  return element;
}

export function MockComponent<T>(component: any): T {
  return Container.get(component);
}

export function getTemplateResult(component: RXDIElement): TemplateResult {
  return component.getTemplateResult();
}
