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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let ResponsiveService = class ResponsiveService {
    constructor() {
        this.width = new rxjs_1.BehaviorSubject(document.body.clientWidth);
        this.height = new rxjs_1.BehaviorSubject(document.body.clientHeight);
        this.scrollDebounceTime = 10;
        this.scrollSubscription = rxjs_1.fromEvent(window, 'scroll').pipe(operators_1.debounceTime(this.scrollDebounceTime));
        this.isPositionFixed = true;
        window.addEventListener('resize', () => this.setWindowSize());
    }
    setWindowSize() {
        this.height.next(document.body.clientHeight);
        this.width.next(document.body.clientWidth);
    }
    getBoth() {
        return {
            width: this.width.getValue(),
            height: this.height.getValue()
        };
    }
    combineBoth() {
        return rxjs_1.of(this.getBoth()).pipe(operators_1.combineLatest(this.height, this.width), operators_1.map(() => this.getBoth()));
    }
};
ResponsiveService = __decorate([
    core_1.Injectable({ init: true }),
    __metadata("design:paramtypes", [])
], ResponsiveService);
exports.ResponsiveService = ResponsiveService;
//# sourceMappingURL=responsive.service.js.map