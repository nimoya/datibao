/**
 * @ignore  =====================================================================================
 * @file 老师表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("TeacherTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Teacher";

        const FIELDS = [
            "_id",
            "name",
            "account",
            "password",
            "cardId",
            "createTime",
            "preference",
        ];

        /**
         * @desc 创建老师表
         * @returns {$q|*}
         */
        function createTable () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        _id: 'VARCHAR(40) NOT NULL',
                        name: 'VARCHAR(40)',
                        account: 'VARCHAR(40)',
                        password: 'VARCHAR(40)',
                        cardId: 'VARCHAR(100)',
                        createTime: 'VARCHAR(100)',
                        preference: 'VARCHAR(255)'
                    }
                }).then(resolve).catch(reject)
            });
        }

        /**
         * @desc 初始化老师表
         * @returns {$q|*}
         */
        this.init = function () {
            return createTable();
        };

        /**
         * @desc 向数据库中添加一个老师
         * @param teacher
         * @returns {$q|*}
         */
        this.addTeacher = function (teacher) {
            return this.addTeachers([teacher]);
        };

        /**
         * @desc 向数据库中添加一些老师
         * @param teachers
         * @returns {$q|*}
         */
        this.addTeachers = function (teachers) {
            return Database.insertMany(TABLE_NAME, FIELDS, teachers);
        };

        /**
         * @desc 更新一个老师的信息，其中teacher的_id属性必须存在
         * @param teacher
         * @returns {$q|*}
         */
        this.updateTeacher = function (teacher) {
            return this.updateTeachers([teacher]);
        };

        /**
         * @desc 更新一些老师信息，其中teachers数组中个每个元素的_id属性必须存在
         * @param teachers
         * @returns {$q|*}
         */
        this.updateTeachers = function (teachers) {
            return Database.updateMany(TABLE_NAME, FIELDS, teachers);
        };

        /**
         * @desc 判断当前老师是否存在，对于teacher对象_id属性必须存在
         * @param teacher
         * @returns {void|SQLResultSet}
         */
        this.hasTeacher = function (teacher) {
            return new $q((resolve, reject)=>{
                let sql = "select * from " + TABLE_NAME + " where _id=?";
                let params = [teacher._id];

                Database.executeSql(sql, params).then((teachers)=>{
                    resolve(teachers.length > 0);
                }).catch(reject);
            });
        };

        /**
         * 获取指定id的老师
         * @param id
         * @returns {$q|*}
         */
        this.getTeacherById = function (id) {
            let sql = "select * from " + TABLE_NAME + " where _id=?";
            let params = [id];

            return new $q((resolve, reject)=>{
                Database.executeSql(sql, params).then(teachers => {
                    let teacher = null;
                    if (teachers.length > 0) {
                        teacher = teachers[0];
                    }
                    resolve(teacher);
                }).catch(reject);
            });
        };

        /**
         * @desc 获取所有的
         * @returns {$q|*}
         */
        this.getAllTeachers = function () {
            let sql = "select * from " + TABLE_NAME;

            return Database.executeSql(sql, []);
        };
    }
]);