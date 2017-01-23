'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import  LineCount from './LineCount';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "linecount" is now active!');

    let counter = new LineCount(context);
    context.subscriptions.push(counter);

    let disposable1 = vscode.commands.registerCommand('extension.linecount.currentfile', () => {
        counter.countCurrentFile();
    });
    context.subscriptions.push(disposable1);

    let disposable2 = vscode.commands.registerCommand('extension.linecount.workspace', () => {
        counter.countWorkspace();      
    });
    context.subscriptions.push(disposable2);
    

}

// this method is called when your extension is deactivated
export function deactivate() {
}