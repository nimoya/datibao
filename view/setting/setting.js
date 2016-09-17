/**
* @ignore  =====================================================================================
* @fileoverview 定义xy-setting标签
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/1
* @ignore  depend 
* @ignore  =====================================================================================
*/

angular.module("DTB").directive('xySetting',function () {
    return{
        templateUrl: function () {
            let url = "";
            if (APP_CONFIG.version === Constant.LOCAL) {
                url = 'view/setting/setting.html'
            } else {
                url = 'view/setting/setting_network.html';
            }
            return url;
        }
    }
});