import { Injectable } from '@angular/core';
import { CompletionItemProvider } from 'ngx-monaco';

@Injectable()
export class TravisCompletionProvider implements CompletionItemProvider {
    get language() {
        return 'yaml';
    }

    provideCompletionItems(model: monaco.editor.IReadOnlyModel, position): any {
        // find out if we are completing a property in the 'dependencies' object.
        const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });
        const match = textUntilPosition.match(/"dependencies"\s*:\s*{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*("[^"]*)?$/);
        if (match) {
            return this.createDependencyProposals();
        }
        return [];
    }
    createDependencyProposals() {
        // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
        // here you could do a server side lookup
        return [
            {
                label: '"lodash"',
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: 'The Lodash library exported as Node.js modules.',
                insertText: '"lodash": "*"'
            },
            {
                label: '"express"',
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: 'Fast, unopinionated, minimalist web framework',
                insertText: '"express": "*"'
            },
            {
                label: '"mkdirp"',
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: 'Recursively mkdir, like <code>mkdir -p</code>"',
                insertText: '"mkdirp": "*"'
            }
        ];
    }
}
