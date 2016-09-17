/**
 * @ignore  =====================================================================================
 * @file 创建题目数据表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("QuestionTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Question";

        const FIELDS = [
            "_id",
            "file",
            "answer",
            "course",
            "createTime",
            "rate",
            "pRate",
        ];

        /**
         * @desc 创建题目数据表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        file: 'VARCHAR(255)',
                        answer: 'VARCHAR(100)',
                        createTime: 'VARCHAR(100)',
                        course: 'VARCHAR(40)',
                        rate: 'VARCHAR(40)', // 问题的正确率
                        pRate: 'VARCHAR(40)', // 问题的参与率
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 向数据库中添加一个问题
         * @param question， question至少要包含_id属性
         */
        this.addQuestion = function (question) {
            let fields = FIELDS;

            let params = [];
            for (let field of fields) {
                params.push(question[field] || null);
            }

            return Database.insertOne(TABLE_NAME, fields, params);
        };

        /**
         * @desc 增加或更新一个question, 如果question已经存在了的话，更新question，否则在数据库中增加一个question
         * @param question，question至少要包含_id属性
         * @returns {$q|*}
         */
        this.addOrUpdateQuestion = function (question) {
            return new $q((resolve, reject)=>{
                this.hasQuestion(question).then(has=>{
                    let promise = null;
                    let questions = [question];
                    if (has) {
                        promise = Database.updateMany(TABLE_NAME, FIELDS, questions);
                    } else {
                        promise = Database.insertMany(TABLE_NAME, FIELDS, questions);
                    }
                    promise.then(resolve).catch(reject);
                });
            });
        };

        /**
         * @desc 增加或更新一些question，如果question已经存在了的话，更新question，否则在数据库中增加一个question
         * @param questions {Array}，每个question至少要包含_id属性
         * @returns {$q|*}
         */
        this.addOrUpdateQuestions = function (questions) {
            return new $q((resolve, reject)=>{
                if (!questions || questions.length <= 0) {
                    resolve();
                    return;
                }

                let ids = [];
                for (let question of questions) {
                    let id = question._id;
                    ids.push(id);
                }
                this.getQuestionsByIds(ids).then(tmpQuestions=>{
                    let questionToUpdate = [];
                    let questionToAdd    = [];
                    for (let q of questions) {
                        let isIn = false;
                        for (let tmpQ of tmpQuestions) {
                            if (q._id === tmpQ._id) {
                                isIn = true;
                                break;
                            }
                        }
                        if (isIn) {
                            questionToUpdate.push(q);
                        } else {
                            questionToAdd.push(q);
                        }
                    }

                    let promises = [];
                    let p = null;

                    p = Database.insertMany(TABLE_NAME, FIELDS, questionToAdd);
                    promises.push(p);

                    p = Database.updateMany(TABLE_NAME, FIELDS, questionToUpdate);
                    promises.push(p);

                    $q.all(p).then(resolve).catch(reject);
                }).catch(reject);
            });
        };

        /**
         * @desc 更加id来获取问题
         * @param ids {Array}, 问题id数组
         * @returns {$q|*}
         */
        this.getQuestionsByIds = function (ids) {
            return new $q((resolve, reject)=>{
                if (!ids || ids.length <= 0) {
                    resolve([]);
                    return;
                }

                Database.openDatabase().then(db=>{
                    db.transaction(tx => {
                        let promises = [];
                        let p = null;

                        let sql = "select * from " + TABLE_NAME + " where _id=?";
                        for (let i = 0, len = ids.length; i < len; ++i) {
                            let id = ids[i];

                            p = new $q((resolve, reject)=>{
                                tx.executeSql(sql, [id], (tx, ret)=>{
                                    resolve([].slice.call(ret.rows));
                                }, (tx, err)=>{
                                    reject(err);
                                });
                            });

                            promises.push(p);
                        }

                        $q.all(promises).then(datas=>{
                            let questions = [];
                            for (let data of datas) {
                                questions = questions.concat(data);
                            }
                            resolve(questions);
                        }).catch(reject);
                    });

                }).catch(reject);
            });
        };

        /**
         * @desc 判断question是否已经在数据库中了
         * @param question，question至少要包含_id属性
         * @returns {$q|*}
         */
        this.hasQuestion = function (question) {
            return new $q((resolve, reject)=>{
                let sql    = "select * from " + TABLE_NAME + " where _id=?";
                let params = [question._id];

                Database.executeSql(sql, params).then((questions)=>{
                    resolve(questions.length > 0);
                }).catch(reject);

            });
        };

        /**
         * @desc 获取某个课程指定时间段内创建的问题
         * @param course
         * @param startTime
         * @param endTime
         * @returns {$q}
         */
        this.getQuestionByCourseAndTimeInterval = function (course, startTime, endTime) {
            startTime = +startTime;
            endTime   = +endTime;

            let sql = "select * from " + TABLE_NAME
                + " where course=? and createTime>=? and createTime<?";

            let params = [
                course._id,
                startTime,
                endTime
            ];

            return Database.executeSql(sql, params);
        };

        /**
         * @desc 获取指定班级某日的问题
         * @param course
         * @param date
         */
        this.getQuestionsByCourseAndDate = function (course, date) {
            let curtDateNum = +date;
            let nextDateNum = curtDateNum + 24 * 60 * 60 * 1000;

            let curtDate = new Date(curtDateNum);
            let nextDate = new Date(nextDateNum);

            let curtDateYear  = curtDate.getFullYear();
            let curtDateMonth = curtDate.getMonth();
            let curtDateDate  = curtDate.getDate();
            curtDate = new Date(curtDateYear, curtDateMonth, curtDateDate);
            curtDateNum = +curtDate;

            let nextDateYear  = nextDate.getFullYear();
            let nextDateMonth = nextDate.getMonth();
            let nextDateDate  = nextDate.getDate();
            nextDate = new Date(nextDateYear, nextDateMonth, nextDateDate);
            nextDateNum = +nextDate;

            let sql = "select * from " + TABLE_NAME
                + " where createTime>=? and createTime<? and course=? order by createTime asc";

            let params = [
                curtDateNum,
                nextDateNum,
                course._id,
            ];

            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    db.transaction(function(tx){
                        tx.executeSql(sql, params, function(tx, ret){
                            resolve([].slice.call(ret.rows));
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                }).catch(reject);
            });
        };



        /**
         * @desc 获取指定班级某段时间的问题
         * @param course
         * @param date
         */

        this.getQuestionsByCourseAndDates = function (course, fromDate,endDate) {
            let curtDateNum = +fromDate;
            let nextDateNum = +endDate + 24 * 60 * 60 * 1000;

            let curtDate = new Date(curtDateNum);
            let nextDate = new Date(nextDateNum);

            let curtDateYear  = curtDate.getFullYear();
            let curtDateMonth = curtDate.getMonth();
            let curtDateDate  = curtDate.getDate();
            curtDate = new Date(curtDateYear, curtDateMonth, curtDateDate);
            curtDateNum = +curtDate;

            let nextDateYear  = nextDate.getFullYear();
            let nextDateMonth = nextDate.getMonth();
            let nextDateDate  = nextDate.getDate();
            nextDate = new Date(nextDateYear, nextDateMonth, nextDateDate);
            nextDateNum = +nextDate;

            let sql = "select * from " + TABLE_NAME
                + " where createTime>=? and createTime<? and course=? order by createTime asc";

            let params = [
                curtDateNum,
                nextDateNum,
                course._id
            ];

            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    db.transaction(function(tx){
                        tx.executeSql(sql, params, function(tx, ret){
                            resolve([].slice.call(ret.rows));
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                }).catch(reject);
            });
        };
    }
]);