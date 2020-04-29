"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var FirebaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const admin = require("firebase-admin");
const firebase_tokens_1 = require("./firebase.tokens");
let FirebaseModule = FirebaseModule_1 = class FirebaseModule {
    static forRoot(config) {
        return {
            module: FirebaseModule_1,
            providers: [
                {
                    provide: firebase_tokens_1.Firestore,
                    useFactory: () => {
                        admin.initializeApp(config);
                        return admin.firestore();
                    }
                }
            ]
        };
    }
};
FirebaseModule = FirebaseModule_1 = __decorate([
    core_1.Module()
], FirebaseModule);
exports.FirebaseModule = FirebaseModule;
__export(require("./firebase.tokens"));
__export(require("./mixins"));
