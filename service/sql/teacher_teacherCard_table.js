/**
 * @ignore  =====================================================================================
 * @file 教师和教师卡之间的关系表
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/30
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("Database").service("TeacherTeacherCardTable", [
    "$q",
    "Database",
    function ($q, Database) {
        const TABLE_NAME = "Teacher_TeacherCard";
        const FIELDS = [
            "teacher",
            "teacherCard"
        ];

        /**
         * @desc 创建老师表
         * @returns {$q|*}
         */
        this.createTable = function () {
            return new $q((resolve, reject) => {
                Database.createTable({
                    name: TABLE_NAME,
                    info: {
                        teacher: 'VARCHAR(40) NOT NULL',
                        teacherCard: 'VARCHAR(40) NOT NULL'
                    }
                }).then(resolve).catch(reject)
            });
        };

        this.addMany = function (teacher, teacherCards) {
            if (teacherCards.length <= 0) {
                return $q.resolve();
            }

            let datas = [];

            for (let card of teacherCards) {
                let data = {
                    "teacher": teacher._id,
                    "teacherCard": card._id,
                };
                datas.push(data);
            }

            return Database.insertMany(TABLE_NAME, FIELDS, datas);
        };

        this.deleteMany = function (teacher, teacherCards) {
            if (teacherCards.length <= 0) {
                return $q.resolve();
            }

            let sql = "delete from " + TABLE_NAME + " where ";
            let params = [];

            sql += " teacher=?";
            params.push(teacher._id);

            for (let i = 0, len = teacherCards.length; i < len; ++i) {
                let card = teacherCards[i];

                if (i === 0) {
                    sql += " and ( ";
                }

                sql += "teacherCard=?";
                params.push(card._id);

                if (i < len - 1) {
                    sql += " or ";
                } else {
                    sql += " )";
                }
            }

            return Database.executeSql(sql, params);
        };

    }]
);