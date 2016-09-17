/**
* @fileOverview 文件读写服务
* @author 沈奥林   16/6/15
* @version 1.0
 * @event: 16/6/15  沈奥林定稿
*/

angular.module('DTB').service('FileManager',[function () {
    const fs=require("fs");

    let self=this;

    /**
     * 判断路径是否存在
     * @param path
     * @param cb
     */
    this.isPathExist= function (path,cb) {
        fs.exists(path,(exists)=>{
            if(exists){
                cb&&cb(true);
            }else{
                cb&&cb(false);
            }
        })
    };

    /**
     * 判断一个路径的类型
     * @param path
     * @param cb        回调,传参可能有:
     *                  'file'      路径是文件
     *                  'dir'       路径是目录
     *                  'notExt'    路径不存在
     *                  'err'       异常
     */
    this.getPathType= function (path, cb) {

        self.isPathExist(path,(exists)=>{
            if(!exists){
                cb&&cb('notExt');
                return;
            }
            fs.stat(path,  (err, stats)=> {
                if (err){
                    cb&&cb('err');
                    return;
                }

                if (stats.isFile()) {
                    cb&&cb('file');
                    return;
                }
                else if (stats.isDirectory ()) {
                    cb&&cb('dir');
                    return;
                }
            });
        })
    }

    /**
     * 创建文件夹
     * @param dirPath   文件夹路径
     * @param cb        回调,参数是错误信息
     */
    this.makeDir= function (dirPath, cb) {
        fs.mkdir(dirPath,0x0777, cb);
    };

    /**
     * 同步创建文件夹
     * @param dirPath
     */
    this.makeDirSync= function (dirPath) {
        fs.mkdir(dirPath,0x0777);
    }


    /**
     * 写文件
     * @param filePath  文件路径
     * @param data      内容字符串
     * @param cb        回调,参数是错误信息
     */
    this.writeFile=function(filePath,data,cb){
       fs.writeFile(filePath,data,cb);

    }

    /**
     * 同步写文件
     * @param filePath
     * @param data
     */
    this.writeFileSync= function (filePath, data) {
        fs.writeFileSync(filePath,data);
    }

    /**
     * 读文件
     * @param filePath
     * @param cb        回调,参数是错误信息,内容字符串
     */
    this.readFile=function(filePath,cb){
        fs.readFile(filePath,'UTF-8',cb);
    }

    /**
     * 同步读文件
     * @param filePath
     */
    this.readFileSync= function (filePath) {
        return fs.readFileSync(filePath,'UTF-8');
    }

}])
