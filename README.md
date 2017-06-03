# LineCount README

The LineCount extension for Visual Studio Code counts and displays the lines of code, the lines of comment, the lines of blank. 


[![Version](https://vsmarketplacebadge.apphb.com/version/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

[![Installs](https://vsmarketplacebadge.apphb.com/installs/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

[![Ratings](https://vsmarketplacebadge.apphb.com/rating/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

---

## Features

* Count current file. 

* Count workspace files, you can custom the includes/excludes file pattern.

* Support languages: c,cpp,java,js,ts,cs(`//,/*,*/`),sql(`--,/*,*/`),pas(`//,{*,*}`),perl(`#,=pod,=cut`),ruby(`#,=begin,=end`),python(`#,'''`),vb(`'`),html(`<!--,-->`),bat(`::`),sh(`#`),ini(`;`),fortran(`!`),m(`%`).

* You can customize the comment symbol, add new languages support.

* Line number information can be output to JSON, TXT, CSV, Markdown file.

## Installs

* ext install linecount

* Through Code

    Download source code and install dependencies:

```
git clone https://github.com/yycalm/linecount.git
cd linecount
npm install
code .
```

## Extension Settings
 
* `LineCount.showStatusBarItem`: (boolean|default `true`) Show/hide the status bar item for LineCount commands.
* `LineCount.includes`: (string array|default `"**/*"`) Search files pattern.
* `LineCount.excludes`: (string array|default `"**/.vscode/**,**/node_modules/**"`) files and folders that you want exclude them.
* `LineCount.output.txt`: (boolean | default `true`) Whether output to TXT file.
* `LineCount.output.json`: (boolean | default `true`) Whether output to JSON file.
* `LineCount.output.csv`: (boolean | default `false`) Whether output to CSV file.
* `LineCount.output.md`: (boolean | default `false`) Whether output to markdown file and preview.
* `LineCount.output.outdir`: (string | default `out`) output file path.
* `LineCount.sort`: (string enum | default `filename`) Specifies the sort field.
* `LineCount.order`: (string enum | default `asc`) Specify ascending or descending order.
* `LineCount.comment.ext`: (string array| required) file extension. if it`s "*", the rule for other files. default c style.
* `LineCount.comment.separator.linecomment`: (string |default none) Single line comment symbol.
* `LineCount.comment.separator.linetol`: (boolean |default `false`) Whether the line comment must be started on the line.
* `LineCount.comment.separator.blockstart`: (string |default none) Block start comment symbol.
* `LineCount.comment.separator.blockend`: (string |default none) Block end comment symbol.
* `LineCount.comment.separator.blocktol`: (boolean |default `false`) Whether the block comment must be started on the line.
* `LineCount.comment.separator.string.doublequotes`: (boolean |default `true`) String using double quotes.
* `LineCount.comment.separator.string.singlequotes`: (boolean |default `true`) String using single quotes.

  LineCount configuration examples：

```

    "LineCount.showStatusBarItem": true,

    "LineCount.includes": [     
                        "**/*" 
                        ],    

    "LineCount.excludes": [ 
                         "**/.vscode/**",
                        "**/node_modules/**"
                        ],

    "LineCount.output": {
                        "txt": true,       
                        "json": true, 
                        "csv": true, 
                        "md": true,       
                        "outdir":"out"      
                        },
    "LineCount.sort": "filename",

    "LineCount.order": "asc",

    "LineCount.comment":[
                        {
                            "ext": ["c","cpp","java"], 
                            "separator": {             
                                "linecomment": "//",   
                                "linetol":false,       
                                "blockstart": "/*",    
                                "blockend": "*/",      
                                "blocktol": false,     
                                "string":{
                                    "doublequotes": true,
                                    "singlequotes": true
                                }                                
                            }
                        },
                        {
                            "ext": ["html"], 
                            "separator": {             
                                "blockstart": "<!--",    
                                "blockend": "-->",      
                            }
                        }
                     ]
        

```



## Usage

There are two commands available. 

You can access them from the command palette (Ctrl+Shift+P on Windows/Linux), or click StatusBarItem 'LineCount'.

1. LineCount: Count current file:

![Count current file](https://github.com/yycalm/linecount/blob/master/images/countcurrentfile.gif?raw=true)


2. LineCount: Count Workspace files:

![Count workspace files](https://github.com/yycalm/linecount/blob/master/images/countworkspace.gif?raw=true)


## Support

[Repository](https://github.com/yycalm/linecount)


# License

MIT

-----------------------------------------------------------------------------------------------------------

**Enjoy!**