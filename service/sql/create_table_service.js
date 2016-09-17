/**
 * @ignore  =====================================================================================
 * @file 创建数据库
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").service("CreateDatabaseService", ["$q", "$window", function($q, $window){
    const DATABASE_NAME = "DTB";
    const DATABASE_VERSION = "1.0";
    const DATABASE_DESC = "";
    const DATABASE_SIZE = 20 * 1024 * 1024;

    function createStudentTable (db) {
        return new $q(function (resolve, reject) {
            db.transaction(function(tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS Student(_id, name, mPhone, sNumber, createTime, cardId)", [],
                    function(tx){
                        tx.executeSql("INSERT INTO Student (_id, name, mPhone, sNumber, createTime, cardId) VALUES (?, ?, ?, ?, ?, ?)"
                        , [+(new Date()), "123", "123", "123", "123", "4"]
                            , function () {

                            }, function () {
                                
                            });
                    },
                    function(err){
                        reject(err);
                    });
            });
        });
    };

    /**
     * @desc 创建数据库
     * @returns {$q|*}
     */
    this.createDatabase = function () {
        return new $q(function (resolve, reject) {
            try {
                var db = $window.openDatabase(DATABASE_NAME, DATABASE_VERSION, DATABASE_DESC, DATABASE_SIZE);
                createStudentTable(db).then(function(){
                }).catch(function(err){
                    console.log(err);
                });

                resolve(db);
            } catch (err) {
                reject(err);
            }
        });
    };
}]);