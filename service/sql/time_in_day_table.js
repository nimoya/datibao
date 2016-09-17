/**
 * @ignore  =====================================================================================
 * @file 每天的教学时间表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("TimeInDayTable", [
    "$q",
    "Database",
    function ($q, Database) {

        /**
         * @desc 创建每天的教学时间表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'TimeInDay',
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40)',
                        startTime: 'VARCHAR(100)',
                        endTime: 'VARCHAR(100)'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);