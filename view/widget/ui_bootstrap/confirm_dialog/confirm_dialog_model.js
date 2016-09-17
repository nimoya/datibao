/**
 * @ignore  =====================================================================================
 * @fileoverview 确认对话框的model
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/3
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('ConfirmDialogModel',[
    function () {
        let _message = "";

        this.reset = function () {
            _message = "";
        };

        this.getMessage = function () {
            return _message;
        };

        this.setMessage = function (message) {
            _message = message;
        };
    }]
);