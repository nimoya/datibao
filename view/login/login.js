/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyLogin标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").directive('xyLogin',[
    '$rootScope',

    function ($rootScope) {
        return{
            templateUrl:'view/login/login.html',
        }
    }]
);