/**
 * @ignore  =====================================================================================
 * @file 学生表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("StudentTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Student";

        const FIELDS = [
            "_id",
            "name",
            "mPhone",
            "sNumber",
            "createTime",
            "cardId",
            "deleted",
        ];

        /**
         * @desc 创建学生表
         * @returns {$q|*}
         */
        function createTable () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40) NOT NULL',
                        mPhone: 'VARCHAR(40)',
                        sNumber: 'VARCHAR(40)',
                        createTime: 'VARCHAR(100) NOT NULL',
                        cardId: 'VARCHAR(100)',
                        deleted: 'VARCHAR(10)',
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 初始化学生表
         * @returns {$q|*}
         */
        this.init = function () {
            return createTable();
        };

        /**
         * @desc 更新学生
         * @param students, 每个student至少包含_id属性
         * @returns {$q|*}
         */
        this.updateStudents = function (students) {
            return Database.updateMany(TABLE_NAME, FIELDS, students);
        };

        /**
         * @desc 更新一个学生
         * @param student
         * @returns {$q|*}
         */
        this.updateStudent = function (student) {
            return this.updateStudents([student]);
        };

        /**
         * @desc 向数据库中添加学生
         * @param students
         * @returns {$q|*}
         */
        this.addStudents = function (students) {
            return Database.insertMany(TABLE_NAME, FIELDS, students);
        };

        /**
         * @desc 增加一个学生
         * @param student
         */
        this.addStudent = function (student) {
            this.addStudents([student]);
        };

        /**
         * @desc 删除一系列学生
         * @param students
         * @returns {$q|*}
         */
        this.deleteStudents = function (students) {
            return new $q((resolve, reject)=>{
                let sql = "delete from " + TABLE_NAME + " where ";

                for (let i = 0, len = students.length; i < len; ++i) {
                    let student = students[i];
                    sql += "_id = '" + student._id + "'";

                    if (i < len - 1) {
                        sql += " or ";
                    }
                }

                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
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
         * @desc 删除指定的学生
         * @param student
         */
        this.deleteStudent = function (student) {
            return this.deleteStudents([student]);
        };

        /**
         * @desc 获取所有的学生
         * @returns {*}
         */
        this.getAllStudents = function () {
            return $q((resolve, reject)=>{
                Database.selectAll(TABLE_NAME)
                    .then(function(ret){
                        resolve([].slice.call(ret.rows));
                    }).catch(reject)
            });
        };

        /**
         * @desc 获取指定班级所有的学生
         * @param course
         * @returns {$q|*}
         */
        this.getStudentsByCourse = function(course) {
            return new $q((resolve, reject)=>{
                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
                        let sql = "select Student.* from Student, Student_Course "
                            + "where Student._id = Student_Course.student "
                            + "and Student_Course.course=?";

                        let params = [course._id];

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
         * @desc 根据课程获取对应的学生
         * @param courses, 每个course至少包含_id属性
         * @returns {$q|*}，resolve的是一个map，key是课程_id，value是学生数组
         */
        this.getStudentsByCourses = function (courses) {
            let promises = [];
            let p = null;

            for (let course of courses) {
                p = this.getStudentsByCourse(course);
                promises.push(p);
            }
            return new $q((resolve, reject)=>{
                $q.all(promises).then(students=>{
                    let ret = {};
                    for (let i = 0, len = courses.length; i < len; ++i) {
                        let course  = courses[i];
                        let student = students[i];

                        ret[course._id] = student;
                    }
                    resolve(ret);
                }).catch(reject);
            });
        };

        /**
         * @desc 通过cardId获取学生
         * @param cardId
         * @returns {$q|*}
         */
        this.getStudentsByCardId = function (cardId) {
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
                });
            });
        };

        /**
         * @desc 通过学生id获取学生
         * @param id
         * @returns {$q|*}
         */
        this.getStudentById = function (id) {
            return new $q((resolve, reject)=>{
                Database.openDatabase().then((db)=>{
                    db.transaction(function(tx){
                        let sql = "select * from " + TABLE_NAME + " where _id=?";
                        let params = [id];

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
         * @desc 通过id数组获取指定的学生
         * @param ids
         * @returns {$q|*}
         */
        this.getStudentsByIds = function (ids) {
            return new $q((resolve, reject)=>{
                if (!ids || ids.length <= 0) {
                    resolve([]);
                    return;
                }

                Database.openDatabase().then((db)=>{
                    let promises = [];

                    let sql = "select * from " + TABLE_NAME + " where _id=?";
                    for (let id of ids) {
                        let p = new $q((resolve, reject)=>{
                            db.transaction(function(tx){

                                let params = [id];

                                tx.executeSql(sql, params, (tx, ret)=>{
                                    resolve([].slice.call(ret.rows));
                                }, (tx, err)=>{
                                    reject(err);
                                });
                            });
                        });

                        promises.push(p);
                    }

                    $q.all(promises).then(resolve).catch(reject);
                }).catch(reject)
            });
        };

        /**
         * @desc 通过id获取学生
         * @param idsList,一个二维数组，每一个元素都是一个id数组
         * @returns {$q|*} resolve的结果是一个学生的二维数组，对应参数idsList
         */
        this.getStudentsListByIdsList = function (idsList) {
            return new $q((resolve, reject)=>{
                if (!idsList || idsList.length <= 0) {
                    resolve([]);
                    return;
                }

                Database.openDatabase().then((db)=>{
                    db.transaction(function(tx){
                        let promises = [];

                        for (let ids of idsList) {
                            let p = null;

                            if (!ids || ids.length <= 0) {
                                p = Promise.resolve([]);

                            } else {
                                let sql = "select * from " + TABLE_NAME + " where ";
                                let params = [];
                                for (let i = 0; i < ids.length; ++i) {
                                    sql += "_id=?";

                                    if (i < ids.length - 1) {
                                        sql += " or ";
                                    }

                                    params.push(ids[i]);
                                }

                                p = new Promise((resolve, reject)=>{
                                    tx.executeSql(sql, params, (tx, ret)=>{
                                        resolve([].slice.call(ret.rows));
                                    }, (tx, err)=>{
                                        reject(err);
                                    });
                                });
                            }
                            promises.push(p);
                        }

                        Promise.all(promises).then(resolve).catch(reject);
                    });
                }).catch(reject)
            });
        };
    }
]);