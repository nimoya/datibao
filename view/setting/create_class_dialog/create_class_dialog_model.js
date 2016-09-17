/**
 * @ignore  =====================================================================================
 * @fileoverview 导入班级询问对话框的model
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/3
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('CreateClassDialogModel',[
    function () {
        let _courses = [];

        this.setCourses = function (tmpCourses) {
            _courses = tmpCourses || [];
        };

        this.getCourses = function () {
            return _courses || [];
        };

        this.reset = function () {
            _courses = [];
        };

        /**
         * @desc 通过课程名来判断当前课程是否存在
         */
        this.isCourseExistByCourseName = function (courseName) {
            for (let course of _courses) {
                if (course.name ===  courseName) {
                    return true;
                }
            }

            return false;
        };
    }]
);