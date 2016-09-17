/**
 * @ignore  =====================================================================================
 * @file 教师和课程的关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("TeacherCourseTable", [
    "$q",
    "Database",
    function (
            $q,
            Database
        ) {

        const TABLE_NAME = "Teacher_Course";
        const FIELDS = [
            "teacher",
            "course",
        ];

        /**
         * @desc 创建家长表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q(function (resolve, reject) {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        teacher: 'VARCHAR(40) NOT NULL',
                        course: 'VARCHAR(40) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };

        /**
         * @desc 向一个老师添加多个课程
         * @param teacher
         * @param courses
         * @returns {$q|*}
         */
        this.addMany = function (teacher, courses) {
            if (courses.length <= 0) {
                return $q.resolve();
            }

            let datas = [];

            for (let course of courses) {
                let data = {
                    "teacher": teacher._id,
                    "course": course._id,
                };
                datas.push(data);
            }

            return Database.insertMany(TABLE_NAME, FIELDS, datas);
        };

        /**
         * @desc 删除一个老师的课程
         * @param teacher
         * @param courses
         * @returns {void|SQLResultSet}
         */
        this.deleteMany = function (teacher, courses) {
            if (courses.length <= 0) {
                return $q.resolve();
            }

            let sql = "delete from " + TABLE_NAME + " where ";
            let params = [];

            sql += " teacher=?";
            params.push(teacher._id);

            for (let i = 0, len = courses.length; i < len; ++i) {
                let course = courses[i];

                if (i === 0) {
                    sql += " and ( ";
                }

                sql += "course=?";
                params.push(course._id);

                if (i < len - 1) {
                    sql += " or ";
                } else {
                    sql += " )";
                }
            }

            return Database.executeSql(sql, params);
        };
    }
]);