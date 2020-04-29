# @rxdi/monorepo

Create easy `monorepo` with typescript

## Features

- No dependencies
- Maintain monorepo with ease
- Created for Typescript
- 13 KB bundled

## Installation

```bash
npm i -g @rxdi/monorepo
```

## Usage

#### Create Empty monorepo

```bash
repo create
```

Following structure will be created

```yml
--root
   -src
     -@apps
     -@lib
     -@shared
```

#### Create `library` module

```bash
repo lib 'lib-name'
```

Will create `library` empty module inside `root/src/@lib`

#### Create `shared` module

```bash
repo shared 'lib-name'
```

Will create `shared` empty module inside `root/src/@shared`

#### Compile monorepo

```bash
repo compile
```

Watch mode

```bash
repo compile --watch
```

#### Start all stacks

```bash
repo run
```

#### Start specific stack

```bash
repo run frontend
```

## Configuration
`repo.json` is default file
You can specify more complex runner stacks by passing `-c` argument with path to `custom` json file like so: `repo run frontend -c ./my-custom.json` or running whole stack `repo run -c ./my-custom.json`
```json
{
  "stacks": {
    "frontend": {
      "options": {
        "cwd": "./src/@apps/frontend/",
        "depends": ["gateway"],
        "signal": "Built in"
      },
      "commands": {
        "clean": "rm -rf .cache",
        "link": "gapi daemon link graphql",
        "run": "npm start"
      }
    },
    "api": {
      "options": {
        "signal": "SIGNAL_MAIN_API_STARTED",
        "cwd": "./src/@apps/api/"
      },
      "commands": {
        "clean": "rm -rf .cache",
        "link": "gapi daemon link graphql",
        "run": "npm start"
      }
    },
    "gateway": {
      "options": {
        "signal": "SIGNAL_GATEWAY_STARTED",
        "depends": ["api", "vscode-cloud"],
        "cwd": "./src/@apps/gateway/"
      },
      "commands": {
        "clean": "rm -rf .cache",
        "link": "gapi daemon link graphql",
        "run": "npm start"
      }
    },
    "vscode-cloud": {
      "options": {
        "signal": "SIGNAL_VS_CODE_STARTED",
        "cwd": "./src/@apps/vscode-cloud/"
      },
      "commands": {
        "clean": "rm -rf .cache",
        "link": "gapi daemon link graphql",
        "run": "npm start"
      }
    },
    "compile": {
      "options": {
        "cwd": ".",
        "depends": ["frontend"]
      },
      "commands": {
        "compile": "repo compile --watch"
      }
    }
  }
}
```