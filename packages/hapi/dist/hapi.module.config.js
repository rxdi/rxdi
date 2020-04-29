"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
class HapiConfigModel {
    constructor() {
        this.staticConfig = {
            method: 'GET',
            path: '/public/{param*}',
            handler: {
                directory: {
                    path: 'public',
                    index: ['index.html', 'default.html']
                }
            }
        };
    }
}
exports.HapiConfigModel = HapiConfigModel;
exports.HAPI_CONFIG = new core_1.InjectionToken('hapi-config-injection-token');
exports.HAPI_SERVER = new core_1.InjectionToken('hapi-server-injection-token');
exports.HAPI_PLUGINS = new core_1.InjectionToken('hapi-plugins-injection-token');
