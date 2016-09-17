/**
 * @ignore  =====================================================================================
 * @file 学生回答问题的记录表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("RecordTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Record";

        const FIELDS =  [
            "_id",
            "answer",
            "answerTime",
            "question",
            "student",
            "isRight",
        ];

        /**
         * @desc 创建学生回答问题的记录表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        answer: 'VARCHAR(100)',
                        answerTime: 'VARCHAR(100)',
                        question: 'VARCHAR(100)',
                        student: 'VARCHAR(40)',
                        isRight: 'VARCHAR(10)'
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 增加一个问题记录
         * @param record
         */
        this.addRecord = function (record) {
            let fields = FIELDS;

            let params = [];
            for (let field of fields) {
                let param = null;
                if (record[field] != null) {
                    param = record[field];
                }

                params.push(param);
            }

            return Database.insertOne(TABLE_NAME, fields, params);
        };

        /**
         * @desc 增加或更新指定问题的记录
         * @param question，问题对象，至少包含_id属性
         * @param records {Array}, 每个record至少包含_id属性
         * @returns {$q|*}
         */
        this.addOrUpdateQuestionRecords = function (question, records) {
            return new $q((resolve, reject)=>{
                if (!records || records.length <= 0) {
                    resolve();
                    return;
                }

                let sql    = "select * from " + TABLE_NAME + " where question=?";
                let params = [question._id];

                Database.executeSql(sql, params).then((oldRecords)=>{
                    let recordsToAdd    = [];
                    let recordsToUpdate = [];

                    for (let record of records) {
                        let isIn = false;
                        for (let oldRecord of oldRecords) {
                            if (record._id === oldRecord._id) {
                                isIn = true;
                                break;
                            }
                        }
                        if (isIn) {
                            recordsToUpdate.push(record);
                        } else {
                            recordsToAdd.push(record);
                        }
                    }

                    let promises = [];
                    let p = null;

                    p = Database.insertMany(TABLE_NAME, FIELDS, recordsToAdd);
                    promises.push(p);

                    p = Database.updateMany(TABLE_NAME, FIELDS, recordsToUpdate);
                    promises.push(p);

                    $q.all(promises).then(resolve).catch(reject);
                }).catch(reject);
            });
        };

        /**
         * @desc 增加或更新records
         * @param datas {Array}，每个元素结构
         * {
         *  question：question对象，至少含有_id属性
         *  records： record数组，每个record对象至少含有_id属性
         * }
         * @returns {$q|*}
         */
        this.addOrUpdateQuestionRecordsList = function (datas) {
            return new $q((resolve, reject)=>{
                if (!datas || datas.length <= 0) {
                    resolve();
                    return;
                }

                let questions = [];
                for (let data of datas) {
                    questions.push(data.question);
                }

                this.getRecordsByQuestions(questions).then(tmpRecords=>{
                    let records = [];
                    for (let data of datas) {
                        records = records.concat(data.records);
                    }

                    let recordsToAdd    = [];
                    let recordsToUpdate = [];

                    for (let record of records) {
                        let isIn = false;
                        for (let tmpRecord of tmpRecords) {
                            if (record._id === tmpRecord._id) {
                                isIn = true;
                                break;
                            }
                        }
                        if (isIn) {
                            recordsToUpdate.push(record);
                        } else {
                            recordsToAdd.push(record);
                        }
                    }

                    let promises = [];
                    let p = null;

                    p = Database.insertMany(TABLE_NAME, FIELDS, recordsToAdd);
                    promises.push(p);

                    p = Database.updateMany(TABLE_NAME, FIELDS, recordsToUpdate);
                    promises.push(p);

                    $q.all(promises).then(resolve).catch(reject);

                }).catch(reject);
            });
        };

        /**
         * @desc 通过问题来获取records
         * @param questions
         * @returns {$q|*}
         */
        this.getRecordsByQuestions = function (questions) {
            return new $q((resolve, reject)=>{
                if (!questions || questions.length <= 0) {
                    resolve([]);
                    return;
                }

                Database.openDatabase().then(db=>{
                    db.transaction(tx => {
                        let promises = [];

                        // 这里需要注意，因为websql在查询过程中变量不能太多，如果太多的话会报错
                        // 但是由于我们的问题可能会很多，所以这里将数据量很大的查询进行分割，
                        // 每100个question查询一次数据库
                        const NUMBER = 100;

                        for (let i = 0, len = Math.ceil(questions.length / NUMBER); i < len; ++i) {
                            let index = i * NUMBER;
                            let endIndex   = (i + 1) * NUMBER;
                            if (endIndex > questions.length) {
                                endIndex = questions.length;
                            }

                            let sql    = "select * from " + TABLE_NAME + " where ";
                            let params = [];

                            while (index < endIndex) {
                                sql += "question=?";

                                if (index < endIndex - 1) {
                                    sql += " or ";
                                }

                                params.push(questions[index]._id);
                                ++index;
                            }

                            let p = new $q((resolve, reject)=>{
                                tx.executeSql(sql, params, (tx, ret)=>{
                                    resolve([].slice.call(ret.rows));
                                }, (tx, err)=>{
                                    reject(err);
                                });
                            });

                            promises.push(p);
                        }

                        $q.all(promises).then(recordsList => {
                            let records = [];

                            for (let tmpRecords of recordsList) {
                                records = records.concat(tmpRecords)
                            }

                            resolve(records);
                        }).catch(reject);
                    });
                }).catch(reject);
            });
        };

        /**
         * @desc 通过questions获取指定学生的问题记录
         * @param student
         * @param questions
         * @returns {$q|*}
         */
        this.getRecordsByStudentAndQuestions = function (student, questions) {
            let sql = "select * from " + TABLE_NAME + " where student=? and ( ";
            let params = [
                student._id,
            ];

            for (let i = 0, len = questions.length; i < len; ++i) {
                let question = questions[i];

                sql += "question=? ";
                if (i < len - 1) {
                    sql += " or ";
                }

                params.push(question._id);
            }

            sql += " )";

            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    try {
                        db.transaction((tx) => {
                            tx.executeSql(sql, params, (tx, ret)=>{
                                resolve([].slice.call(ret.rows));
                            }, (tx, err)=>{
                                reject(err);
                            });
                        });
                    } catch (err) {
                        reject(err);
                    }
                }).catch((err) => {
                    console.error(err);
                });
            });
        };

        /**
         * @desc 获取指定question的records
         * @param question，至少包含_id属性
         * @returns {$q|*}
         */
        this.getRecordsByQuestion = function (question) {
            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    db.transaction((tx)=>{
                        let sql = "select * from " + TABLE_NAME + " where question=?";
                        let params = [question._id];

                        tx.executeSql(sql, params, (tx, ret)=>{
                            resolve([].slice.call(ret.rows));
                        }, (tx, err)=>{
                            reject(err);
                        });
                    });
                }).catch(reject)
            });
        };

        /**
         * @desc 通过questions获取记录
         * @param questions
         * @returns {$q|*}，resolve的时候获取的结果是一个二维数组，二维数组的数据对应传过来的questions数组
         */
        this.getRecordsListByQuestions = function (questions) {
            return new $q((resolve, reject)=>{
                if (!questions || questions.length <= 0) {
                    resolve([]);
                    return;
                }

                let sql    = "select * from " + TABLE_NAME + " where ";
                let params = [];
                for (let i = 0, len = questions.length; i < len; ++i) {
                    let question = questions[i];

                    sql += "question=?";
                    if (i < len - 1) {
                        sql += " or ";
                    }

                    params.push(question._id);
                }

                Database.executeSql(sql, params).then((records)=>{
                    let recordsList = [];
                    for (let question of questions) {
                        let tmpRecords = [];
                        for (let record of records) {
                            if (question._id === record.question) {
                                tmpRecords.push(record);
                            }
                        }
                        recordsList.push(tmpRecords);
                    }
                    resolve(recordsList);
                }).catch(reject);
            });
        };

    }
]);