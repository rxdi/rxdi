

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: triggerBuild
// ====================================================

export interface triggerBuild_triggerBuild {
  status: string | null;
}

export interface triggerBuild {
  triggerBuild: triggerBuild_triggerBuild | null;
}

export interface triggerBuildVariables {
  folder: string;
  file: string;
  message: string;
  namespace: string;
  buildFolder: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getBuildHistory
// ====================================================

export interface getBuildHistory_getBuildHistory_rows_status_file {
  status: string | null;
  message: string | null;
}

export interface getBuildHistory_getBuildHistory_rows_status_typings {
  status: string | null;
  message: string | null;
}

export interface getBuildHistory_getBuildHistory_rows_status_module {
  status: string | null;
  message: string | null;
}

export interface getBuildHistory_getBuildHistory_rows_status {
  file: getBuildHistory_getBuildHistory_rows_status_file | null;
  typings: getBuildHistory_getBuildHistory_rows_status_typings | null;
  module: getBuildHistory_getBuildHistory_rows_status_module | null;
}

export interface getBuildHistory_getBuildHistory_rows {
  _id: string | null;
  name: string | null;
  typings: string | null;
  module: string | null;
  metadata: string | null;
  message: string | null;
  hash: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  status: getBuildHistory_getBuildHistory_rows_status | null;
  namespaceId: string | null;
}

export interface getBuildHistory_getBuildHistory {
  count: number | null;
  rows: (getBuildHistory_getBuildHistory_rows | null)[] | null;
}

export interface getBuildHistory {
  getBuildHistory: getBuildHistory_getBuildHistory | null;
}

export interface getBuildHistoryVariables {
  skip?: number | null;
  limit?: number | null;
  where?: BuildWhereType | null;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: listFiles
// ====================================================

export interface listFiles_listFiles_paths {
  path: string | null;
  directory: boolean | null;
  file: boolean | null;
  name: string | null;
}

export interface listFiles_listFiles {
  paths: (listFiles_listFiles_paths | null)[] | null;
}

export interface listFiles {
  listFiles: listFiles_listFiles | null;
}

export interface listFilesVariables {
  folder: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: readFile
// ====================================================

export interface readFile_readFile {
  package: string | null;
  file: string | null;
}

export interface readFile {
  readFile: readFile_readFile | null;
}

export interface readFileVariables {
  folder: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: saveFile
// ====================================================

export interface saveFile_saveFile {
  package: string | null;
  file: string | null;
}

export interface saveFile {
  saveFile: saveFile_saveFile | null;
}

export interface saveFileVariables {
  folder: string;
  content: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getNamespace
// ====================================================

export interface getNamespace_getNamespace_builds_status_file {
  status: string | null;
  message: string | null;
}

export interface getNamespace_getNamespace_builds_status_typings {
  status: string | null;
  message: string | null;
}

export interface getNamespace_getNamespace_builds_status_module {
  status: string | null;
  message: string | null;
}

export interface getNamespace_getNamespace_builds_status {
  file: getNamespace_getNamespace_builds_status_file | null;
  typings: getNamespace_getNamespace_builds_status_typings | null;
  module: getNamespace_getNamespace_builds_status_module | null;
}

export interface getNamespace_getNamespace_builds {
  _id: string | null;
  name: string | null;
  typings: string | null;
  module: string | null;
  metadata: string | null;
  message: string | null;
  hash: string | null;
  status: getNamespace_getNamespace_builds_status | null;
  namespaceId: string | null;
}

export interface getNamespace_getNamespace {
  _id: string | null;
  name: string | null;
  builds: (getNamespace_getNamespace_builds | null)[] | null;
}

export interface getNamespace {
  getNamespace: getNamespace_getNamespace | null;
}

export interface getNamespaceVariables {
  id: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: listNamespaces
// ====================================================

export interface listNamespaces_listNamespaces_rows {
  _id: string | null;
  name: string | null;
}

export interface listNamespaces_listNamespaces {
  count: number | null;
  rows: (listNamespaces_listNamespaces_rows | null)[] | null;
}

export interface listNamespaces {
  listNamespaces: listNamespaces_listNamespaces | null;
}

export interface listNamespacesVariables {
  limit: number;
  skip: number;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

// null
export interface BuildWhereType {
  namespaceId?: string | null;
  name?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================