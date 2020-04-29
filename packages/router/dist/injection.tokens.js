"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
function Router() {
    return (target, propertyKey) => {
        Object.defineProperty(target, propertyKey, {
            get: () => core_1.Container.get(exports.RouterRoutlet).getValue()
        });
    };
}
exports.Router = Router;
exports.RouterRoutlet = 'router-outlet';
exports.RouterInitialized = 'router-initialized';
exports.Routes = 'router-routes';
exports.RouterOptions = 'router-options';
