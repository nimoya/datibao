/**
 * @ignore  =====================================================================================
 * @fileoverview 关于班级的信息获取
 * @author  沈奥林
 * @version 0.1.0
 * @ignore  created in 2016/7/12
 * @ignore  depend
 * @ignore  =====================================================================================
 */
"use strict";

(function() {
    let keyPreseer = require("./lib/keypresser");

    angular.module('DTB').service('PPTService', [function(){
        this.pptPageUp = function () {
            keyPreseer.pressPpt("up");
        };

        this.pptPageDown = function () {
            keyPreseer.pressPpt("down");
        };
    }]);
})();


