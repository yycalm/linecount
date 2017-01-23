
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
    private commentRule:Array<Object>;
    private configRule:Array<Object>;

    public  EXTENSION_NAME:string;
    public  EXTENSION_VERSION:string;
    
    constructor(context: vscode.ExtensionContext) {  

        this.filelist = new Array();
        this.commentRule = new Array();
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

        this.commentRule.length = 0;
        this.commentRule['c']={"linecomment":"//","blockstart":"/*","blockend":"*/","continuationmark":"\\"};
        this.commentRule['cpp']={"linecomment":"//","blockstart":"/*","blockend":"*/","continuationmark":"\\"};
        this.commentRule['pas']={"linecomment":"//","blockstart":"{","blockend":"}"};
        this.commentRule['vb']={"linecomment":"'"};
        this.commentRule['bas']={"linecomment":"'"};
        this.commentRule['vbs']={"linecomment":"'"};
        this.commentRule['css']={"linecomment":"//","blockstart":"/*","blockend":"*/"};
        this.commentRule['sql']={"linecomment":"--","blockstart":"/*","blockend":"*/"};
        this.commentRule['html']={"blockstart":"<!--","blockend":"-->"};
        this.commentRule['xml']={"blockstart":"<!--","blockend":"-->"};
        this.commentRule['py']={"linecomment":"#","blockstart":"'''","blockend":"'''"};
        this.commentRule['bat']={"linecomment":"rem "};
        this.commentRule['sh']={"linecomment":"#"};
        this.commentRule['ini']={"linecomment":";"};
        this.commentRule['for']={"linecomment":"!"};
        this.commentRule['m']={"linecomment":"%"};
        this.commentRule['perl']={"linecomment":"#","blockstart":"=pod","blockend":"=cut"};
        this.commentRule['pl']={"linecomment":"#","blockstart":"=pod","blockend":"=cut"};
        this.commentRule['pm']={"linecomment":"#","blockstart":"=pod","blockend":"=cut"};
        this.commentRule['rb']={"linecomment":"#","blockstart":"=begin","blockend":"=end"};
        this.commentRule['jsp']={"blockstart":"<%--","blockend":"--%>"};

    }

    private init(){
        console.log("init start");
        if (!this.out) {
            this.out = vscode.window.createOutputChannel(this.EXTENSION_NAME);
        }

        console.log("getConfiguration start");
        let conf = vscode.workspace.getConfiguration("LineCount");
        this.eol =  conf.get("eol","\r\n");
        this.encoding =  conf.get("encoding","utf8");
        if(this.encoding.toLowerCase() =="gbk"){
            this.encoding="utf8";
        }
        console.log(this.encoding);

        this.includes = "{"+conf.get("includes","*.*").toString()+"}";
        let s = conf.get("excludes","**/.vscode/**,**/node_modules/**").toString();
        this.excludes = "{"+s+','+this.EXTENSION_NAME+'.txt,'+this.EXTENSION_NAME+'.json,'+this.EXTENSION_NAME+'.csv}';
        console.log(this.includes);
        console.log(this.excludes);

        this.outtype = conf.get("output",{"txt":true,"json":false,"outdir":"out"});
        this.outdir = conf.get("outdir","out").toString();
        this.outpath =path.join(vscode.workspace.rootPath, this.outdir);       
        console.log(this.outtype);
        console.log(this.outdir);
        console.log(this.outpath);
       
        this.configRule.length = 0; 
        let comment = conf.get('comment');
        for (var key in comment) {
            if (comment.hasOwnProperty(key)) {
                var element = comment[key];
                var extlist = element['ext'];
                //console.log(extlist.toString());
             
                for (var ext in extlist) {
                    if (extlist.hasOwnProperty(ext)) {
                        var extname = extlist[ext];
                        this.configRule[extname]=element['separator'];                     
                    }
                }
            }
        }
       
    }
 
    private parse(text:string):any{        
       let isblock :boolean = false;
       let result = { code: 0, comment: 0, blank: 0 };
       text.split(this.eol).forEach((line) => {
           var ln = line.trim();
           var pos = 0;
           if (isblock) {
                result.comment++;  
                isblock = this.endBlock(ln,"/*","*/");
            } else if(ln.length==0){
                   result.blank++;                  
            } else if (ln.startsWith("//")) {  
                 result.comment++;                 
            } else if (ln.startsWith("/*") && !ln.includes("*/")) {  
                result.comment++;  
                isblock = true;  
            } else if(ln.includes("/*")){
                pos = ln.indexOf("/*");
                isblock = this.endBlock(ln.substring(pos+2,ln.length),"/*","*/");
                if(isblock){
                    result.comment++;  
                }else{
                    result.code++;  
                }
            } else {  
                result.code++;  
            }  

        });

        return result;
    }

    private parseRule(text:string,sep:any):any{  
       let line_enable:boolean = sep.hasOwnProperty('linecomment');
       let linecomment = sep['linecomment'];
       let block_enable:boolean =  (sep.hasOwnProperty('blockstart') && sep.hasOwnProperty('blockend'));
       let blockstart = sep['blockstart'];
       let blockend = sep['blockend'];
       let linestart:boolean =  sep['linestart']; //sep.hasOwnProperty('linestart')
       let continuationmark = sep['continuationmark'];
        console.log(line_enable);
        console.log(linecomment);
        console.log(block_enable);
        console.log(blockstart);
        console.log(blockend);
        
       let isblock :boolean = false;
       let iscode :boolean = false;
       let continueNum : number = 0;
       let result = { code: 0, comment: 0, blank: 0 };

       text.split(this.eol).forEach((line,index,array) => {
           var ln = line.trim();
           var pos = 0;

           //判断是否有续行符号
            if(continuationmark && continueNum>0){
                if(!isblock && ln.endsWith(continuationmark)){
                    continueNum++;
                    return;
                }
            }

            //判断注释
           if (isblock) {
                result.comment++;  
                isblock = !this.endBlock(ln, blockstart, blockend);
                iscode = !isblock;
            } else if(ln.length==0){
                result.blank++;                  
                iscode = false;
            } else if (line_enable && ln.startsWith(linecomment)) {  
                result.comment++;                 
                iscode = false;
            } else if (block_enable && ln.startsWith(blockstart) ) {  
                result.comment++;  
                isblock = !this.endBlock(ln.substring(1,ln.length), blockstart, blockend);
                iscode = !isblock;
            } else if(block_enable && !linestart && ln.includes(blockstart)){
                pos = ln.indexOf(blockstart);
                isblock = !this.endBlock(ln, blockstart, blockend);
                if(isblock){
                    result.comment++;  
                    iscode = false;
                }else{
                    result.code++;  
                    iscode = true;
                }
            } else {  
                result.code++; 
                iscode = true; 
            } 

            //判断是否有续行符号
            if(continuationmark){
                if(iscode && ln.endsWith(continuationmark)){
                    continueNum++;
                }else{
                    continueNum = 0;    
                }
            }

  
        });

        return result;
    }

    private endBlock(line:string, startSep:string, endSep:string):boolean{        
        var pos = 0;
        var isblock = false;
        do
        {
            pos = line.indexOf(endSep,pos);
            if(pos>=0){
                isblock = true;
                do{
                    pos = line.indexOf(startSep, pos+startSep.length);
                    if(pos>0 && !this.inString(line, pos)){
                        isblock = false;
                        break;
                    }
                }while(pos>0);
            }
        }while(pos>=0);

        return isblock;
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
        if(this.commentRule.hasOwnProperty(ext)){
            return this.commentRule[ext];
        }else
        if(this.commentRule.hasOwnProperty('*')){
            return this.commentRule['*'];
        }else{
            return {"linecomment":"//","blockstart":"/*","blockend":"*/"};
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

        this.init();

        let doc = editor.document;
        let rule = this.getRule(doc.fileName);
       
        let linenum = this.parseRule(doc.getText(), rule);

        this.out.show();
        this.out.appendLine(doc.fileName+' file lines count:');
        this.out.appendLine(`   code is ${linenum.code} lines.`);
        this.out.appendLine(`   comment is ${linenum.comment} lines.`);
        this.out.appendLine(`   blank is ${linenum.blank} lines.`);

    }

    public countWorkspace() { 
        if(!vscode.workspace.rootPath){
             vscode.window.showInformationMessage('No workspace open!');
             return;
        }

        this.init();

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
                        total.comment=total.code+linenum.comment;
                        total.blank=total.code+linenum.blank;
                        if(this.filelist.length+failnum==files.length){
                            this.outFile(total);    
                        }
                    }
                });            
            });
        });       
           
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

        let item={"counttime":this.getDateTime(),
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
