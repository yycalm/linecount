# LineCount README

LineCount 是一个vscode(visual studio code )下的插件，用来统计代码行数。使用TypeScript语言编写。

[![Version](https://vsmarketplacebadge.apphb.com/version/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

[![Installs](https://vsmarketplacebadge.apphb.com/installs/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

[![Ratings](https://vsmarketplacebadge.apphb.com/rating/yycalm.linecount.svg)](https://marketplace.visualstudio.com/items?itemName=yycalm.linecount)

---

## 功能

1. 可以统计当前文档的代码行数，注释行数和空行数。

2. 可以统计当前工作区指定类型文件的代码行数，注释行数和空行数。

3. 内置十几种语言支持，如常见的c,cpp,java,jsp,sql,css,html,python等。

4. 可以自定义语言注释符号，新增未知语言支持。

5. 统计行数信息可以输出到txt和json文档，以累加方式输出，便于日后查看统计。

## 安装

1. 在vscode中按F1，输入ext install linecount安装。

2. 在vscode扩展应用商店中搜索linecount安装。

3. 通过源码安装：

```
git clone https://github.com/yycalm/linecount.git
cd linecount
npm install
code .
```

## 配置

LineCount configuration：

```
    //统计包含的文件
    "LineCount.includes": [     
                        "**/*" 
                        ]         
    
    //统计排除的文件夹和文件                 
    "LineCount.excludes": [ 
                         "**/.vscode/**",
                        "**/node_modules/**"
                        ]

    //输出文件和目录   
    "LineCount.output": [
                         "txt": true,       //是否输出txt文件
                        "json": true,       //是否输出json文件
                        "outdir":"out"      //输出目录
                        ]

    //定义注释符号
    "LineCount.comment":[
                        {
                            "ext": [
                                "c","cpp","java"        //文件的扩展名
                            ],
                            "separator": {              //注释符号
                                "linecomment": "//",    //单行注释符
                                "blockstart": "/*",     //块开始注释符
                                "blockend": "*/",       //块结束注释符
                                "linestart": false,     //注释符是否必须在行首,不写默认为false
                                "string":{
                                    "doublequotes": true,   //字符串使用双引号，用来排除字符串的注释符号
                                    "singlequotes": false   //字符串不使用单引号，用来排除字符串的注释符号
                                }
                                
                            }
                        },
                        {
                            "ext": [
                                "html",
                                "xml"
                            ],
                            "separator": {
                                "blockstart": "<!--",
                                "blockend": "-->",
                                 "string":{
                                    "doublequotes": true,
                                    "singlequotes": false
                                }
                               //该语言不存在的注释符号项不写，如linecomment等。
                            }
                        }
                    ]
        

```



## 使用

1. 统计当前文档行数：

按F1，输入LineCount，选择LineCount: Count current file，即可在输出窗口输出：

![Count current file](https://github.com/yycalm/linecount/blob/master/images/countcurrentfile.gif?raw=true)



2. 统计工作区文档行数：

按F1，输入LineCount，选择LineCount: Count Workspace files,

统计完毕后，在输出窗口输出文件总数，代码总数，注释总数，空白行总数。

每个文件的代码行数信息输出到指定路径的linecount.txt或linecount.json文档中。

![Count workspace files](https://github.com/yycalm/linecount/blob/master/images/countworkspace.gif?raw=true)


## 更多信息

[联系或更多信息，访问Repository](https://github.com/yycalm/linecount)


# License
MIT

-----------------------------------------------------------------------------------------------------------

**Enjoy!**