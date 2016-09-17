/**
 * @ignore  =====================================================================================
 * @file 家长与学生的关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("ParentStudentTable", [
    "$q",
    "Database",
    function ($q, Database) {
        /**
         * @desc 创建家长与学生的关系表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Parent_Student',
                    info: {
                        student: 'VARCHAR(40) NOT NULL',
                        parent: 'VARCHAR(40) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);