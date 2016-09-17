/**
 * @ignore  =====================================================================================
 * @file 课程时间表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("CourseTimeTable", [
    "$q",
    "Database",
    function ($q, Database) {

        /**
         * @desc 创建课程时间表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'CourseTime',
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        date: 'VARCHAR(100)',
                        course: 'VARCHAR(40)',
                        timeInDay: 'VARCHAR(40)'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);