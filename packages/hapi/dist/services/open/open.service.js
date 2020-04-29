"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
const open = require("opn");
const hapi_module_config_1 = require("../../hapi.module.config");
const hapi_1 = require("hapi");
let OpenService = class OpenService {
    constructor(server) {
        this.server = server;
    }
    openServerPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield open(`http://${this.server.info.address}:${this.server.info.port}/public`);
        });
    }
    openGraphQLPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield open(`http://${this.server.info.address}:${this.server.info.port}/graphiql`);
        });
    }
    openPage(link) {
        return __awaiter(this, void 0, void 0, function* () {
            yield open(link);
        });
    }
};
OpenService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(hapi_module_config_1.HAPI_SERVER)),
    __metadata("design:paramtypes", [hapi_1.Server])
], OpenService);
exports.OpenService = OpenService;
