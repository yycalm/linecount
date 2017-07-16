import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import LineCount from './LineCount';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "linecount" is now active!');

  let counter = new LineCount(context);
  context.subscriptions.push(counter);

  let status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100
  );
  status.text = 'LineCount';
  status.command = 'extension.linecount.showcommands';
  context.subscriptions.push(status);

  let disposConfig = vscode.workspace.onDidChangeConfiguration(configChanged);
  context.subscriptions.push(disposConfig);

  let disposable1 = vscode.commands.registerCommand(
    'extension.linecount.currentfile',
    countCurrentFile
  );
  context.subscriptions.push(disposable1);

  let disposable2 = vscode.commands.registerCommand(
    'extension.linecount.workspace',
    countWorkspace
  );
  context.subscriptions.push(disposable2);

  let disposable3 = vscode.commands.registerCommand(
    'extension.linecount.showcommands',
    () => {
      const items = [
        {
          label: 'LineCount: Count current file',
          detail: 'Count lines for current file.',
          description: null,
          command: countCurrentFile,
        },
        {
          label: 'LineCount: Count Workspace files',
          detail: 'Count lines for Workspace files.',
          description: null,
          command: countWorkspace,
        },
      ];
      vscode.window
        .showQuickPick(items, { matchOnDetail: true, matchOnDescription: true })
        .then(selectedItem => {
          if (selectedItem && typeof selectedItem.command === 'function') {
            selectedItem.command();
          }
        });
    }
  );
  context.subscriptions.push(disposable3);

  function configChanged() {
    counter.setConfig();
    if (counter.showStatusBarItem) {
      status.show();
    } else {
      status.hide();
    }
  }
  function countCurrentFile() {
    counter.countCurrentFile();
  }
  function countWorkspace() {
    counter.countWorkspace();
  }

  configChanged();
}

export function deactivate() {
  console.log('lineCount deactivated.');
}
