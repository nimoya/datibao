/**
 * @file uuid的service
 * @author 王磊   16/7/21
 * @version 0.1
 */
angular.module('DTB').service('Uuid',[
    function () {
        let uuid = require("node-uuid");

        this.v4 = function () {
            return uuid.v4() + Date.now();
        };
    }]
);
