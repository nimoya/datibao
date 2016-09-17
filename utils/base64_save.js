/**
* @ignore  =====================================================================================
* @fileoverview 将base64的字符串存储为图片文件
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/1
* @ignore  depend
* @ignore  =====================================================================================
*/
"use strict";

angular.module('DTB')
    .service('Base64Saver',['FileManager',function (FileManager) {

        const IMAGE_PATH='images/';
        /**
         * base64字符串写入硬盘
         * @param _base64 字符串
         * @param _cb   回调,传出错误信息和图像文件地址
         */
        this.saveBase64=function (_base64,_cb) {
            let fileName=Math.random().toString(36).substr(2);
            let filePath=IMAGE_PATH+fileName+'.jpeg';
            let base64Data=_base64.replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer=new Buffer(base64Data,'base64');

            FileManager.writeFile(filePath,dataBuffer,(err)=>{
                _cb(err,filePath);

            });


        }
    }]);


