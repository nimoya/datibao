/**
 * @fileOverview 截屏的service
 * @author 王磊   16/7/8
 * @version 0.1
 */
(function() {
    angular.module('DTB').service('ScreenShotService',[
        '$q',
        'FileManager',

        function (
            $q,
            FileManager) {
            
            this.quickScreenShot=function () {
                let keyPresser = require("./lib/keypresser");

                keyPresser.keyDown(44);
                keyPresser.keyUp(44);
            };

            // 获取屏幕截屏
            this.getScreenShot = function () {
                let keyPresser = require("./lib/keypresser");

                keyPresser.keyDown(44);
                keyPresser.keyUp(44);

                let clipboard = nw.Clipboard.get()

                let image = clipboard.get("png", true);
                image.replace(/^data:image\/\w+;base64,/, "");
                image = new Buffer(image,'base64');

                clipboard.clear();

                return new $q((resolve, reject)=>{
                    try {
                        let path = require("path");
                        let dirPath = nw.App.dataPath + "/screenShot";
                        FileManager.isPathExist(dirPath, function (isExit){
                            if (!isExit) {
                                FileManager.makeDirSync(dirPath);
                            }

                            let uuid = require("node-uuid");

                            let filePath = path.resolve(dirPath + "/" + uuid.v4() + Date.now() + ".png");

                            FileManager.writeFile(filePath, image, function (err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve(filePath);
                            });
                        });
                    } catch (err) {
                        reject(err);
                    }
                });
            };
        }]
    );
})();
