/**
 * @ignore  =====================================================================================
 * @file 学生和课程的关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("StudentCourseTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Student_Course";
        const FIELDS = [
            "student",
            "course",
        ];

        /**
         * @desc 学生和课程的关系表
         * @returns {$q|*}
         */
        function createTable () {
            return Database.createTable({
                name: TABLE_NAME,
                info: {
                    student: 'VARCHAR(40) NOT NULL',
                    course: 'VARCHAR(40) NOT NULL'
                }
            });
        }

        /**
         * @desc 初始化学生课程表
         * @returns {$q|*}
         */
        this.init = function () {
            return createTable();
        };

        /**
         * @desc 向一个班级添加一个学生
         * @param course, 至少包含_id属性
         * @param student，至少包含_id属性
         */
        this.addStudentCourse = function (course, student) {
            let fields = [
                "student",
                "course"
            ];

            let params = [
                student._id,
                course._id
            ];

            return Database.insertOne(TABLE_NAME, fields, params);
        };

        /**
         * @desc 获取指定班级所有学生
         * @param courseId
         * @returns {$q|*}
         */
        this.getAllStudentsByCourseId = function(courseId) {
            return new $q((resolve, reject)=>{
                let sql = "select Student.* from Student, Student_Course "
                            + "where Student._id = Student_Course.student "
                            + "and Student_Course.course = '" + courseId + "'";

                Database.openDatabase().then(function(db){
                    db.transaction(function(tx){
                        tx.executeSql(sql, [], function(tx, ret){
                            resolve([].slice.call(ret.rows));
                        }, function(tx, err){
                            reject(err);
                        });
                    });
                }).catch(reject);
            });
        };

        /**
         * @desc 向一个班级增加多个学生
         * @param course, 至少包含_id属性
         * @param students, 每个student至少包含_id属性
         * @returns {$q|*}
         */
        this.addStudentCourses = function (course, students) {
            if (students.length <= 0) {
                return $q.resolve();
            }

            let datas = [];

            for (let student of students) {
                let data = {
                    "course": course._id,
                    "student": student._id,
                };
                datas.push(data);
            }

            return Database.insertMany(TABLE_NAME, FIELDS, datas);
        };

        /**
         * @desc 删除指定课程的学生
         * @param course
         * @param students
         * @returns {$q|*}
         */
        this.deleteStudentCourses = function (course, students) {
            if (students.length <= 0) {
                return $q.resolve();
            }

            let sql = "delete from " + TABLE_NAME + " where ";
            let params = [];

            sql += " course=?";
            params.push(course._id);

            for (let i = 0, len = students.length; i < len; ++i) {
                let stu = students[i];

                if (i === 0) {
                    sql += " and ( ";
                }

                sql += "student=?";
                params.push(stu._id);

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