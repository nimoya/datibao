/**
 * @ignore  =====================================================================================
 * @file 学生与班级关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("StudentClassTable", [
    "$q",
    "Database",
    function ($q, Database) {
        /**
         * @desc 学生与班级关系表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Student_Class',
                    info: {
                        student: 'VARCHAR(40) NOT NULL',
                        classId: 'VARCHAR(40) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);