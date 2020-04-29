"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
function importQuery(search) {
    let result;
    const DOCUMENTS = core_1.Container.get('graphql-documents');
    Object.keys(DOCUMENTS)
        .filter(doc => {
        if (doc.indexOf(search) !== -1) {
            result = DOCUMENTS[doc];
        }
    });
    if (!result) {
        throw new Error(`Missing query: ${search}`);
    }
    return result;
}
exports.importQuery = importQuery;
