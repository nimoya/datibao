/**
 * @ignore  =====================================================================================
 * @fileoverview 报告页面提示对话框
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/8/12
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('ReportPromptDialogModel',[
    function () {
        let _message = "";

        this.reset = function () {
            _message = "";
        };

        this.setMessage = function (message) {
            _message = message;
        };

        this.getMessage = function () {
            return _message;
        };

    }]
);