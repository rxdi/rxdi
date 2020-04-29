"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lit_html_1 = require("@rxdi/lit-html");
let NotFoundComponent = class NotFoundComponent extends HTMLElement {
};
NotFoundComponent = __decorate([
    lit_html_1.Component({
        selector: 'not-found-component-rxdi',
        useShadow: true,
        template: () => lit_html_1.html `
    <h1>Not found component!</h1>
    <p>Please check your URL.2222daad</p>
  `
    })
], NotFoundComponent);
exports.NotFoundComponent = NotFoundComponent;
exports.NotFoundPathConfig = {
    path: '(.*)',
    component: 'not-found-component-rxdi'
};
