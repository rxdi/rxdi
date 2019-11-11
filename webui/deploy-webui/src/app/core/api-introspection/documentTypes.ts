
function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
export const DocumentTypes = strEnum(['build.mutation.graphql',
'build-list.query.graphql',
'list-files.query.graphql',
'read-file.query.graphql',
'save-file.query.graphql',
'get-namespace-by-id.query.graphql',
'list-namespace.query.graphql']);
export type DocumentTypes = keyof typeof DocumentTypes;
