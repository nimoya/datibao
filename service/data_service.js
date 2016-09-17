/**
 * @file 数据的service, 这个service是用来屏蔽从本地或从网络中获取的数据的细节
 *        并向外提供一些获取数据的接口
 * Created by 王磊 on 2016/7/19.
 */
angular.module('DTB').service('DataService',[
    '$q',
    'ClassRoomTable',
    'ClassTable',
    'ClassTeacherTable',
    'CourseTable',
    'CourseTimeTable',
    'ParentStudentTable',
    'QuestionTable',
    'RecordTable',
    'StudentClassTable',
    'StudentCourseTable',
    'StudentTable',
    'SubjectTable',
    'TeacherTable',
    'TeacherCardTable',
    'TeacherCourseTable',
    'TimeInDayTable',
    'ParentTable',
    'TeacherTeacherCardTable',
    'NetworkService',
    'RecordService',
    'CacheService',

    function(
        $q,
        ClassRoomTable,
        ClassTable,
        ClassTeacherTable,
        CourseTable,
        CourseTimeTable,
        ParentStudentTable,
        QuestionTable,
        RecordTable,
        StudentClassTable,
        StudentCourseTable,
        StudentTable,
        SubjectTable,
        TeacherTable,
        TeacherCardTable,
        TeacherCourseTable,
        TimeInDayTable,
        ParentTable,
        TeacherTeacherCardTable,
        NetworkService,
        RecordService,
        CacheService
    ){

        const VERSION = APP_CONFIG.version;
        const LOCAL   = Constant.LOCAL;

        /**
         * @desc  获取本地所有老师
         * @returns {$q|*}
         */
        this.fetchLocalTeachers = function () {
            return TeacherTable.getAllTeachers();
        };

        /**
         * @desc 更新本地老师
         * @param teacher
         * @returns {$q|*}
         */
        this.updateLocalTeacher = function (teacher) {
            return TeacherTable.updateTeacher(teacher);
        };

        /**
         * @desc 增加一个本地老师
         * @param teacher
         * @returns {$q|*}
         */
        this.addLocalTeacher = function (teacher) {
            return TeacherTable.addTeacher(teacher);
        };

        /**
         * @desc 更新一个教师的preference（关闭软件时的课程）
         * @param teacher
         * @param preference
         * @returns {*}
         */
        this.updateTeacherPreference = function (teacher, preference) {
            let promise = null;

            // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
            if (VERSION === LOCAL) {
                teacher.preference = preference;
                promise = TeacherTable.updateTeacher(teacher);
            } else if (!NetworkService.isOnline()) {
                promise = $q.reject(new Error("当前处于断网状态"));
            } else {
                promise = NetworkService.updateTeacherPreference(preference);
            }

            return promise;
        };

        /**
         * @desc 缓存登陆账号
         * @param account
         * @returns {$q|*}
         */
        this.cacheLoginAccount = function (account) {
            return CacheService.storeLoginAccount(account);
        };

        /**
         * @desc 删除缓存的账号
         * @param account
         * @returns {$q|*}
         */
        this.deleteCachedAccount = function (account) {
            return CacheService.removeLoginAccount(account);
        };

        /**
         * @desc 获取所有缓存的账号
         * @returns {$q|*}
         */
        this.getAllCachedAccounts = function () {
            return CacheService.restoreAllLoginAccounts();
        };

        /**
         * @desc 获取指定老师绑定的所有教师卡
         * @param teacher
         * @returns {$q}
         */
        this.fetchTeacherCards = function (teacher) {
            let promise = null;

            // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = TeacherCardTable.getTeacherCardsByTeacher(teacher);
            } else if (NetworkService.isOnline()) {
                promise = NetworkService.fetchTeacherCards(teacher);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * @desc 给指定的teacher添加一个教师卡
         * @param teacher, 至少包含_id属性
         * @param teacherCards {Array}, 每个teacherCard至少包含_id属性
         * @returns {$q|*}
         */
        this.addTeacherCards = function (teacher, teacherCards) {
            return new $q((resolve, reject)=>{
                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let p = TeacherCardTable.addTeacherCards(teacherCards);
                    promises.push(p);

                    p = TeacherTeacherCardTable.addMany(teacher, teacherCards);
                    promises.push(p);

                } else if (NetworkService.isOnline()) {
                    let p  = NetworkService.addTeacherCards(teacher, teacherCards);
                    promises.push(p);

                } else {
                    let p = $q.reject(new Error("当前处于断网状态"));
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 合并teacherCards到服务器后端
         * @param teacher
         * @param teacherCards
         * @returns {*}
         */
        this.mergeTeacherCardsToBackend = function (teacher, teacherCards) {
            let promise = null;

            if (NetworkService.isOnline()) {
                promise = NetworkService.mergeTeacherCards(teacher, teacherCards);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * @desc 更新教师卡
         * @param teacherCards {Array}， 每个teacherCard至少包含_id属性
         * @returns {*}
         */
        this.updateTeacherCards = function (teacherCards) {
            let promise = null;

            // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = TeacherCardTable.updateTeacherCards(teacherCards);
            } else if (NetworkService.isOnline()) {
                promise = NetworkService.updateTeacherCards(teacherCards);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * @desc 删除指定老师的教师卡
         * @param teacher，至少包含_id属性
         * @param teacherCards {Array}，每个teacherCard至少包含_id属性
         * @returns {$q|*}
         */
        this.deleteTeacherCards = function (teacher, teacherCards) {
            return new $q((resolve, reject)=>{
                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let p = TeacherCardTable.deleteTeacherCards(teacherCards);
                    promises.push(p);

                    p = TeacherTeacherCardTable.deleteMany(teacher, teacherCards);
                    promises.push(p);
                } else if (NetworkService.isOnline()) {
                    let p = NetworkService.deleteTeacherCards(teacher, teacherCards);
                    promises.push(p);
                } else {
                    let p = $q.reject(new Error("当前处于断网状态"));
                    promises.push(p);
                }

                return $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 获取指定老师所有的课程
         * @param teacher
         * @returns {$q}
         */
        this.fetchCourses = function (teacher) {
            let promise = null;

            // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = CourseTable.getCoursesByTeacher(teacher);
            } else if (NetworkService.isOnline()){
                promise = NetworkService.fetchCourses(teacher);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * @desc 向指定教师添加课程
         * @param teacher，至少包含_id属性
         * @param courses， 每个course至少包含_id属性
         * @returns {$q|*}
         */
        this.addCourses = function (teacher, courses) {
            return new $q((resolve, reject)=>{
                let promises = [];
                let p = null;

                // 本地版答题宝从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    p = CourseTable.addCourses(courses);
                    promises.push(p);

                    p = TeacherCourseTable.addMany(teacher, courses);
                    promises.push(p);
                } else {
                    // 因为联网版的不需要这个功能，所以直接resolve
                    p = $q.resolve();
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 向教师添加一个课程
         * @param teacher，至少包含_id属性
         * @param course，至少包含_id属性
         * @returns {$q|*}
         */
        this.addCourse = function (teacher, course) {
            return this.addCourses(teacher, [course]);
        };

        /**
         * @desc 更新老师下的课程信息
         * @param teacher，至少包含_id属性
         * @param courses，每个course至少包含_id属性
         * @returns {$q|*}
         */
        this.updateCourses = function (teacher, courses) {
            return new $q((resolve, reject)=>{
                let promises = [];
                let p = null;

                // 本地版答题宝从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    p = CourseTable.updateCourses(courses);
                    promises.push(p);
                } else {
                    // 因为联网版的不需要这个功能，所以直接resolve
                    p = $q.resolve();
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 删除一个老师下的课程
         * @param teacher，至少包含_id属性
         * @param courses，每个课程至少包含_id属性
         * @returns {$q|*}
         */
        this.deleteCourses = function (teacher, courses) {
            return new $q((resolve, reject)=>{
                let promises = [];
                let p = null;

                // 本地版答题宝从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    p = TeacherCourseTable.deleteMany(teacher, courses);
                    promises.push(p);

                    p = CourseTable.deleteCourses(teacher, courses);
                    promises.push(p);

                    for (let tmpCourse of courses) {
                        let students = tmpCourse.students || [];

                        p = StudentCourseTable.deleteStudentCourses(tmpCourse, students);
                        promises.push(p);
                    }
                } else {
                    // 因为联网版的不需要这个功能，所以直接resolve
                    p = $q.resolve();
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 获取某个课程下所有的学生
         * @param course
         * @returns {$q}
         */
        this.fetchStudents = function (course) {
            let promise = null;

            // 本地版答题宝从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = StudentTable.getStudentsByCourse(course);
            } else if (NetworkService.isOnline()) {
                promise = NetworkService.fetchStudents(course);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * 获取指定班级的学生
         * @param courses
         * @returns {*}
         */
        this.fetchStudentList = function (courses) {
            let promise = null;

            // 本地版答题宝从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = StudentTable.getStudentsByCourses(courses);
            } else  if (NetworkService.isOnline()){
                promise = NetworkService.fetchStudentList(courses);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };

        /**
         * @desc 添加一些学生
         * @param studentsMap，一个map，key是课程_id,value是学生信息
         * @returns {$q|*}
         */
        this.addStudentList = function (studentsMap) {
            return new $q((resolve, reject)=>{
                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let p = null;

                    let courseIds = Object.keys(studentsMap);
                    for (let courseId of courseIds) {
                        let students = studentsMap[courseId];
                        p = StudentTable.addStudents(students);
                        promises.push(p);

                        p = StudentCourseTable.addStudentCourses({
                            _id: courseId,
                        }, students)
                        promises.push(p);
                    }
                } else {
                    // 联网版答题宝不需要这个功能
                    let p = $q.resolve();
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 删除指定课程的学生
         * @param course，至少包含_id属性
         * @param students {Array}, 每个student至少包含_id属性
         * @returns {*}
         */
        this.deleteStudentList = function (course, students) {
            let promise = null;

            // 本地版答题宝从本地数据库中获取数据
            if (VERSION === LOCAL) {
                promise = StudentCourseTable.deleteStudentCourses(course, students);
            } else {
                promise = $q.resolve();
            }

            return promise;
        };

        /**
         * @desc 批量更新学生
         * @param studentsMap, 一个map，key是课程id，value是学生对象
         * @returns {*}
         */
        this.updateStudentList = function (studentsMap) {
            let promise = null;

            // 本地版答题宝从本地数据库中获取数据
            if (VERSION === LOCAL) {
                let students = [];
                let keys = Object.keys(studentsMap);
                for (let key of keys) {
                    students = students.concat(studentsMap[key]);
                }
                promise = StudentTable.updateStudents(students);
            } else if (NetworkService.isOnline()){
                promise = NetworkService.updateStudentList(studentsMap);
            } else {
                promise = $q.reject(new Error("当前处于断网状态"));;
            }

            return promise;
        };

        this.fetchALlTeachers = function () {
            return TeacherTable.getAllTeachers();
        };

        /**
         * @desc 根据id获取指定的教师
         * @param id
         * @returns {$q|*}
         */
        this.fetchTeacherById = function (id) {
            return TeacherTable.getTeacherById(id);
        };

        /**
         * @desc 获取问题数据
         * @param course
         * @param startDat
         * @param endDate
         * @returns {$q|*}
         */
        this.fetchQuestions = function (course, startTime, endTime) {
            let promise = null;

            if (VERSION === LOCAL) {
                promise = QuestionTable.getQuestionByCourseAndTimeInterval(course, startTime, endTime);
            } else if (NetworkService.isOnline()) {


            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;
        };


        /**
         * @desc 保存问题记录
         */
        this.addQuestion = function (question, records) {
            return new $q((resolve, reject)=>{
                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let p = QuestionTable.addQuestion(question);
                    promises.push(p);

                    for (let record of records) {
                        p = RecordTable.addRecord(record);
                        promises.push(p);
                    }

                } else {
                    if (!NetworkService.isOnline()) {
                        let p = $q.reject(new Error("offline"));
                        promises.push(p);

                    } else {
                        let p = new $q((resolve, reject)=>{
                            let fs = require("fs");
                            let filePath = question.file;
                            if (!!filePath) {
                                fs.readFile(filePath,"base64", (err, data)=>{
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    NetworkService.addQuestion(question, data, records).then(resolve).catch(reject);
                                });
                            } else {
                                reject(new Error("question file is null"));
                            }
                        });
                        promises.push(p);
                    }
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        /**
         * @desc 添加或更新问题
         * @param question ，至少包含_id属性
         * @param records， 每个record至少包含_id属性
         * @returns {$q|*}
         */
        this.addOrUpdateQuestion = function (question, records) {
            return new $q((resolve, reject)=>{
                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let p = QuestionTable.addOrUpdateQuestion(question);
                    promises.push(p);

                    p = RecordTable.addOrUpdateQuestionRecords(question, records);
                    promises.push(p);

                } else if (!NetworkService.isOnline()) {
                    let p = $q.reject(new Error("当前处于断网状态"));
                    promises.push(p);

                } else {
                    let fs = require("fs");
                    let filePath = question.file;
                    let p = null;
                    if (!!filePath) {
                        p = new $q((resolve, reject)=>{
                            fs.readFile(filePath,"base64", (err, data)=>{
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                NetworkService.addOrUpdateQuestion(question, data, records).then(resolve).catch(reject);
                            });
                        });

                    } else {
                        p = NetworkService.addOrUpdateQuestion(question, null, records);
                    }
                    promises.push(p);
                }

                $q.all(promises).then(resolve).catch(reject);
            });
        };

        this.addOrUpdateQuestions = function (datas) {
            return new $q((resolve, reject)=>{
                if (!datas || datas.length <= 0) {
                    resolve();
                    return;
                }

                let promises = [];

                // 本地版答题宝或在联网版在断网的时候从本地数据库中获取数据
                if (VERSION === LOCAL) {
                    let questions = [];
                    for (let data of datas) {
                        questions.push(data.question);
                    }
                    let p = QuestionTable.addOrUpdateQuestions(questions);
                    promises.push(p);

                    p = RecordTable.addOrUpdateQuestionRecordsList(datas);
                    promises.push(p);

                } else if (!NetworkService.isOnline()) {
                    let p = $q.reject(new Error("当前处于断网状态"));
                    promises.push(p);

                } else {
                    let p = new $q((resolve, reject)=>{
                        if (!datas || datas.length <= 0) {
                            resolve();
                            return;
                        }

                        let promises = [];
                        for (let data of datas) {
                            let question = data.question;
                            let records  = data.records;

                            let fs = require("fs");
                            let filePath = question.file;
                            let p = null;
                            if (!!filePath) {
                                p = new $q((resolve, reject)=>{
                                    fs.readFile(filePath,"base64", (err, data)=>{
                                        if (err) {
                                            reject(err);
                                            return;
                                        }
                                        NetworkService.addOrUpdateQuestion(question, data, records).then(resolve).catch(reject);
                                    });
                                });

                            } else {
                                p = NetworkService.addOrUpdateQuestion(question, null, records);
                            }
                            promises.push(p);
                        }

                        $q.all(promises).then(resolve).catch(reject);
                    });
                    promises.push(p);
                }
                $q.all(promises).then(resolve).catch(reject);
            });
        };


        // this.fetchReport = function (course, date) {
        //     let promise = null;

        //     if (VERSION === LOCAL) {
        //         promise = fetchLocalReport(course, date);
        //     } else if (NetworkService.isOnline()) {
        //         promise = fetchNetworkReport(course, date);
        //     } else {
        //         promise = $q.reject(new Error("当前处于断网状态"));
        //     }

        //     return promise;
        // };

        /**
         * @desc 获取image的binary数据
         * @param imagePath
         * @returns {*}
         */
        this.fetchImage = function (imagePath) {
            let promise = null;

            if (imagePath.startsWith("http" || imagePath.startsWith("https"))) {
                if (NetworkService.isOnline()) {
                    promise = NetworkService.loadImage(imagePath);
                } else {
                    promise = $q.reject(new Error("当前处于断网状态"));
                }
            } else {
                promise = new $q((resolve, reject)=>{
                    let fs = require("fs");
                    fs.readFile(imagePath, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(data);
                    });
                });
            }
            return promise;
        };

        /**
         * @desc 获取某个课程下指定时间段的报告信息
         * @param course
         * @param fromDate
         * @param endDate
         * @returns {*}
         */
        this.fetchReports = function (course, fromDate, endDate) {
            let promise = null;

            if (VERSION === LOCAL) {
                promise = fetchLocalReports(course, fromDate, endDate);
            } else if (NetworkService.isOnline()) {
                promise = fetchNetworkReports(course, fromDate, endDate);

            } else {
                promise = $q.reject(new Error("当前处于断网状态"));
            }

            return promise;

        };

        function fetchNetworkReport (course, date) {
            return NetworkService.fetchReport(course, date);
        }

        function fetchNetworkReports (course, fromDate, endDate) {
            return NetworkService.fetchReportBetweenDates(course, fromDate, endDate);
        }

        // function fetchLocalReport (course, date) {
        //     return new $q((resolve, reject)=>{
        //         QuestionTable.getQuestionsByCourseAndDate(course, date).then((questions)=>{
        //             let promises = [];
        //             let p = null;


        //             p = StudentTable.getStudentsByCourse(course);
        //             promises.push(p);

        //             p = RecordTable.getRecordsByQuestions(questions);
        //             promises.push(p);

        //             $q.all(promises).then(ret=>{
        //                let students = ret[0];
        //                let records  = ret[1];

        //                for (let student of students) {
        //                     student.records = [];

        //                     for (let question of questions) {
        //                         let record = null;

        //                         for (let tmpRecord of records) {
        //                             if (tmpRecord.question === question._id 
        //                                     && student._id === tmpRecord.student) {
        //                                 record = tmpRecord;
        //                             }
        //                         }

        //                         student.records.push(record);
        //                     }
        //                }

        //                 resolve({
        //                     questions: questions,
        //                     students: students
        //             });

        //             }).catch(reject);
        //         }).catch(reject);

        //     });
        // }

        /**
         * @desc 从本地数据库获取指定课程指定时间段的报告
         * @param course
         * @param fromDate
         * @param endDate
         * @returns {$q|*}
         */
        function fetchLocalReports (course, fromDate, endDate) {
            return new $q((resolve, reject)=>{
                QuestionTable.getQuestionsByCourseAndDates(course, fromDate, endDate).then((questions)=>{
                    let promises = [];
                    let p = null;

                    p = StudentTable.getStudentsByCourse(course);
                    promises.push(p);

                    p = RecordTable.getRecordsByQuestions(questions);
                    promises.push(p);

                    $q.all(promises).then(ret=>{
                        let students = ret[0];
                        let records  = ret[1];

                        for (let student of students) {
                            student.records = [];
                        }

                        for (let tmpRecord of records) {
                            for (let student of students) {
                                if (tmpRecord.student === student._id) {
                                    student.records.push(tmpRecord);
                                    break;
                                }
                            }
                        }

                        resolve({
                            questions: questions,
                            students: students
                        });

                    }).catch(reject);
                }).catch(reject);

            });
        }

        function fetchRecordsByQuestion (question) {
            return RecordService.fetchRecordsByQuestion(question);
        }

        // function fetchStudentsByRecords (records) {
        //     return RecordService.fetchStudentsByRecords(records);
        // }

        // function fetchStudentsListByRecordsList (recordsList) {
        //     return RecordService.fetchStudentsListByRecordsList(recordsList);
        // }

        /**
         * @desc 获取某个班级在某个日期前（包括当天）创建的学生
         * @param course
         * @param date
         * @returns {$q|*}
         */
        // function fetchStudentsByCourseAndBeforeDate(course, date) {
        //     return new $q((resolve, reject)=>{
        //         StudentTable.getStudentsByCourse(course).then((students)=>{
        //             date = +date;
        //             date += 24 * 60 * 60 * 1000;
        //             date = new Date(date);

        //             date.setHours(0);
        //             date.setMinutes(0);
        //             date.setSeconds(0);

        //             date = +date;

        //             let targetStudents = [];

        //             for (let stu of students) {
        //                 if (stu.createTime < date) {
        //                     targetStudents.push(stu);
        //                 }
        //             }

        //             resolve(targetStudents);

        //         }).catch(reject);
        //     });
        // }



        /**
         * @desc 合并两个学生数组
         * @param targetStudents
         * @param originStudents
         * @returns {Array}
         */
        function unionStudents (targetStudents, originStudents) {
            for (let stu of originStudents) {
                let isNew = true;
                for (let tmpStu of targetStudents) {
                    if (tmpStu._id === stu._id) {
                        isNew = false;
                        break;
                    }
                }

                if (!isNew) {
                    continue;
                }

                targetStudents.push(stu);
            }

            return targetStudents;
        }

        // function fetchLocalReportStudents (course, questions, date) {
        //     return new $q((resolve, reject)=>{
        //         let promises = [];
        //         let p = null;

        //         promises.push($q.resolve(course));
        //         promises.push($q.resolve(questions));

        //         promises.push(RecordService.fetchRecordsListByQuestions(questions));

        //         let startDate = Date.now();
        //         // for (let question of questions) {
        //         //     let p = fetchRecordsByQuestion(question);
        //         //     promises.push(p);
        //         // }

        //         $q.all(promises).then((params)=>{
        //             console.log("#############: " + ((Date.now() - startDate)/1000) + "s");
        //             let course = params[0];
        //             let questions = params[1];
        //             let recordsList = params[2];

        //             let promises = [];
        //             promises.push($q.resolve(questions));
        //             promises.push($q.resolve(recordsList));

        //             // for (let records of recordsList) {
        //             //     let p = fetchStudentsByRecords(records);
        //             //     promises.push(p);
        //             // }

        //             promises.push(fetchStudentsListByRecordsList(recordsList));

        //             promises.push(fetchStudentsByCourseAndBeforeDate(course, date));

        //             return $q.all(promises);
        //         })
        //             .then((params)=>{
        //                 let questions = params[0];
        //                 let recordsCollection   = params[1];
        //                 let studentsCollections  = params[2];
        //                 let curtStudents = params[3];

        //                 let tmpStudents = [];
        //                 tmpStudents = unionStudents(tmpStudents, curtStudents);
        //                 for (let students of studentsCollections) {
        //                     tmpStudents = unionStudents(tmpStudents, students);
        //                 }

        //                 for (let stu of tmpStudents) {
        //                     stu.records = new Array(questions.length);
        //                 }

        //                 for (let i = 0, len = questions.length; i < len; ++i) {
        //                     let records = recordsCollection[i];
        //                     for (let stu of tmpStudents) {
        //                         for (let record of records) {
        //                             if (record.student === stu._id) {
        //                                 stu.records[i] = record;
        //                             }
        //                         }
        //                     }
        //                 }

        //                 resolve(tmpStudents);
        //             })
        //             .catch(reject);
        //     });
        // }
    }]
);