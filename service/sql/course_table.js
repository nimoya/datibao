/**
 * @ignore  =====================================================================================
 * @file 课程表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

(function(){
    let uuid = require("node-uuid");

    angular.module("Database").service("CourseTable", [
        "$q",
        "Database",

        function ($q, Database) {
            const TABLE_NAME = "Course";
            const FIELDS = [
                "_id",
                "name",
                "startTime",
                "endTime",
                "subject",
                "createTime",
            ];

            /**
             * @desc 创建课程表
             * @returns {$q|*}
             */
            function createTable () {
                return new $q(function (resolve, reject) {
                    Database.createTable({
                        name: TABLE_NAME,
                        info: {
                            _id: 'VARCHAR(40) NOT NULL',
                            name: 'VARCHAR(100) NOT NULL',
                            startTime: 'VARCHAR(100)',
                            endTime: 'VARCHAR(100)',
                            subject: 'VARCHAR(40)',
                            createTime: 'VARCHAR(100)',
                        }
                    }).then(resolve).catch(reject)
                });
            }

            /**
             * @desc 初始化课程表
             * @returns {$q|*}
             */
            this.init = function () {
                return createTable();
            };

            /**
             * @desc 更新课程
             * @param course
             */
            this.updateCourse = function (course) {
                return new $q((resolve, reject)=>{
                    let sql = "update " + TABLE_NAME + " set ";

                    let fields = [
                        "_id",
                        "name",
                        "createTime"
                    ];

                    for (let i = 0, len = fields.length; i < len; ++i) {
                        sql += fields[i] + "=?";

                        if (i < len - 1) {
                            sql += ", ";
                        }
                    }

                    sql += " where _id=" + "'" + course._id + "'";

                    let params = [];
                    for (let j = 0, jLen = fields.length; j < jLen; ++j ) {
                        let field = fields[j];
                        params.push(course[field] || null);
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
             * @desc 获取course table中所有的课程
             * @param db
             * @returns {$q|*}
             */
            this.getAllCourse = function () {
                return new $q(function(resolve, reject){
                    Database.openDatabase()
                            .then(function(db){
                                db.transaction(function(tx){
                                    let sql = "select * from Course";
                                    let params = [];

                                    tx.executeSql(
                                        sql,
                                        params,
                                        function(tx, results){
                                            resolve([].slice.call(results.rows));
                                        },
                                        function(tx, err){
                                            reject(err);
                                        });
                                });
                            })
                            .catch(reject);
                });
            };

            /**
             * @desc 添加一个课程
             * @param courseNames
             */
            this.addCourse = function (courseName) {
                let course = {
                    _id: uuid.v4(),
                    name: courseName,
                    createTime: Date.now()
                };

                let fields = Object.keys(course);

                let params = [];
                for (var i = 0, len = fields.length; i < len; ++i) {
                    let field = fields[i];
                    params.push(course[field]);
                }

                let promise = new $q(function(resolve, reject){
                    Database.insertOne(TABLE_NAME, fields, params)
                        .then(resolve)
                        .catch(function(){

                        });
                });

                return [angular.copy(course), promise];
            };

            /**
             * @desc 增加一些课程，
             * @param courses
             * @returns {$q|*}
             */
            this.addCourses = function (courses) {
                return Database.insertMany(TABLE_NAME, FIELDS, courses);
            };

            /**
             * @desc 删除一个班级
             * @param course，course必须含有_id属性
             */
            this.deleteCourse = function (course) {
                return this.deleteCourses([course]);
            };

            /**
             * @desc 删除一些班级
             * @param course，每个course必须含有_id属性
             */
            this.deleteCourses = function (courses) {
                return Database.deleteMany(TABLE_NAME, courses);
            };

            /**
             * @desc 更新一个班级
             * @param course，course必须含有_id属性
             */
            this.updateCourse = function (course) {
                return this.updateCourses([course]);
            };

            /**
             * @desc 更新一些班级，每个course必须含有_id属性
             * @param course
             */
            this.updateCourses = function (courses) {
                return Database.updateMany(TABLE_NAME, FIELDS, courses);
            };

            /**
             * @desc 获取指定老师的课程
             * @param teacher，teacher必须含有_id属性
             * @returns {$q|*}
             */
            this.getCoursesByTeacher = function (teacher) {
                return new $q((resolve, reject)=>{
                    Database.openDatabase().then(db => {
                        db.transaction(tx => {
                            let sql = "select Course.* from Course, Teacher_Course "
                                + "where Course._id=Teacher_Course.course "
                                + "and Teacher_Course.teacher=?";

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
            
        }
    ]);
})();