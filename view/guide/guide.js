/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyGuide标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/19
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").directive('xyGuide',[
    '$rootScope',

    function (
        $rootScope
        ) {

        return{
            templateUrl:'view/guide/guide.html',
        };
    }]
);