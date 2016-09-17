/**
 * @ignore  =====================================================================================
 * @file 数据库的公共功能
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database", []).service("Database", [
    "$q",
    "$window",
    function ($q, $window) {
        const DATABASE_NAME = "DTB";
        const DATABASE_VERSION = "1.0";
        const DATABASE_DESC = "";
        const DATABASE_SIZE = 20 * 1024 * 1024;

        /**
         * @desc 打开数据库
         * @returns {$q|*}
         */
        this.openDatabase = function () {
            return new $q(function(resolve, reject){
                try {
                    var db = $window.openDatabase(
                                            DATABASE_NAME,
                                            DATABASE_VERSION,
                                            DATABASE_DESC,
                                            DATABASE_SIZE);

                    resolve(db);
                } catch (err) {
                    reject(err);
                }
            });
        };

        this.transaction = function () {
            return new $q((resolve, reject)=>{
                this.openDatabase()
                     .then(function(db){
                         try {
                             db.transaction(function(tx){
                                 resolve(tx);
                             });
                         } catch (err) {
                             reject(err);
                         }
                     })
                     .catch(reject)
            });
        };

        this.executeSql = function (sql, params) {
            return new $q((resolve, reject)=>{
                this.openDatabase().then(db=>{
                    db.transaction(tx => {
                        tx.executeSql(sql, params, (tx, ret)=>{
                            resolve([].slice.call(ret.rows));
                        }, (tx, err)=>{
                            reject(err);
                        });
                    });
                })
            });
        };

        this.createInsertSql = function (tableName, fields, params) {
            let fieldsStr = "(";
            let paramsStr = "(";
            for (let i = 0, len = fields.length; i < len; ++i) {
                fieldsStr += fields[i];
                paramsStr += "?";

                if (i < len - 1) {
                    fieldsStr += ", ";
                    paramsStr += ", ";
                }
            }
            fieldsStr += ")";
            paramsStr += ")";

            let sql = "insert into " + tableName + " " +  fieldsStr + " values " + paramsStr;

            return sql;
        };

        /**
         *  创建数据库
         * @returns {$q|*}
         */
        this.creataDatabase = this.openDatabase;

        /**
         * @desc 用来创建指定的表
         * @param db
         * @param info 和数据相关的信息
         */
        this.createTable = function (options) {
            let self = this;

            let tableName = options.name;
            let info = options.info;
            let fields = Object.keys(info);

            let sql = "create table if not exists " + tableName + "(";
            for (let i = 0, len = fields.length; i < len; ++i) {
                let field = fields[i];
                sql += field + " " + info[field];

                if (i < len - 1) {
                    sql += ", ";
                }
            }
            sql += " )";
            
            return new $q(function(resolve, reject){
                self.openDatabase()
                    .then(function(db){
                        try {
                            db.transaction(function(tx){
                                tx.executeSql(sql, [], function(){
                                    resolve(db);
                                }, function (e) {
                                    reject(e);
                                });
                            });
                        } catch (e) {
                            reject(e);
                        }
                    })
                    .catch(reject);
            });
        };

        /**
         * @desc 向指定的数据插入数据
         * @param tableName
         * @param fields
         * @param params
         */
        this.insertOne = function (tableName, fields, params) {
            let self = this;

            let fieldsStr = "(";
            let paramsStr = "(";
            for (let i = 0, len = fields.length; i < len; ++i) {
                fieldsStr += fields[i];
                paramsStr += "?";

                if (i < len - 1) {
                    fieldsStr += ", ";
                    paramsStr += ", ";
                }
            }
            fieldsStr += ")";
            paramsStr += ")";

            let sql = "insert into " + tableName + " " +  fieldsStr + " values " + paramsStr;

            return new $q(function(resolve, reject){
                self.openDatabase()
                    .then(function(db){
                        db.transaction(function(tx){
                            tx.executeSql(
                                sql,
                                params,
                                function(tx, result){
                                    resolve(db);
                                },
                                function(tx, err){
                                    reject(err);
                                });
                        });
                    })
                    .catch(reject)

            });
        };

        /**
         * @desc 向指定的表中添加多条数据
         * @param tableName
         * @param fields
         * @param datas {Array}
         * @returns {$q|*}
         */
        this.insertMany = function (tableName, fields, datas) {
            return new $q((resolve, reject)=>{
                // 如果没有数据的话，我们不进行处理
                if (datas.length <= 0) {
                    resolve();
                    return;
                }

                this.openDatabase().then(db=>{
                    db.transaction(tx => {
                        let promises = [];
                        let p = null;

                        for (let data of datas) {
                            let sql    = "insert into " + tableName + "(" + fields.join(", ") + ")";
                            let params = [];
                            let paramPlaceHolders = [];
                            for (let field of fields) {
                                params.push(data[field] == null ? null : data[field]);
                                paramPlaceHolders.push("?");
                            }

                            sql += " values(" + paramPlaceHolders.join(",") + ")";
                            p = new $q((resolve, reject)=>{
                                tx.executeSql(sql, params, (tx, ret)=>{
                                    resolve([].slice.call(ret.rows));
                                }, (tx, err)=>{
                                    reject(err);
                                });
                            });
                        }

                        $q.all(promises).then(resolve).catch(reject);
                    });

                }).catch(reject);
            });
        };

        /**
         * @desc 更新指定数据表中的数据，对于datas数组中的每一个元素必须指定_id
         * @param tableName
         * @param fields
         * @param datas
         * @returns {$q|*}
         */
        this.updateMany = function (tableName, fields, datas) {
            return new $q((resolve, reject)=>{
                // 如果没有数据的话，我们不进行处理
                if (datas.length <= 0) {
                    resolve();
                    return;
                }

                this.openDatabase().then(db=>{
                    db.transaction(tx => {
                        let promises = [];
                        let p = null;

                        for (let data of datas) {
                            let sql    = "update " + tableName + " set ";
                            let params = [];
                            for (let i = 0, len = fields.length; i < len; ++i) {
                                let field = fields[i];

                                sql += field + "=?";
                                if (i < len - 1) {
                                    sql += ","
                                }

                                params.push(data[field] == null ? null : data[field]);
                            }
                            sql += " where _id=?";
                            params.push(data._id);
                            
                            p = new $q((resolve, reject)=>{
                                tx.executeSql(sql, params, (tx, ret)=>{
                                    resolve([].slice.call(ret.rows));
                                }, (tx, err)=>{
                                    reject(err);
                                });
                            });
                        }

                        $q.all(promises).then(resolve).catch(reject);
                    });

                }).catch(reject);
            });
        };

        this.deleteMany = function (tableName, datas) {
            return new $q((resolve, reject)=>{
                if (datas.length <= 0) {
                    resolve();
                    return;
                }

                let sql = "delete from " + tableName + " where ";

                let params = [];
                for (let i = 0, len = datas.length; i < len; ++i) {
                    let data = datas[i];

                    sql += "_id=?";

                    if (i < len - 1) {
                        sql += " or ";
                    }
                    params.push(data._id);
                }

                console.log(sql);
                console.log(params);

                return this.executeSql(sql, params);
            });
        };

        this.deleteTable = function (tableName) {
            return new $q((resolve, reject)=>{
                let sql = "drop table if exists " + tableName;

                this.openDatabase().then((db)=>{
                    db.transaction((tx)=>{
                        tx.executeSql(sql, [], (tx, ret)=>{
                            resolve();
                        }, (tx, err)=>{
                            reject(err);
                        });
                    });
                }).catch(reject);
            });
        };



        window.deleteTable = this.deleteTable.bind(this);

        /**
         * @desc 选取一个表中的所有数据
         * @param tableName
         * @returns {$q|*}
         */
        this.selectAll = function (tableName) {
            return new $q((resolve, reject)=>{
                let sql = "select * from " + tableName;

                this.transaction()
                     .then(function(tx){
                         tx.executeSql(
                                    sql,
                                    [],
                                    function(tx, ret){
                                        resolve(ret);
                                    },
                                    function(tx, err){
                                        reject(err);
                                    });
                     })
                     .catch(reject);

            });
        };

    }
]);