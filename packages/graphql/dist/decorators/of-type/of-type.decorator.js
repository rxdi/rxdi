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
const core_1 = require("@rxdi/core");
const effect_service_1 = require("../../services/effect.service");
const moduleService = core_1.Container.get(core_1.ModuleService);
function OfType(type) {
    return (target, pk, descriptor) => {
        const self = target;
        const cacheService = core_1.Container.get(effect_service_1.EffectService);
        cacheService
            .getLayer(type)
            .getItemObservable(type)
            .subscribe((item) => __awaiter(this, void 0, void 0, function* () {
            const currentConstructor = moduleService.watcherService.getConstructor(self.constructor.name);
            const originalDesc = descriptor.value.bind(currentConstructor['value']);
            yield originalDesc(...item.data);
        }));
    };
}
exports.OfType = OfType;
