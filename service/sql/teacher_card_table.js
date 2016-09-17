/**
 * @ignore  =====================================================================================
 * @file 老师卡的表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/2
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("TeacherCardTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Teacher_Card";

        const FIELDS = [
            "_id",
            "name",
            "cardId",
            "createTime"
        ];

        /**
         * @desc 创建老师表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40) NOT NULL',
                        cardId: 'VARCHAR(100)',
                        createTime: 'VARCHAR(100) NOT NULL',
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 增加一张教师卡
         * @param card
         */
        this.addTeacherCard = function (card) {
            let params = [];
            for (let field of FIELDS) {
                params.push(card[field] || null);
            }

            return Database.insertOne(TABLE_NAME,FIELDS , params);
        };

        /**
         * @desc 向teacher card表中添加一些教师卡
         * @param teacherCards
         * @returns {$q|*}
         */
        this.addTeacherCards = function (teacherCards) {
            return Database.insertMany(TABLE_NAME, FIELDS, teacherCards);
        };

        /**
         * @desc 更新数据库中的一些教师卡
         * @param teacherCards
         * @returns {$q|*}
         */
        this.updateTeacherCards = function (teacherCards) {
            return Database.updateMany(TABLE_NAME, FIELDS, teacherCards);
        };

        /**
         * @desc 删除教师卡
         * @param teacherCards, 每个teacherCard至少包含_id属性
         */
        this.deleteTeacherCards = function (teacherCards) {
            return Database.deleteMany(TABLE_NAME, teacherCards);
        };
        

        /**
         * @desc 更新一张教师卡
         * @param card
         * @returns {$q|*}
         */
        this.updateTeacherCard = function (card) {
            return new $q((resolve, reject)=>{
                let sql = "update " + TABLE_NAME + " set ";

                let fields = [
                    "_id",
                    "name",
                    "cardId",
                    "createTime"
                ];

                for (let i = 0, len = fields.length; i < len; ++i) {
                    sql += fields[i] + "=?";

                    if (i < len - 1) {
                        sql += ", ";
                    }
                }

                sql += " where _id=" + "'" + card._id + "'";

                let params = [];
                for (let j = 0, jLen = fields.length; j < jLen; ++j ) {
                    let field = fields[j];
                    params.push(card[field] || null);
                }

                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
                        tx.executeSql(sql, params, function(tx, ret){
                            resolve(ret);
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                });
            });
        };

        /**
         * @desc 删除一张教师卡
         * @param card
         * @returns {$q|*}
         */
        this.deleteTeacherCard = function (card) {
            return new Promise((resolve, reject)=>{
                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
                        let sql = "delete from " + TABLE_NAME + " where _id='" + card._id + "'";
                        tx.executeSql(sql, [], function(tx, ret){
                            resolve(ret);
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                });
            });
        };

        /**
         * @desc 获取所有的教师卡
         * @returns {*}
         */
        this.getAllTeacherCards = function () {
            return $q((resolve, reject)=>{
                let sql = "select * from " + TABLE_NAME;

                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
                        tx.executeSql(
                            sql,
                            [],
                            function(tx, ret){
                                resolve([].slice.call(ret.rows));
                            },
                            function(tx, err){
                                reject(err);
                            });
                    });

                }).catch(reject)
            });
        };

        /**
         * @desc 获取指定老师所有的教师卡
         * @param teacher, 至少包含_id属性
         * @returns {$q|*}
         */
        this.getTeacherCardsByTeacher = function (teacher) {
            return new $q((resolve, reject)=>{
                Database.openDatabase().then(db => {
                    db.transaction(tx => {
                        let sql = "select Teacher_Card.* from Teacher_Card, Teacher_TeacherCard "
                                    + "where Teacher_Card._id=Teacher_TeacherCard.teacherCard "
                                        + "and Teacher_TeacherCard.teacher=?";

                        let params = [teacher._id];

                        tx.executeSql(sql, params, (tx, ret)=>{
                            resolve([].slice.call(ret.rows));
                        }, (tx, err)=>{
                            reject(err);
                        });
                    });
                }).catch(reject);
            });
        };

        /**
         * @desc 通过id获取教师卡
         * @param cardId
         * @returns {$q|*}
         */
        this.getTeacherCardsById = function (cardId) {
            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    db.transaction(function(tx){
                        let sql = "select * from " + TABLE_NAME + " where cardId=?";
                        let params = [cardId];

                        tx.executeSql(sql, params, function(tx, ret){
                            resolve([].slice.call(ret.rows));
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                }).catch(reject)
            });
        };
    }
]);