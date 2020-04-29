"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class StaticMethods {
    static setStaticSelf(self) {
        StaticMethods.model = self;
    }
    static create(payload, doc) {
        return StaticMethods.model.create(payload, doc);
    }
    static getCollectionRef() {
        return StaticMethods.model.getCollectionRef();
    }
    static getFirestoreRef() {
        return StaticMethods.model.getFirestoreRef();
    }
    static getRef(doc) {
        return StaticMethods.model.getRef(doc);
    }
    static get(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            return StaticMethods.model.get(doc);
        });
    }
    static delete(doc) {
        return StaticMethods.model.delete(doc);
    }
    static update(doc, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return StaticMethods.model.update(doc, payload);
        });
    }
    static findAll(where) {
        return __awaiter(this, void 0, void 0, function* () {
            return StaticMethods.model.findAll(where);
        });
    }
    static find(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return StaticMethods.model.find(payload);
        });
    }
    static build(payload) {
        return payload;
    }
}
exports.StaticMethods = StaticMethods;
