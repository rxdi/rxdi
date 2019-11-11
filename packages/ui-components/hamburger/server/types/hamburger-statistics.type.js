"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
exports.HamburgerStatisticsType = new graphql_1.GraphQLObjectType({
    name: 'HamburgerStatisticsType',
    fields: () => ({
        clicks: {
            type: graphql_1.GraphQLInt
        }
    })
});
//# sourceMappingURL=hamburger-statistics.type.js.map