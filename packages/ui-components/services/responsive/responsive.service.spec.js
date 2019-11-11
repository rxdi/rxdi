"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const core_1 = require("@rxdi/core");
const responsive_service_1 = require("./responsive.service");
describe('Responsive Service', () => {
    beforeAll(() => __awaiter(this, void 0, void 0, function* () {
        yield core_1.createTestBed({
            imports: [],
            providers: [responsive_service_1.ResponsiveService]
        }).toPromise();
    }));
    it('should be defined', done => {
        expect(core_1.Container.has(responsive_service_1.ResponsiveService)).toBeTruthy();
        done();
    });
});
//# sourceMappingURL=responsive.service.spec.js.map