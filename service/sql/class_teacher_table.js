/**
 * @ignore  =====================================================================================
 * @file 教师与班级的关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("ClassTeacherTable", [
    "$q",
    "Database",
    function ($q, Database) {
        /**
         * @desc 教师与班级的关系表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Class_Teacher',
                    info: {
                        classId: 'VARCHAR(40) NOT NULL',
                        teacher: 'VARCHAR(40) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);