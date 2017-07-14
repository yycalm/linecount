import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from './util';
import './types/interfaces';

export default class LineCount {
  private out: any;
  private eol: string;
  private encoding: string;
  private includes: string;
  private excludes: string;
  private outpath: string;
  private listsort: string;
  private listorder: string;
  private outtype: any;
  private filelist: Array<Object>;
  private builtinRule: Array<Object>;
  private configRule: Array<Object>;

  public showStatusBarItem: boolean;
  public EXTENSION_NAME: string;
  public EXTENSION_VERSION: string;

  private sepline2: string; // double line seperator between detail
  private sepline1: string; // single line seperator in detail, aka markdown seperator

  constructor(context: vscode.ExtensionContext) {
    this.filelist = new Array();
    this.builtinRule = new Array();
    this.configRule = new Array();

    this.sepline2 = new Array(80).join('=');
    this.sepline1 = new Array(80).join('-');

    this.EXTENSION_NAME = 'linecount';
    this.EXTENSION_VERSION = '0.1.8';

    let ext = vscode.extensions.getExtension('yycalm.linecount');
    if (ext !== undefined) {
      this.EXTENSION_NAME = ext.packageJSON.name;
      this.EXTENSION_VERSION = ext.packageJSON.version;
    }

    this.builtinRule.length = 0;
    let cstyle = {
      linecomment: '//',
      blockstart: '/*',
      blockend: '*/',
      string: { doublequotes: true, singlequotes: true },
    };
    this.builtinRule['c'] = cstyle;
    this.builtinRule['cpp'] = cstyle;
    this.builtinRule['h'] = cstyle;
    this.builtinRule['hpp'] = cstyle;
    this.builtinRule['java'] = cstyle;
    this.builtinRule['js'] = cstyle;
    this.builtinRule['ts'] = cstyle;
    this.builtinRule['css'] = cstyle;
    this.builtinRule['cs'] = cstyle;
    this.builtinRule['jsp'] = cstyle;
    let podstyle = {
      linecomment: '#',
      blockstart: '=pod',
      blockend: '=cut',
      blocktol: true,
      string: { doublequotes: true, singlequotes: true },
    };
    this.builtinRule['perl'] = podstyle;
    this.builtinRule['pl'] = podstyle;
    this.builtinRule['pm'] = podstyle;
    this.builtinRule['py'] = {
      linecomment: '#',
      blockstart: "'''",
      blockend: "'''",
      string: { doublequotes: true, singlequotes: true },
    };
    this.builtinRule['rb'] = {
      linecomment: '#',
      blockstart: '=begin',
      blockend: '=end',
      blocktol: true,
    };
    this.builtinRule['sql'] = {
      linecomment: '--',
      blockstart: '/*',
      blockend: '*/',
      string: { doublequotes: false, singlequotes: true },
    };
    this.builtinRule['pas'] = {
      linecomment: '//',
      blockstart: '{*',
      blockend: '*}',
      string: { doublequotes: true, singlequotes: true },
    };
    let vbstyle = {
      linecomment: "'",
      string: { doublequotes: true, singlequotes: false },
    };
    this.builtinRule['vb'] = vbstyle;
    this.builtinRule['bas'] = vbstyle;
    this.builtinRule['vbs'] = vbstyle;
    let htmstyle = { blockstart: '<!--', blockend: '-->' };
    this.builtinRule['html'] = htmstyle;
    this.builtinRule['xml'] = htmstyle;
    this.builtinRule['bat'] = { linecomment: '::' };
    this.builtinRule['sh'] = { linecomment: '#', linetol: true };
    this.builtinRule['ini'] = { linecomment: ';', linetol: true };
    this.builtinRule['for'] = { linecomment: '!' };
    this.builtinRule['m'] = { linecomment: '%' };

    // this.getConfig(); //初始化放在入口函数中
  }

  public getConfig() {
    // vscode.window.showInformationMessage('getConfig!');

    if (!this.out) {
      this.out = vscode.window.createOutputChannel(this.EXTENSION_NAME);
    }

    let conf = vscode.workspace.getConfiguration('LineCount');
    this.showStatusBarItem = conf.get('showStatusBarItem', true);
    this.eol = conf.get('eol', '\r\n');
    this.encoding = conf.get('encoding', 'utf8');
    if (this.encoding.toLowerCase() == 'gbk') {
      this.encoding = 'utf8'; // node.js不支持gbk编码
    }

    this.outtype = conf.get('output', {
      txt: true,
      json: false,
      csv: false,
      md: false,
      outdir: 'out',
    });
    if (!vscode.workspace.rootPath) {
      this.outpath = './' + this.outtype.outdir;
    } else {
      this.outpath = path.join(vscode.workspace.rootPath, this.outtype.outdir);
    }

    this.listsort = conf.get('sort', 'filename');
    this.listorder = conf.get('order', 'asc');

    this.includes = '{' + conf.get('includes', '*.*').toString() + '}';
    let s = conf.get('excludes', '**/.vscode/**,**/node_modules/**').toString();
    this.excludes = `{'${s},\
      **/${this.EXTENSION_NAME}.txt,\
      **/${this.EXTENSION_NAME}.json,\
      **/${this.EXTENSION_NAME}.csv}`;

    this.configRule.length = 0;
    let comment = conf.get('comment');
    for (var key in comment) {
      if (comment.hasOwnProperty(key)) {
        var element = comment[key];
        var extlist = element['ext'];

        for (var ext in extlist) {
          if (extlist.hasOwnProperty(ext)) {
            var extname = extlist[ext];
            this.configRule[extname] = element['separator'];
          }
        }
      }
    }
  }

  // Get the current lines count
  public countCurrentFile() {
    // Get the current text editor
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No open file!');
      return;
    }

    let doc = editor.document;
    let rule = this.getRule(doc.fileName);

    let linenum = this.parseRule(doc.getText(), rule);

    this.out.show();
    this.out.appendLine(doc.fileName + ' file lines count:');
    this.out.appendLine(
      `   code is ${linenum.code} ` + (linenum.code > 1 ? 'lines.' : 'line.')
    );
    this.out.appendLine(
      `   comment is ${linenum.comment} ` +
        (linenum.comment > 1 ? 'lines.' : 'line.')
    );
    this.out.appendLine(
      `   blank is ${linenum.blank} ` + (linenum.blank > 1 ? 'lines.' : 'line.')
    );
  }

  public countWorkspace() {
    if (!vscode.workspace.rootPath) {
      vscode.window.showInformationMessage('No open workspace!');
      return;
    }

    let dir = path.join(vscode.workspace.rootPath, path.sep);

    let failnum = 0;
    this.filelist.length = 0;
    let total = { files: 0, code: 0, comment: 0, blank: 0 };

    let ff = vscode.workspace.findFiles(this.includes, this.excludes);
    ff.then((files: vscode.Uri[]) => {
      files.forEach((file: vscode.Uri) => {
        fs.readFile(file.fsPath, this.encoding, (err, data) => {
          if (err) {
            failnum++;
          } else if (this.isBinaryFile(file.fsPath, data)) {
            let fn = file.fsPath.replace(dir, '');
            let linenum = {
              filename: fn,
              isbinaryfile: true,
              blank: 0,
              code: 0,
              comment: 0,
            };
            this.filelist.push(linenum);
          } else {
            let rule = this.getRule(file.fsPath);
            let linenum = this.parseRule(data, rule);
            // 去掉前缀目录名
            linenum.filename = file.fsPath.replace(dir, '');
            this.filelist.push(linenum);
            total.code = total.code + linenum.code;
            total.comment = total.comment + linenum.comment;
            total.blank = total.blank + linenum.blank;
          }
          if (this.filelist.length + failnum == files.length) {
            this.outFile(total);
          }
        });
      });
    });
  }

  private isBinaryFile(filename: string, text: string): boolean {
    // 判断扩展名是否定义
    let ext = path.extname(filename).replace('.', '');
    if (
      this.configRule.hasOwnProperty(ext) ||
      this.builtinRule.hasOwnProperty(ext)
    ) {
      return false;
    }

    // 判断文件bom头
    let bom = [
      text.charCodeAt(0),
      text.charCodeAt(1),
      text.charCodeAt(2),
      text.charCodeAt(3),
    ];
    if (
      (bom[0] == 0xef && bom[1] === 0xbb && bom[2] == 0xbf) || //UTF8
      (bom[0] == 0xfe && bom[1] == 0xff) || //UTF16 大端序
      (bom[0] == 0xff && bom[1] == 0xfe) || //UTF16 小端序
      (bom[0] == 0 && bom[1] == 0 && bom[2] == 0xfe && bom[3] == 0xff) || //UTF-32（大端序）
      (bom[0] == 0xff && bom[1] == 0xfe && bom[2] == 0 && bom[3] == 0) //UTF-32（小端序）
    ) {
      return false;
    }

    // 判断文件内容
    let flag = 0;
    for (let i = 4; i < text.length && i < 256; i++) {
      let cc = text.charCodeAt(i);
      if (cc === 9 || cc === 10 || cc === 13) continue;
      else if (cc < 32 || (cc > 127 && cc < 160)) flag++;
      if (flag > 2) break;
    }
    return flag > 2;
  }

  /**
     * 根据注释规则解析内容，返回行数对象
     * @param text
     * @param sep
     */
  private parseRule(text: string, sep: any): any {
    let block_enable: boolean = sep['blockstart'] && sep['blockend'];
    let doublequotes: boolean = true;
    let singlequotes: boolean = true;
    if (sep.hasOwnProperty('string')) {
      let quotes = sep['string'];
      if (quotes.hasOwnProperty('doublequotes'))
        doublequotes = quotes['doublequotes'];
      if (quotes.hasOwnProperty('singlequotes'))
        singlequotes = quotes['singlequotes'];
    }

    let cmtlen = { line: 0, b1: 0, b2: 0 };
    if (sep.linecomment) cmtlen.line = sep.linecomment.length;
    if (block_enable) {
      cmtlen.b1 = sep.blockstart.length;
      cmtlen.b2 = sep.blockend.length;
    }

    let result = { blank: 0, code: 0, comment: 0 };
    let newline: boolean = true;

    for (var i = 0; i < text.length; i++) {
      if (
        text.charAt(i) === ' ' ||
        text.charAt(i) === '\t' ||
        text.charAt(i) === '\r'
      )
        continue;
      else if (sep.linecomment && text.substr(i, cmtlen.line) === sep.linecomment) {
        if (!sep.linetol || newline) {
          result.comment++;
          i += cmtlen.line;
          while (i < text.length && text.charAt(i) !== '\n') i++;
          newline = true;
        }
      } else if (
        block_enable &&
        text.substr(i, cmtlen.b1) === sep.blockstart &&
        (!sep.blocktol || newline)
      ) {
        let comment = 0;
        if (newline) comment++;
        i += cmtlen.b1;
        while (i < text.length && text.substr(i, cmtlen.b2) !== sep.blockend) {
          if (text.charAt(i) === '\n') comment++;
          i++;
        }
        result.comment += comment;
        if (i < text.length) i += cmtlen.b2;
        while (
          i < text.length &&
          (text.charAt(i) === ' ' ||
            text.charAt(i) === '\t' ||
            text.charAt(i) === '\r')
        )
          i++;
        newline = text.charAt(i) === '\n' || comment > 0;
      } else if (doublequotes && text.charAt(i) === '"') {
        i++;
        while (i < text.length && text.charAt(i) !== '"') {
          if (text.charAt(i) === '\\') i++;
          i++;
        }
      } else if (singlequotes && text.charAt(i) === "'") {
        i++;
        while (i < text.length && text.charAt(i) !== "'") {
          if (text.charAt(i) === '\\') i++;
          i++;
        }
      } else if (text.charAt(i) === '\n') {
        if (newline) result.blank++;
        else newline = true;
      } else if (newline) {
        result.code++;
        newline = false;
      }
    }
    return result;
  }

  private getRule(filename: string): any {
    let ext = path.extname(filename).replace('.', '');
    if (this.configRule.hasOwnProperty(ext)) {
      return this.configRule[ext];
    } else if (this.configRule.hasOwnProperty('*')) {
      return this.configRule['*'];
    } else if (this.builtinRule.hasOwnProperty(ext)) {
      return this.builtinRule[ext];
    } else if (this.builtinRule.hasOwnProperty('*')) {
      return this.builtinRule['*'];
    } else if (this.builtinRule.hasOwnProperty('c')) {
      return this.builtinRule['c'];
    } else {
      return { linecomment: '//', blockstart: '/*', blockend: '*/' };
    }
  }

  private outFile(total: any) {
    this.out.show();
    this.out.appendLine(vscode.workspace.rootPath + ' workspace lines count: ');
    this.out.appendLine('   total files : ' + this.filelist.length.toString());
    this.out.appendLine('   total code lines : ' + total['code']);
    this.out.appendLine('   total comment lines : ' + total['comment']);
    this.out.appendLine('   total blank lines : ' + total['blank']);

    if (!fs.existsSync(this.outpath)) {
      fs.mkdirSync(this.outpath);
    }

    // 排序
    this.filelist.sort((a, b) => {
      if (this.listorder == 'asc') {
        if (this.listsort == 'code') {
          return a['code'] - b['code'];
        } else if (this.listsort == 'comment') {
          return a['comment'] - b['comment'];
        } else if (this.listsort == 'blank') {
          return a['blank'] - b['blank'];
        } else if (this.listsort == 'totalline') {
          return (
            a['code'] +
            a['comment'] +
            a['blank'] -
            (b['code'] + b['comment'] + b['blank'])
          );
        } else {
          if (a['filename'].toLowerCase() > b['filename'].toLowerCase()) return 1;
          else if (a['filename'].toLowerCase() < b['filename'].toLowerCase())
            return -1;
          else return 0;
        }
      } else {
        if (this.listsort == 'code') {
          return b['code'] - a['code'];
        } else if (this.listsort == 'comment') {
          return b['comment'] - a['comment'];
        } else if (this.listsort == 'blank') {
          return b['blank'] - a['blank'];
        } else if (this.listsort == 'totalline') {
          return (
            b['code'] +
            b['comment'] +
            b['blank'] -
            (a['code'] + a['comment'] + a['blank'])
          );
        } else {
          if (b['filename'].toLowerCase() > a['filename'].toLowerCase()) return 1;
          else if (b['filename'].toLowerCase() < a['filename'].toLowerCase())
            return -1;
          else return 0;
        }
      }
    });

    if (this.outtype.txt) {
      this.out_txt(total);
    }
    if (this.outtype.json) {
      this.out_json(total);
    }
    if (this.outtype.csv) {
      this.out_csv(total);
    }
    if (this.outtype.md) {
      this.out_md(total);
    }
  }

  private out_txt(total: any) {
    let filename = path.join(this.outpath, this.EXTENSION_NAME + '.txt');
    console.log(filename);

    if (!fs.existsSync(filename)) {
      let fd = fs.openSync(filename, 'w');
      //fs.closeSync(fd);
    }

    //prepare data
    var data = [];
    data.push(this.sepline2 + this.eol);
    data.push('EXTENSION NAME : ' + this.EXTENSION_NAME + this.eol);
    data.push('EXTENSION VERSION : ' + this.EXTENSION_VERSION + this.eol);
    data.push(this.sepline1 + this.eol);
    data.push('count time : ' + util.getDateTime() + this.eol);
    data.push('count workspace : ' + vscode.workspace.rootPath + this.eol);
    data.push('total files : ' + this.filelist.length.toString() + this.eol);
    data.push('total code lines : ' + total['code'] + this.eol);
    data.push('total comment lines : ' + total['comment'] + this.eol);
    data.push('total blank lines : ' + total['blank'] + this.eol);
    data.push(this.eol);

    for (var key in this.filelist) {
      if (this.filelist.hasOwnProperty(key)) {
        var obj = this.filelist[key];
        if (obj['isbinaryfile']) {
          data.push(`${obj['filename']}, it is a binary file.${this.eol}`);
        } else {
          data.push(
            `${obj['filename']}, code is ${obj['code']}, \
            comment is ${obj['comment']}, \
            blank is ${obj['blank']}.${this.eol}`
          );
        }
      }
    }

    data.push(this.sepline2 + this.eol);

    if (this.outtype.md) {
      fs.appendFile(filename, data.join(''), err => {
        if (err) {
          this.out.appendLine('count output to txt file fail! ' + filename);
        } else {
          this.out.appendLine('count output to file : ' + filename);
        }
      });
      return;
    }

    // open and view this file while write
    vscode.workspace.openTextDocument(filename).then(
      doc => {
        vscode.window.showTextDocument(doc, vscode.ViewColumn.One, true).then(
          e => {
            let startline = doc.lineCount;
            let line = startline + 1;
            e.edit(edit => {
              //now write the line in the data
              for (var i = 0; i < data.length; i++) {
                var element = data[i];
                edit.insert(new vscode.Position(line++, 0), element);
              }
            });
            e.document.save();
            e.revealRange(new vscode.Range(startline, 0, startline + line, 0));

            this.out.appendLine('count output to file : ' + filename);
          },
          err => {
            this.out.appendLine('showTextDocument file fail: ' + filename);
          }
        );
      },
      err => {
        this.out.appendLine('openTextDocument file fail: ' + filename);
      }
    );
  }

  private out_json(total: any) {
    let filename = path.join(this.outpath, this.EXTENSION_NAME + '.json');
    let obj: any;
    if (fs.existsSync(filename)) {
      let json = fs.readFileSync(filename, this.encoding);
      let reg1 = /\/\/.*/g;
      let reg2 = /\/\*[\s\S]*?\*\//g;
      // 删除注释
      let s1 = json.replace(reg2, (sub, offset, text) => {
        let isin = util.inString(text, offset);
        if (isin) return sub;
        else return '';
      });
      let s2 = s1.replace(reg1, (sub, offset, text) => {
        let isin = util.inString(text, offset);
        if (isin) return sub;
        else return '';
      });

      try {
        obj = JSON.parse(s2);
        if (!obj.hasOwnProperty('extension')) {
          obj['extension'] = this.EXTENSION_NAME;
        }
        if (!obj.hasOwnProperty('version')) {
          obj['version'] = this.EXTENSION_VERSION;
        }
        if (!obj.hasOwnProperty('workspace')) {
          obj['workspace'] = vscode.workspace.rootPath;
        }
        if (!obj.hasOwnProperty('linecount')) {
          obj['linecount'] = [];
        }
      } catch (err) {
        obj = undefined;
        fs.renameSync(filename, util.getDateTime + filename + '.bak');
        this.out.appendLine('read json file fail! ' + filename);
      }
    }

    if (!obj) {
      obj = {
        extension: this.EXTENSION_NAME,
        version: this.EXTENSION_VERSION,
        workspace: vscode.workspace.rootPath,
        linecount: [],
      };
    }

    let item = {
      version: this.EXTENSION_VERSION,
      counttime: util.getDateTime(),
      filesum: this.filelist.length,
      codesum: total['code'],
      commentsum: total['comment'],
      blanksum: total['blank'],
      filelist: [],
    };

    for (const key in this.filelist) {
      if (this.filelist.hasOwnProperty(key)) {
        const element = this.filelist[key];
        item['filelist'].push(element);
      }
    }

    obj['linecount'].push(item);

    let data = JSON.stringify(obj, null, 4);
    fs.writeFile(filename, data, err => {
      if (err) {
        this.out.appendLine('count output to json file fail! ' + filename);
      } else {
        this.out.appendLine('count output to file : ' + filename);
      }
    });
  }

  /**
     * translate items list into a CSV format line
     * CSV format: "data1","data2"
     * data may be surrounded with quotation(""), and sperate by comma(,)
     * @param items
     */
  private csv_format(items: any[]): string {
    let data = '';
    for (let i = 0; i < items.length; i++) {
      //surrounded with "" to split field
      items[i] = '"' + items[i] + '"';
    }
    data = items.join(',');
    //data += this.eol;
    return data;
  }

  /**
     * edit file to output data using vscode editor
     * @param filename
     * @param data
     */
  private edit_file(filename: string, data: any[]) {
    vscode.workspace.openTextDocument(filename).then(doc => {
      let startline = doc.lineCount;
      let line = startline + 1;

      vscode.window.showTextDocument(doc, vscode.ViewColumn.One, true).then(e => {
        e.edit(edit => {
          //now write the line in the data
          for (let i = 0; i < data.length; i++) {
            const element = data[i];
            edit.insert(new vscode.Position(line++, 0), element);
          }
        });

        e.document.save();
        e.revealRange(new vscode.Range(startline, 0, startline + line, 0));
        this.out.appendLine('count output to file : ' + filename);
      });
    });
  }

  /**
     * for csv output, there may come a potential error while csv is opened by other applications.
     * @param total
     */
  private out_csv(total: any) {
    let filename = path.join(this.outpath, this.EXTENSION_NAME + '.csv');
    console.log(filename);

    // prepare data
    const data = [];
    data.push(this.sepline2);
    data.push(this.csv_format(['EXTENSION NAME', this.EXTENSION_NAME]));
    data.push(this.csv_format(['EXTENSION VERSION', this.EXTENSION_VERSION]));
    data.push(this.sepline1 + this.eol);
    data.push(this.csv_format(['count time', util.getDateTime()]));
    data.push(this.csv_format(['count workspace', vscode.workspace.rootPath]));
    data.push(this.csv_format(['total files', this.filelist.length.toString()]));
    data.push(this.csv_format(['total code lines', total['code']]));
    data.push(this.csv_format(['total comment lines', total['comment']]));
    data.push(this.csv_format(['total blank lines', total['blank']]));
    data.push(this.eol);

    let items = ['filename', 'code', 'comment', 'blank'];
    data.push(this.csv_format(items));

    for (var key in this.filelist) {
      if (this.filelist.hasOwnProperty(key)) {
        var obj = this.filelist[key];
        if (obj['isbinaryfile']) {
          items = [obj['filename'], 'binary file'];
          data.push(this.csv_format(items));
        } else {
          items = [obj['filename'], obj['code'], obj['comment'], obj['blank']];
          data.push(this.csv_format(items));
        }
      }
    }
    data.push(this.sepline2 + this.eol);
    data.push(this.eol);

    fs.appendFile(filename, data.join(this.eol), err => {
      if (err) {
        this.out.appendLine('count output to csv file fail! ' + filename);
      } else {
        this.out.appendLine('count output to file : ' + filename);
      }
    });
  }

  /**
     * Creates a single, markdown-formatted key:value line
     * @param item
     */
  private md_line_format(item: MD_Line) {
    const twospaces = '  '; // mandatory
    return `${item.label}: **${item.value}**${twospaces}`;
  }

  /**
     * translate items list into a Markdown table format
     * Markdown table format: | data1 | data2 |
     * sperate by split(|)
     * @param items
     */
  private md_table_format(items: any[]) {
    return `|${items.join(' | ')}|`;
  }

  /**
     * for markdown output
     * @param total
     */
  private out_md(total: any) {
    let filename = path.join(this.outpath, this.EXTENSION_NAME + '.md');
    console.log(filename);

    // prepare data
    var data = [];
    data.push(`# Line Count${this.eol}`);
    data.push(`***${this.eol}`);
    data.push(
      this.md_line_format({
        label: 'EXTENSION NAME',
        value: this.EXTENSION_NAME,
      })
    );
    data.push(
      this.md_line_format({
        label: 'EXTENSION VERSION',
        value: this.EXTENSION_VERSION,
      })
    );
    data.push(this.eol + '***' + this.eol); // md needed
    data.push(
      this.md_line_format({
        label: 'Time',
        value: util.getDateTime(),
      })
    );
    data.push(
      this.md_line_format({
        label: 'Workspace',
        value: vscode.workspace.rootPath,
      })
    );
    data.push(
      this.md_line_format({
        label: 'Number of Files',
        value: this.filelist.length.toString(),
      })
    );
    data.push('## TOTALS');
    data.push(this.md_line_format({ label: 'Code Lines', value: total['code'] }));
    data.push(
      this.md_line_format({ label: 'Comment Lines', value: total['comment'] })
    );
    data.push(this.md_line_format({ label: 'Blank Lines', value: total['blank'] }));
    data.push(this.eol);

    data.push('## Breakdown');
    let items = ['Filename', 'Code', 'Comment', 'Blank'];
    data.push(this.md_table_format(items));

    // must add a table header line in md
    var header = new Array(items.length).join('|----');
    data.push(`|${header}|`);

    for (var key in this.filelist) {
      if (this.filelist.hasOwnProperty(key)) {
        var obj = this.filelist[key];
        if (obj['isbinaryfile']) {
          items = [obj['filename'], 'binary file'];
          data.push(this.md_table_format(items));
        } else {
          items = [obj['filename'], obj['code'], obj['comment'], obj['blank']];
          data.push(this.md_table_format(items));
        }
      }
    }
    data.push(`|||||${this.eol}`);
    data.push(`***${this.eol}`);
    data.push(this.eol);

    fs.writeFileSync(filename, data.join(this.eol));

    this.out.appendLine(`Output file : ${filename}`);

    // do not show file, but preview the markdown
    const uri = vscode.Uri.parse(`file:///${filename}`);
    const success = vscode.commands.executeCommand('markdown.showPreview', uri);
  }

  dispose() {
    // 实现dispose方法
    this.out.dispose();
  }
}
