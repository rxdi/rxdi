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
require("jest");
const core_1 = require("@rxdi/core");
const core_module_1 = require("../../test/helpers/core-module");
const hapi_1 = require("@rxdi/hapi");
const graphql_1 = require("graphql");
const custom_directive_1 = require("./custom-directive");
const operators_1 = require("rxjs/operators");
const decorators_1 = require("../../decorators");
let AddTextDirective = class AddTextDirective {
    constructor() {
        this.name = 'addText';
        this.description = 'change the case of a string to uppercase';
        this.locations = [graphql_1.DirectiveLocation.FIELD];
        this.args = {
            inside: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                description: 'the times to duplicate the string'
            },
            outside: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                description: 'the times to duplicate the string'
            }
        };
        this.resolve = (resolve, root, args) => __awaiter(this, void 0, void 0, function* () { return args.inside + (yield resolve()).toUpperCase() + args.outside; });
    }
};
AddTextDirective = __decorate([
    core_1.Injectable()
], AddTextDirective);
const ToUpperCaseDirective = new custom_directive_1.GraphQLCustomDirective({
    name: 'toUpperCase',
    description: 'change the case of a string to uppercase',
    locations: [graphql_1.DirectiveLocation.FIELD],
    resolve: (resolve) => __awaiter(void 0, void 0, void 0, function* () { return (yield resolve()).toUpperCase(); })
});
const UserType = new graphql_1.GraphQLObjectType({
    name: 'UserType',
    fields: () => ({
        name: {
            type: graphql_1.GraphQLString
        }
    })
});
let UserQueriesController = class UserQueriesController {
    findUser(root, { name }, context) {
        return { name: name };
    }
};
__decorate([
    decorators_1.Type(UserType),
    decorators_1.Query({
        name: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], UserQueriesController.prototype, "findUser", null);
UserQueriesController = __decorate([
    core_1.Controller()
], UserQueriesController);
describe('Custom Graphql Directives aka Schema Decorators', () => {
    let server;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield core_1.createTestBed({ controllers: [UserQueriesController] })
            .pipe(operators_1.switchMapTo(core_module_1.startServer({
            graphql: {
                directives: [ToUpperCaseDirective, AddTextDirective],
                buildAstDefinitions: false // Removed ast definition since directives are lost
            }
        })))
            .toPromise();
        server = core_1.Container.get(hapi_1.HAPI_SERVER);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () { return yield server.stop(); }));
    it('Should decorete name return property to become UPPERCASE', (done) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield core_module_1.sendRequest({
            query: `query findUser($name: String!) { findUser(name: $name) { name @toUpperCase } }`,
            variables: { name: 'imetomi' }
        });
        expect(res.data.findUser.name).toBe('IMETOMI');
        done();
    }));
    it('Should decorete name return property to have text outside', (done) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield core_module_1.sendRequest({
            query: `query findUser($name: String!) { findUser(name: $name) { name @addText(inside: "", outside: "test") } }`,
            variables: { name: 'imetomi' }
        });
        console.log(res.data.findUser.name);
        expect(res.data.findUser.name).toBe('IMETOMItest');
        done();
    }));
    it('Should decorete name return property to have text inside', (done) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield core_module_1.sendRequest({
            query: `query findUser($name: String!) { findUser(name: $name) { name @addText(inside: "test", outside: "") } }`,
            variables: { name: 'imetomi' }
        });
        expect(res.data.findUser.name).toBe('testIMETOMI');
        done();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () { return yield server.stop(); }));
});
