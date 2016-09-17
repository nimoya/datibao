/**
 * Created by 26053 on 2016/6/16.
 */
angular.module('DTB').service('NetworkService',[
        '$q',
        '$http',
        'md5',
        'CacheService',

        function(
            $q,
            $http,
            md5,
            CacheService
        ){
            // const URL_BASE = "http://z.gewuit.com:3002";
            const URL_BASE = "http://192.168.199.204:3002";

            let TOKEN = "";

            let uuid = 0

            /**
             * @desc 登陆
             * @param username
             * @param password
             * @returns {HttpPromise}
             */
            this.login = function (username, password) {
                const url = URL_BASE + "/teacher/login";

                return new $q((resolve, reject)=>{
                    $http.post(url, {
                        account: username,
                        password: password,
                    }).then((res)=>{
                        let data = res.data;
                        if (data.success) {
                            TOKEN = data.token;
                        }
                        resolve(data);
                    }).catch(reject);
                });
            };

            /**
             * @desc 更新教师在软件关闭的时候打开的课程
             * @param preference
             * @returns {$q|*}
             */
            this.updateTeacherPreference = function (preference) {
                const url = URL_BASE + "/teacher/preference/update?token=" + TOKEN;

                return new $q((resolve, reject)=>{
                    $http.post(url, {
                        preference: preference
                    }).then((res)=>{
                        let data = res.data;

                        if (data.success) {
                            resolve(true);
                        } else {
                            console.error(data.error.message);
                            resolve(false);
                        }
                    }).catch(reject);
                });
            };

            /**
             * @desc 获取教师所有的课程
             * @returns {HttpPromise}
             */
            this.fetchCourses = function (teacher) {
                let teacherId = teacher._id;
                const url = URL_BASE + "/course/get?token=" + TOKEN;

                return new $q((resolve, reject)=>{
                    $http.get(url).then((res)=>{
                        let data = res.data;

                        let courses = [];

                        if (data.success) {
                            courses = data.courses || [];
                        } else {
                            console.error(data.error.message);
                        }

                        resolve(courses);

                    }).catch(reject);
                });
            };

            /**
             * @desc 获取指定老师下所有的教师卡
             * @param teacher
             * @returns {HttpPromise}
             */
            this.fetchTeacherCards = function (teacher) {
                return new $q((resolve, reject)=>{
                    const url = URL_BASE + "/teacher/card/get?token=" + TOKEN;

                    $http.get(url).then(res =>{
                        let data = res.data;

                        let cards = [];
                        if (data.success) {
                            cards = data.teacherCards || [];
                        } else {
                            console.error(data.error.message);
                        }

                        resolve(cards);
                    }).catch(reject);
                });
            };

            /**
             * @desc 增加教师卡
             * @param teacher
             * @param teacherCards
             * @returns {$q|*}
             */
            this.addTeacherCards = function (teacher, teacherCards) {
                return new $q((resolve, reject)=>{
                    let count = 0;
                    const url = URL_BASE + "/teacher/card/add?token=" + TOKEN;

                    put();

                    function put () {
                        $http.put(url, {
                            teacherCards: teacherCards,
                        }).then(res => {
                            let data = res.data;

                            if (!data.success) {
                                console.error(data.error.message);
                                count++;

                                if (count < 10) {
                                    put();
                                } else {
                                    reject(new Error(data.error.message));
                                }
                            } else {
                                resolve();
                            }
                        }).catch((err)=>{
                            console.error(err);
                            count++;

                            if (count < 10) {
                                put();
                            } else {
                                reject(new Error(data.error.message));
                            }
                        });
                    }
                });
            };

            /**
             * @desc 同步老师卡到后台
             * @param teacher
             * @param teacherCards
             * @returns {$q|*}
             */
            this.mergeTeacherCards = function (teacher, teacherCards) {
                return new $q((resolve, reject)=>{
                    if (teacherCards.length <= 0) {
                        resolve();
                        return;
                    }

                    const url = URL_BASE + "/teacher/card/merge?token=" + TOKEN;

                    $http.post(url, {
                        teacherCards: teacherCards,
                    }).then(res =>{
                        let data = res.data;

                        if (data.success) {
                            resolve();
                        } else {
                            reject(new Error(data.error.message));
                        }


                    }).catch(reject);
                });

            };

            /**
             * @desc 更新教师卡
             * @param teacherCards
             * @returns {$q|*}
             */
            this.updateTeacherCards = function (teacherCards) {
                return new $q((resolve, reject)=>{
                    let count = 0;
                    const url = URL_BASE + "/teacher/card/update?token=" + TOKEN;

                    post();

                    function post () {
                        $http.post(url, {
                            teacherCards: teacherCards,
                        }).then(res => {
                            let data = res.data;

                            if (!data.success) {
                                console.error(data.error.message);
                                count++;

                                if (count < 10) {
                                    post();
                                } else {
                                    reject(new Error(data.error.message));
                                }
                            } else {
                                resolve();
                            }
                        }).catch((err)=>{
                            console.error(err);
                            count++;

                            if (count < 10) {
                                post();
                            } else {
                                reject(new Error(data.error.message));
                            }
                        });
                    }
                });
            };

            /**
             * @desc 删除指定教师下绑定的教师卡
             * @param teacher
             * @param teacherCards
             * @returns {$q|*}
             */
            this.deleteTeacherCards = function (teacher, teacherCards) {
                return new $q((resolve, reject)=>{
                    let count = 0;

                    let url = URL_BASE + "/teacher/card/delete?token=" + TOKEN;

                    let ids = [];
                    for (let card of teacherCards) {
                        ids.push(card._id);
                    }

                    url += "&teacherCardIds=" + encodeURIComponent(ids.join(" "));

                    deleteFunc();

                    function deleteFunc () {
                        $http.delete(url).then(res => {
                            let data = res.data;

                            if (!data.success) {
                                console.error(data.error.message);
                                count++;

                                if (count < 10) {
                                    deleteFunc();
                                } else {
                                    reject(new Error(data.error.message));
                                }
                            } else {
                                resolve();
                            }
                        }).catch((err)=>{
                            console.error(err);
                            count++;

                            if (count < 10) {
                                deleteFunc();
                            } else {
                                reject(new Error(data.error.message));
                            }
                        });
                    }
                });
            };

            /**
             * @desc 获取指定班级的学生
             * @param course
             * @returns {$q|*}
             */
            this.fetchStudents = function (course) {
                return new $q((resolve, reject)=>{
                    const url = URL_BASE + "/students/get?token=" + TOKEN;

                    $http.get(url, {
                        course: course,

                    }).then(res =>{
                        let data = res.data;

                        let students = [];
                        if (data.success) {
                            students = data.students || [];
                        } else {
                            console.error(data.error.message);
                        }

                        resolve(students);
                    }).catch(reject);
                });
            };

            /**
             * @desc 获取指定班级的学生
             * @param courses
             * @returns {$q|*}
             */
            this.fetchStudentList = function (courses) {
                return new $q((resolve, reject)=>{
                    let courseIds = [];
                    for (let course of courses) {
                        courseIds.push(course._id);
                    }
                    let idParam    = "courseIds=" + encodeURIComponent(courseIds.join(" "));
                    let tokenParam = "token=" + TOKEN;
                    const url = URL_BASE + "/student/relationship/get?" + tokenParam + "&" + idParam;

                    $http.get(url).then((res)=>{
                        let data = res.data;

                        let studentsMap = {};
                        if (data.success) {
                            studentsMap = data.studentsMap || {};
                        } else {
                            console.error(data.error.message);
                        }

                        resolve(studentsMap);
                    }).catch(reject);
                });
            };

            /**
             * @desc 更新学生信息
             * @param studentsMap
             * @returns {$q|*}
             */
            this.updateStudentList = function (studentsMap) {
                return new $q((resolve, reject)=>{
                    let tokenParam = "token=" + TOKEN;
                    const url = URL_BASE + "/student/relationship/update?" + tokenParam;

                    $http.post(url, {
                        studentsMap: studentsMap
                    }).then((res)=>{
                        let data = res.data;

                        if (data.success) {
                           let studentsMap = data.studentsMap || {};
                            resolve(studentsMap);
                        } else {
                           reject(new Error(data.error.message));
                        }

                    }).catch(reject);
                });
            };

            /**
             * @desc 向后台添加教师卡
             * @param teacherCard
             * @returns {HttpPromise}
             */
            this.addTeacherCard = function (teacherCard) {
                const url = URL_BASE + "/teacher/card/add?token=" + TOKEN;

                return $http.put(url, {
                    teacher: teacherCard,
                });
            };

            /**
             * @desc 删除指定的教师卡
             * @param teacherCard
             * @returns {HttpPromise}
             */
            this.deleteTeacherCard = function (teacherCard) {
                const url = URL_BASE + "/teacher/card/delete?token=" + TOKEN;

                return $http.delete(url, {
                    teacher: teacherCard,
                });
            };

            /**
             * @desc 向某个课程添加一个学生
             * @param course
             * @param student
             * @returns {HttpPromise}
             */
            this.addStudent = function (course, student) {
                const url = URL_BASE + "/student/add?token=" + TOKEN;

                return $http.put(url, {
                    course: course,
                    student: student,
                });
            };

            /**
             * @desc 更新指定课程下的指定学生
             * @param course
             * @param student
             * @returns {HttpPromise}
             */
            this.updateStudent = function (course, student) {
                const url = URL_BASE + "/student/update?token=" + TOKEN;

                return $http.post(url, {
                    course: course,
                    student: student,
                });
            };

            /**
             * @desc 批量删除指定课程下的学生
             * @param course，至少包含_id属性
             * @param students，对于每个student至少包含_id属性
             * @returns {HttpPromise}
             */
            this.deleteStudents = function (course, students) {
                const url = URL_BASE + "/student/delete?token=" + TOKEN;

                return $http.delete(url, {
                    course: course,
                    student: students,
                });
            };

            /**
             * @desc 添加一个课程
             * @param course
             * @returns {HttpPromise}
             */
            this.addCourse = function (course) {
                const url = URL_BASE + "/course/add?token=" + TOKEN;

                return $http.put(url, {
                    course: course,
                });
            };

            /**
             * @desc 更新课程
             * @param course
             * @returns {HttpPromise}
             */
            this.updateCourse = function (course) {
                const url = URL_BASE + "/course/update?token=" + TOKEN;

                return $http.post(url, {
                    course: course,
                });
            };

            this.deleteCourse = function (course) {
                const url = URL_BASE + "/course/delete?token=" + TOKEN;

                return $http.delete(url, {
                    course: course,
                });
            };

            this.addRecord = function (record) {
                const url = URL_BASE + "/record/add?token=" + TOKEN;

                return $http.put(url, {
                    record: record,
                });
            };

            /**
             * @desc 向后台添加一个问题记录
             * @param question
             * @param file
             * @param records
             * @returns {HttpPromise}
             */
            this.addQuestion = function (question, file, records) {
                const url = URL_BASE + "/question/add?token=" + TOKEN;
                return $http.put(url, {
                    question: question,
                    file: file,
                    records: records,
                });
            };

            /**
             * @desc 向后台添加或更新一个问题的记录
             * @param question
             * @param file
             * @param records
             * @returns {HttpPromise}
             */
            this.addOrUpdateQuestion = function (question, file, records) {
                const url = URL_BASE + "/question/addorupdate?token=" + TOKEN;
                return $http.post(url, {
                    question: question,
                    file: file,
                    records: records,
                });
            };

            /**
             * @desc 获取指定时间段内一个课程的所有问题
             * @param course
             * @param startTime
             * @param endTime
             * @returns {$q|*}
             */
            this.fetchQuestions = function (course, startTime, endTime) {
                return new $q((resolve, reject)=>{
                    startTime = +startTime;
                    endTime   = +endTime;

                    let url = URL_BASE + "/question/get?token=" + TOKEN
                        + "&startTime=" + startTime + "&endTime=" + endTime;

                    $http.get(url).then((res)=>{
                        let data = res.data;

                        if (data.success) {
                            resolve(data.questions || []);
                        } else {
                            reject(new Error(data.message.error));
                        }
                    }).catch(reject);
                });
            };

            /**
             * @desc 获取指定某个课程指定日期的报告数据
             * @param course
             * @param date
             * @returns {$q|*}
             */
            this.fetchReport = function (course, date) {
                let dateNum = +date;
                let courseId = course._id;
                const url = URL_BASE + "/record/get?token=" + TOKEN + "&date=" + dateNum + "&courseId=" + courseId;

                return new $q((resolve, reject)=>{
                    $http.get(url).then((res)=>{
                        let data = res.data;

                        if (data.success) {
                            let questions = data.questions || [];
                            for (let question of questions) {
                                if (!!question.file) {
                                    question.file = URL_BASE + "/" + question.file;
                                }
                            }
                            resolve({
                                questions: questions,
                                students: data.students || [],
                            });
                        } else {
                            reject(new Error(data.message.error));
                        }
                    }).catch(reject);
                });
            };

            /**
             * @desc 获取指定课程某个时间段的报告信息
             * @param course
             * @param startDate
             * @param endDate
             * @returns {$q|*}
             */
            this.fetchReportBetweenDates = function (course, startDate, endDate) {
                let startDateNum = +startDate;
                let endDateNum   = +endDate;
                let courseId = course._id;
                const url = URL_BASE + "/record/duration/get?token=" + TOKEN
                                            + "&startDate=" + startDateNum
                                            + "&endDate=" + endDateNum
                                            + "&courseId=" + courseId;

                return new $q((resolve, reject)=>{
                    $http.get(url).then((res)=>{
                        let data = res.data;

                        if (data.success) {
                            let questions = data.questions || [];
                            for (let question of questions) {
                                if (!!question.file) {
                                    question.file = URL_BASE + "/" + question.file;
                                }
                            }
                            resolve({
                                questions: questions,
                                students: data.students || [],
                            });
                        } else {
                            reject(new Error(data.message.error));
                        }
                    }).catch(reject);
                });
            };

            /**
             * @desc 从后台中加载一个图片，返回图片的binary
             * @param imageUrl
             * @returns {$q|*}
             */
            this.loadImage = function (imageUrl) {
                return new $q((resolve, reject)=>{
                    if (this.isOnline()) {
                        let http = require("http");
                        let url = imageUrl;
                        CacheService.isFileStore(url).then(isStored => {
                            if (isStored) {
                                CacheService.restoreFile(url).then(resolve).catch(reject);
                                return;
                            }

                            http = http.get(url, function (res) {
                                try {
                                    let fs = require("fs");
                                    let tmpFilePath = "$$$$$$$$$$$$$$$$$$$$$$$$$^^^^^^^^^^^^^^^" + (++uuid) + ".png";
                                    let tmpStream = fs.createWriteStream(tmpFilePath);
                                    res.pipe(tmpStream, {
                                        end: false
                                    });

                                    res.on("end", function (data) {
                                        tmpStream.on('finish', function(){
                                            fs.readFile(tmpFilePath, (err, data) => {
                                                if (err) {
                                                    reject(err);
                                                    return;
                                                }
                                                fs.unlink(tmpFilePath, function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                        return;
                                                    }
                                                });

                                                CacheService.cacheFile(imageUrl, data);
                                                resolve(data);
                                            });
                                        });

                                        tmpStream.end(data);
                                    });

                                    res.on("error", reject);

                                } catch (err) {
                                    reject(err);
                                }
                            });

                        }).catch(reject);

                    } else {
                        reject(new Error("当前处于断网状态"));
                    }
                });
            };

            this.isOnline = function () {
                return navigator.onLine;
            };
    }]
);