/**
 * @ignore  =====================================================================================
 * @fileoverview 导入班级询问对话框的model
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/3
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('ImportClassDialogModel',[
    function () {
        let _course = null;

        this.setCourse = function (course) {
            _course = course;
        };

        this.getCourse = function () {
            return _course;
        };

        this.reset = function () {
            _course = null;
        };
    }]
);
