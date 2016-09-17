/**
 * @ignore  =====================================================================================
 * @file 班级表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("ClassTable", [
    "$q",
    "Database",
    function ($q, Database) {

        /**
         * @desc 创建班级表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Class',
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40) NOT NULL',
                        createTime: 'VARCHAR(100) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);