/**
 * @ignore  =====================================================================================
 * @file 家长表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("ParentTable", [
    "$q",
    "Database",
    function ($q, Database) {
        /**
         * @desc 创建家长表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: 'Parent',
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40)',
                        wechatId: 'VARCHAR(100)',
                        mPhone: 'VARCHAR(40)',
                        tel: 'VARCHAR(40)'
                    }
                }).then(resolve).catch(reject)
            });
        };
    }
]);