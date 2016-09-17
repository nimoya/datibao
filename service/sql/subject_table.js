/**
 * @ignore  =====================================================================================
 * @file 课程表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("SubjectTable", [
    "$q",
    "Database",
    function ($q, Database) {

        /**
         * @desc 创建课程表
         * @returns {$q|*}
         */
        function createTable () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Subject',
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40) NOT NULL',
                        createTime: 'VARCHAR(100) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 初始化课程表
         * @returns {$q|*}
         */
        this.init = function () {
            return createTable();
        }
    }
]);