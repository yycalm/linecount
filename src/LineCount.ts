
import * as vscode from 'vscode';
//import {Uri,TextDocument,Position} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default class LineCount {
      
    private out:any;
    private eol:string;
    private encoding:string;
    private includes:string;
    private excludes:string;
    private outdir:string;
    private outpath:string;    
    private outtype:any;
    private filelist:Array<Object>;
    private builtinRule:Array<Object>;
    private configRule:Array<Object>;

    public  showStatusBarItem:boolean;
    public  EXTENSION_NAME:string;
    public  EXTENSION_VERSION:string;
    
    constructor(context: vscode.ExtensionContext) {  

        this.filelist = new Array();
        this.builtinRule = new Array();
        this.configRule = new Array();
        
        this.EXTENSION_NAME = 'linecount';
        this.EXTENSION_VERSION = '0.1.0';
        console.log('vscode extensions num is '+vscode.extensions.all.length);
        for(var i=0; i<vscode.extensions.all.length; i++){
            let ext = vscode.extensions.all[i];
            if(ext.id=='yycalm.linecount'){
            // if(!ext.packageJSON.isBuiltin){
            //     if(path.normalize(ext.extensionPath)==path.normalize(context.extensionPath)){
                    this.EXTENSION_NAME = ext.packageJSON.name;
                    this.EXTENSION_VERSION = ext.packageJSON.version;           
                     break;                    
            //     }
             }
        }
        // let fname = path.join(context.extensionPath,"package.json");
        // let data = fs.readFileSync(fname,"utf8");  
        // fs.readFile(fname,"utf8",(err,data)=>{
        //     if(err){
        //         this.EXTENSION_NAME = "LineCount";
        //         this.EXTENSION_VERSION = "0.0.1";                       
        //     }else{
        //         let pkg = JSON.parse(data);
        //         this.EXTENSION_NAME = pkg.name;
        //         this.EXTENSION_VERSION = pkg.version;           
        //     }
        // });       

        this.builtinRule.length = 0;
        this.builtinRule['c']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true}};
        this.builtinRule['cpp']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true}};
        this.builtinRule['java']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true}};
        this.builtinRule['js']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true,"singlequotes": true}};
        this.builtinRule['ts']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true,"singlequotes": true}};
        this.builtinRule['pas']={"linecomment":"//","blockstart":"{","blockend":"}","string":{"doublequotes": true}};
        this.builtinRule['css']={"linecomment":"//","blockstart":"/*","blockend":"*/","string":{"doublequotes": true}};
        this.builtinRule['sql']={"linecomment":"--","blockstart":"/*","blockend":"*/","string":{"singlequotes": true}};
        this.builtinRule['html']={"blockstart":"<!--","blockend":"-->","string":{"doublequotes": true}};
        this.builtinRule['xml']={"blockstart":"<!--","blockend":"-->","string":{"doublequotes": true}};
        this.builtinRule['py']={"linecomment":"#","blockstart":"'''","blockend":"'''","string":{"doublequotes": true,"singlequotes": true}};
        this.builtinRule['perl']={"linecomment":"#","blockstart":"=pod","blockend":"=cut","string":{"doublequotes": true,"singlequotes": true}};
        this.builtinRule['pl']={"linecomment":"#","blockstart":"=pod","blockend":"=cut","string":{"doublequotes": true,"singlequotes": true}};
        this.builtinRule['pm']={"linecomment":"#","blockstart":"=pod","blockend":"=cut"};
        this.builtinRule['rb']={"linecomment":"#","blockstart":"=begin","blockend":"=end"};
        this.builtinRule['jsp']={"blockstart":"<%--","blockend":"--%>","string":{"doublequotes": true}};
        this.builtinRule['vb']={"linecomment":"'"};
        this.builtinRule['bas']={"linecomment":"'"};
        this.builtinRule['vbs']={"linecomment":"'"};
        this.builtinRule['bat']={"linecomment":"rem "};
        this.builtinRule['sh']={"linecomment":"#"};
        this.builtinRule['ini']={"linecomment":";"};
        this.builtinRule['for']={"linecomment":"!"};
        this.builtinRule['m']={"linecomment":"%"};

        //this.getConfig();

    }

    public getConfig(){
        
        if (!this.out) {
            this.out = vscode.window.createOutputChannel(this.EXTENSION_NAME);
        }

        let conf = vscode.workspace.getConfiguration("LineCount");
        this.showStatusBarItem = conf.get("showStatusBarItem",true);
        this.eol =  conf.get("eol","\r\n");
        this.encoding =  conf.get("encoding","utf8");
        if(this.encoding.toLowerCase() =="gbk"){
            this.encoding="utf8";
        }
 
        this.includes = "{"+conf.get("includes","*.*").toString()+"}";
        let s = conf.get("excludes","**/.vscode/**,**/node_modules/**").toString();
        this.excludes = "{"+s+',**/'+this.EXTENSION_NAME+'.txt,**/'+this.EXTENSION_NAME+'.json,**/'+this.EXTENSION_NAME+'.csv}';
        //console.log(this.includes);
        //console.log(this.excludes);

        this.outtype = conf.get("output",{"txt":true,"json":false,"outdir":"out"});
        this.outdir = conf.get("outdir","out").toString();
        this.outpath =path.join(vscode.workspace.rootPath, this.outdir);       
        //console.log(this.outtype);
        //console.log(this.outdir);
        //console.log(this.outpath);
       
        this.configRule.length = 0; 
        let comment = conf.get('comment');
        for (var key in comment) {
            if (comment.hasOwnProperty(key)) {
                var element = comment[key];
                var extlist = element['ext'];
             
                for (var ext in extlist) {
                    if (extlist.hasOwnProperty(ext)) {
                        var extname = extlist[ext];
                        this.configRule[extname]=element['separator'];                     
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
            //this.out.appendLine('The current file does not exist!');
            vscode.window.showInformationMessage('No file open!');
            return;
        }

        let doc = editor.document;
        let rule = this.getRule(doc.fileName);
        
        let linenum = this.parseRule(doc.getText(), rule);

        this.out.show();
        this.out.appendLine(doc.fileName+' file lines count:');
        this.out.appendLine(`   code is ${linenum.code} `+(linenum.code>1?'lines.':'line.'));
        this.out.appendLine(`   comment is ${linenum.comment} `+(linenum.comment>1?'lines.':'line.'));
        this.out.appendLine(`   blank is ${linenum.blank} `+(linenum.blank>1?'lines.':'line.'));

    }

    public countWorkspace() { 
        if(!vscode.workspace.rootPath){
             vscode.window.showInformationMessage('No workspace open!');
             return;
        }

        let dir = path.join(vscode.workspace.rootPath, path.sep);

        let failnum = 0;
        this.filelist.length = 0;
        //this.filelist.splice(0,this.filelist.length);
        let total = { files:0, code: 0, comment: 0, blank: 0 };

        let ff = vscode.workspace.findFiles(this.includes, this.excludes);
        ff.then((files: vscode.Uri[])=>{
            files.forEach((file:vscode.Uri)=>{   
                 
                 fs.readFile(file.fsPath, this.encoding, (err, data)=>{   
                    if(err){
                        failnum++;
                    }else {
                        let rule = this.getRule(file.fsPath);
                        let linenum = this.parseRule(data,rule);
                        //去掉前缀目录名
                        linenum.filename=file.fsPath.replace(dir,"");
                        this.filelist.push(linenum);
                        total.code=total.code+linenum.code;
                        total.comment=total.comment+linenum.comment;
                        total.blank=total.blank+linenum.blank;
                        if(this.filelist.length+failnum==files.length){
                            this.outFile(total);    
                        }
                    }
                });            
            });
        });       
           
    }

    //根据注释规则解析内容，返回行数对象
    private parseRule(text:string, sep:any):any{  
        let line_enable:boolean = sep.hasOwnProperty('linecomment');
        let linecomment:string = sep['linecomment'];
        let block_enable:boolean =  (sep.hasOwnProperty('blockstart') && sep.hasOwnProperty('blockend'));
        let blockstart:string = sep['blockstart'];
        let blockend:string = sep['blockend'];
        let linestart:boolean =  (sep.hasOwnProperty('linestart') && sep['linestart']);

        let doublequotes:boolean = true;
        let singlequotes:boolean = false;
        if(sep.hasOwnProperty('string')){
            let quotes = sep['string'];
            doublequotes = (quotes.hasOwnProperty('doublequotes') && quotes['doublequotes']);
            singlequotes = (quotes.hasOwnProperty('singlequotes') && quotes['singlequotes']);
        }
        //let continuationmark = sep['continuationmark'];
            // console.log(line_enable);
            // console.log(linecomment);
            // console.log(block_enable);
            // console.log('doublequotes'+doublequotes);
            // console.log('singlequotes'+singlequotes);
            
        let result = { blank: 0, code: 0, comment: 0 };
        let lineFlag = 0;
        
        let len1 = linecomment.length;
        let len2 = blockstart.length;
        let len3 = blockend.length;
        for(var i=0; i<text.length; i++){
            if(text.charAt(i) ===' ' || text.charAt(i) ==='\t' || text.charAt(i) ==='\r') continue;
            else if(line_enable && text.substr(i,len1)===linecomment){ 
                if(!linestart || lineFlag===0){
                    result.comment++; i+=len1; 
                    while(i<text.length && text.charAt(i)!=='\n')i++; 
                    lineFlag = 0;
                }else{
                    lineFlag = 1;   
                }
            }
            else if(block_enable && text.substr(i,len2)===blockstart){
                result.comment++; i+=len2;
                while(i<text.length && text.substr(i,len3)!==blockend){
                    if(text.charAt(i)==='\n')result.comment++;
                    i++;
                }
                lineFlag = 2;
            }
            else if(doublequotes && text.charAt(i)==='"'){ i++; while(i<text.length && text.charAt(i)!=='"'){if(text.charAt(i)==='\\')i++;i++;}}
            else if(singlequotes && text.charAt(i)==='\''){ i++; while(i<text.length && text.charAt(i)!=='\''){if(text.charAt(i)==='\\')i++;i++;}}
            else if(text.charAt(i)==='\n'){ 
                if(lineFlag===0)result.blank++; 
                else if(lineFlag===1)result.code++;
                lineFlag = 0;
            }
            else lineFlag = 1;
        }

        return result;
    }

    private getRule(filename:string):any{
        let ext = path.extname(filename).replace('.',"");
        //console.log(ext);
        if(this.configRule.hasOwnProperty(ext)){
            return this.configRule[ext];
        }else
        if(this.configRule.hasOwnProperty('*')){
            return this.configRule['*'];
        }else
        if(this.builtinRule.hasOwnProperty(ext)){
            return this.builtinRule[ext];
        }else
        if(this.builtinRule.hasOwnProperty('*')){
            return this.builtinRule['*'];
        }else
        if(this.builtinRule.hasOwnProperty('c')){
            return this.builtinRule['c'];
        }else{
            return {"linecomment":"//","blockstart":"/*","blockend":"*/"};
        }
    }

    private outFile(total:any){
        this.out.show();
        this.out.appendLine(vscode.workspace.rootPath+" workspace lines count: ");
        this.out.appendLine("   total files : "+this.filelist.length.toString());
        this.out.appendLine("   total code lines : "+total['code']);
        this.out.appendLine("   total comment lines : "+total['comment']);
        this.out.appendLine("   total blank lines : "+total['blank']);

        if(!fs.existsSync(this.outpath)){
            fs.mkdirSync(this.outpath);
        }

        if(this.outtype.txt){
            this.out_txt(total);
        }
        if(this.outtype.json){
            this.out_json(total);
        }
        if(this.outtype.csv){
            this.out_csv(total);
        }

    }

    private out_txt(total:any){
        let filename = path.join(this.outpath, this.EXTENSION_NAME+'.txt');
        console.log(filename);        
        
        if(!fs.existsSync(filename)){
            let fd = fs.openSync(filename, 'w');
            //fs.closeSync(fd);
        }
        vscode.workspace.openTextDocument(filename).then((doc) => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.One, true).then((e) => {
                let startline = doc.lineCount;
                let line = startline+1;
                e.edit(edit => {
 
                    let sepline = new Array(80).join("=");
                    edit.insert(new vscode.Position(line++, 0), sepline+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "EXTENSION NAME : "+this.EXTENSION_NAME+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "EXTENSION VERSION : "+this.EXTENSION_VERSION+this.eol);
                    edit.insert(new vscode.Position(line++, 0), new Array(80).join("-")+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "count time : "+this.getDateTime()+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "count workspace : "+vscode.workspace.rootPath+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "total files : "+this.filelist.length.toString()+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "total code lines : "+total['code']+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "total comment lines : "+total['comment']+this.eol);
                    edit.insert(new vscode.Position(line++, 0), "total blank lines : "+total['blank']+this.eol);
                    edit.insert(new vscode.Position(line++, 0), this.eol);
                     
                    for (var key in this.filelist) {
                        if (this.filelist.hasOwnProperty(key)) {
                            var obj = this.filelist[key];
                            edit.insert(new vscode.Position(line++, 0), obj['filename']+", code is "+obj['code']+", comment is "+obj['comment']+ ", blank is "+obj['blank']+'.'+ this.eol);
                          
                        }
                    }

                    edit.insert(new vscode.Position(line++, 0), sepline+this.eol);
                });
                e.document.save();
               // console.log("startline:"+startline.toString());
                //console.log("lineCount:"+line.toString());
                e.revealRange(new vscode.Range(startline, 0, startline+line, 0));

                this.out.appendLine("count output to file : "+filename);


           });
        });
    }

    private out_json(total:any){
        let filename = path.join(this.outpath,this.EXTENSION_NAME+'.json');
        let obj:any;
        if(fs.existsSync(filename)){
            let json = fs.readFileSync(filename, this.encoding);
            let reg1 = /\/\/.*/g;
            let reg2 = /\/\*[\s\S]*?\*\//g;
            let s1 = json.replace(reg2,(sub,offset,text)=>{
                let isin = this.inString(text,offset);
                if(isin) return  sub;
                else return '';
            });
            let s2 = s1.replace(reg1,(sub,offset,text)=>{
                let isin = this.inString(text,offset);
                if(isin) return  sub;
                else return '';
            });

            try{
                obj = JSON.parse(s2);
                if(!obj.hasOwnProperty('extension')){
                    obj['extension'] = this.EXTENSION_NAME;
                }
                if(!obj.hasOwnProperty('version')){
                    obj['version'] = this.EXTENSION_VERSION;
                }
                if(!obj.hasOwnProperty('workspace')){
                    obj['workspace'] = vscode.workspace.rootPath;
                }
                if(!obj.hasOwnProperty('linecount')){
                    obj['linecount'] = [];
                }
            }catch(err){
                obj = undefined;
                this.out.appendLine("read json file fail! "+filename);                
            }
        }
        
        if(!obj){
            obj={"extension":this.EXTENSION_NAME,
                "version":this.EXTENSION_VERSION,
                "workspace":vscode.workspace.rootPath,
                "linecount":[]
            };
        }

        let item={"version":this.EXTENSION_VERSION,
                "counttime":this.getDateTime(),
                "filenum":this.filelist.length,
                "codenum":total['code'],
                "commentnum":total['comment'],
                "blanknum":total['blank'],
                "filelist":[]
            };

        for (var key in this.filelist) {
            if (this.filelist.hasOwnProperty(key)) {
                var element = this.filelist[key];
                item['filelist'].push(element);                
            }
        }

        obj['linecount'].push(item);

        let data = JSON.stringify(obj, null, 4);        
        fs.writeFile(filename,data,(err)=>{
            if(err){
                this.out.appendLine("count output to json file fail! "+filename);                
            }else{
                this.out.appendLine("count output to file : "+filename);                
            }
        });
        
    }

    private out_csv(total:any){
        let filename = path.join(this.outpath,this.EXTENSION_NAME+'.csv');
 
        if(!fs.existsSync(filename)){
            //let fd = fs.openSync(filename, 'w');
            //fs.closeSync(fd);
        }
        
    }
   
    /////////////////////////////////////
    //低耦合函数：
    private inString(text:string,offset:number):boolean{
        let isin = false;
        var pos = text.indexOf('"');
        while(pos>=0){
            if(pos<offset){
                if(pos==0 || text.charAt(pos-1)!='\\'){
                    isin = !isin;
                }
            }else{
                break;
            }
            pos = text.indexOf('"', pos+1);
        }
        return isin;        
    }

    private getDateTime():string {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var day = date.getDate();
        let smonth = month.toString();
        if (month >= 1 && month <= 9) {
            smonth = "0" + month;
        }
        let sday = day.toString();
        if (day >= 0 && day <= 9) {
            sday = "0" + day;
        }
        let shour = date.getHours().toString();
        if (date.getHours() >= 0 && date.getHours() <= 9) {
            shour = "0" + shour;
        }
        let sminutes = date.getMinutes().toString();
        if (date.getMinutes() >= 0 && date.getMinutes() <= 9) {
            sminutes = "0" + sminutes;
        }
        let sseconds = date.getSeconds().toString();
        if (date.getSeconds() >= 0 && date.getSeconds() <= 9) {
            sseconds = "0" + sseconds;
        }
        let currentdate = date.getFullYear() + seperator1 + smonth + seperator1 + sday
                + " " + shour + seperator2 + sminutes + seperator2 + sseconds;
        return currentdate;
    } 

    dispose() {  //实现dispose方法
        this.out.dispose();
    }
}
