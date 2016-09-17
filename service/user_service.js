/**
* @ignore  =====================================================================================
* @fileoverview 关于班级的信息获取
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/8
* @ignore  depend
* @ignore  =====================================================================================
*/
"use strict";

(function(){
    angular.module('DTB').service('UserService',[
        "$q",
        "$timeout",
        'NetworkService',
        'DataService',
        'CacheService',

        function (
            $q,
            $timeout,
            NetworkService,
            DataService,
            CacheService
            ) {

            const PRESENT_INTERVAL = 20 * 60 * 1000;

            let self = this;

            let _teachers = [];

            let _teacher = {};

            let _teacherCards = [];

            //所有普通课程(不包括公开课等)
            let _normalCourses=[];

            // 公开课
            let _openCourses=[{
                _id: "-1",
                name:'公开课',
                value:'openClass',
                openClass: true,
                students:[]
            }];

            let _currentCourseId = _openCourses[0]._id;

            /**
             * @desc User Service的初始化函数
             * @param teacher
             * @returns {Promise}
             */
            this.init = function (teacher) {
                _teacher = teacher || {};

                this.checkStudentPresent();

                let promises = [];
                let p = null;

                // 初始化当前老师的所有课程
                p = new $q((resolve, reject)=>{
                    // 联网版答题宝并且断网的时候，从缓存中获取数据
                    if (!NetworkService.isOnline()
                            && APP_CONFIG.version === Constant.NETWORK) {
                        this.getDataFromCache().then((data)=>{
                            _normalCourses = data.courses;
                            _teacherCards  = data.teacherCards;
                            resolve();
                        }).catch(reject);
                    } else {
                        DataService.fetchCourses(_teacher).then((courses)=>{
                            _normalCourses = courses || [];

                            // 获取课程的所有学生
                            let promise = null;
                            if (_normalCourses.length > 0) {
                                promise = DataService.fetchStudentList(_normalCourses);
                            } else {
                                promise = $q.resolve([]);
                            }
                            return promise;
                        }).then(studentList => {
                            // 初始化每个班级的学生
                            for (let course of _normalCourses) {
                                course.students = studentList[course._id];
                            }
                            resolve();
                        }).then(()=>{
                            // 获取老师卡
                            return new $q((resolve, reject)=>{
                                DataService.fetchTeacherCards(_teacher).then(teacherCards => {
                                    _teacherCards = teacherCards;
                                    resolve();
                                }).catch(reject);
                            });
                        }).catch(reject);
                    }
                });
                promises.push(p);

                return new $q((resolve, reject)=>{
                    $q.all(promises).then(()=>{
                        let teacher = this.getTeacher();
                        if (teacher.preference == null
                                || !this.isCourseExistsById(teacher.preference)) {
                            _currentCourseId = _openCourses[0]._id;
                        } else {
                            _currentCourseId = teacher.preference;
                        }
                        resolve();
                    }).catch(reject);
                });
            };

            /**
             * @desc 将user的数据保存到缓存中去
             */
            this.saveDataToCache = function () {
                let user = angular.copy(_teacher);

                let courses = this.getNormalCourses();
                courses = angular.copy(courses || []);
                for (let course of courses) {
                    let students = course.students || [];
                    for (let stu of students) {
                        delete stu.isBePresent;
                        delete stu.attendanceTime;
                    }
                }

                let teacherCards = this.getTeacherCards();
                teacherCards = angular.copy(teacherCards || []);

                let data = {
                    courses: courses,
                    teacherCards: teacherCards
                };

                return CacheService.storeUserData(user, data);
            };

            /**
             * @desc 从缓存中获取user service的数据
             * @returns {$q|*|*}
             */
            this.getDataFromCache = function () {
                return CacheService.restoreUserData(_teacher);
            };

            this.setTeachers = function (teachers) {
                _teachers = angular.copy(teachers);
            };

            this.getTeacehrs = function () {
                return angular.copy(_teachers);
            };

            /**
             * @desc 获取课程的引用
             * @returns {Array}
             */
            this.getCoursesReference = function () {
                let courses = [];
                for (let course of _normalCourses) {
                    courses.push(course);
                }
                for (let course of _openCourses) {
                    courses.push(course);
                }
                return courses;
            };

            /**
             * @desc 获取所有的课程
             * @returns {*}
             */
            this.getCourses = function () {
                return angular.copy(this.getCoursesReference());
            };

            /**
             * @desc 获取当前课程的引用
             * @returns {*}
             */
            this.getCurrentCourseReference = function () {
                let courses = this.getCoursesReference();
                for (let course of courses) {
                    if (course._id === _currentCourseId) {
                        return course;
                    }
                }
                return null;
            }

            /**
             * @desc 获取当前的课程
             * @returns {*}
             */
            this.getCurrentCourse = function () {
               return angular.copy(this.getCurrentCourseReference());
            };

            /**
             * @desc 更新当前的课程
             * @param course
             */
            this.updateCurrentCourse = function (course) {
                if (course != null) {
                    if (_currentCourseId !== course._id) {
                        DataService.updateTeacherPreference(_teacher, course._id).then((success)=>{
                            console.log("updateTeacherPreference: " + success);
                        }).catch(err=>{
                            console.error(err);
                        });
                    }

                    _currentCourseId = course._id;
                    _teacher.preference = _currentCourseId;
                } else {
                    console.error("user service: updateCurrentCourse: course is null");
                }
            };


            /**
             * @desc 获取当前的老师（用户）
             * @returns {*}
             */
            this.getTeacher = function () {
                return angular.copy(_teacher);
            };

            /**
             * 获取老师（用户）名称
             */
            this.getTeacherName=function() {
                return _teacher.name || "";
            };

            /**
             * @desc 设置教师卡
             * @param teacherCards
             */
            this.setTeacherCards = function (teacherCards) {
                _teacherCards = angular.copy(teacherCards || []);
            };

            /**
             * @desc 获取老师卡
             * @returns {*}
             */
            this.getTeacherCards = function () {
                return angular.copy(_teacherCards || []);
            };

            /**
             * @desc 设置普通班级
             * @param courses
             */
            this.setNormalCourses = function (courses) {
                // 如果当前课程为normal课程，那么要判断当前课程是否在要设置的课程中
                let isCurtCourseExist = false;
                if (this.isNormal()) {
                    let curtCourse = this.getCurrentCourse();
                    if (curtCourse) {
                        for (let course of  courses) {
                            if (course._id === curtCourse._id) {
                                isCurtCourseExist = true;
                                break;
                            }
                        }
                    }
                } else {
                    isCurtCourseExist = true;
                }

                let oldCourses = _normalCourses;

                for (let newCourse of courses) {
                    for (let oldCourse of oldCourses) {
                        if (newCourse._id === oldCourse._id) {
                            let newStudents = newCourse.students || [];
                            let oldStudents = oldCourse.students || [];

                            for (let newStudent of newStudents) {
                                for (let oldStudent of oldStudents) {
                                    if (newStudent._id === oldStudent) {
                                        if (oldStudent.isBePresent) {
                                            newStudent.isBePresent = true;
                                            newStudent.attendanceTime = oldStudent.attendanceTime;
                                        }

                                    }
                                }
                            }

                            newCourse.students = newStudents;
                        }
                    }
                }
                _normalCourses = angular.copy(courses || []);

                // 下面的代码是用来对学生的签到进行合并的

                if (!isCurtCourseExist) {
                    let tmpCourses = this.getCourses();
                   this.updateCurrentCourse(tmpCourses[0]);
                }
            };

            /**
             * @desc 获得正常班级
             * @returns {*}
             */
            this.getNormalCourses = function (){
                return angular.copy(_normalCourses || []);
            };

            /**
             * @desc 获取公开课
             * @returns {*}
             */
            this.getOpenCourses = function () {
                return angular.copy(_openCourses || []);
            };

            this.setOpenClassStudents = function (students) {
                students = angular.copy(students || []);
                _openCourses[0].students = students;
            };

            /**
             * @desc 设置公开课
             * @param openCourses
             */
            this.setOpenCourses = function (openCourses) {
                _openCourses = angular.copy(openCourses || []);
            };


            /**
             * @desc 判断指定的卡号是否已经被绑定为教师卡
             * @param cardId
             * @returns {boolean}
             */
            this.isCardBindAsTeacher = function (cardId) {
                if (cardId == "") {
                    return false;
                }

                let cards = _teacherCards;
                for (let card of cards) {
                    if (card.cardId === cardId) {
                        return true;
                    }
                }
                return false;
            };

            /**
             * @desc 判断指定的课程是否为普通的课程，如果course没有指定的话， 判断当前的课程是否为普通课程
             * @param course {optional}
             * @returns {boolean}
             */
            this.isNormal = function (course) {
                //  如果course没有指定，将course设置为当前课程
                if (course == null) {
                    course = this.getCurrentCourse();
                }

                let courses = this.getNormalCourses();

                for (let tmpCourse of courses) {
                    if (tmpCourse._id === course._id) {
                        return true;
                    }
                }

                return false;
            };

            /**
             * @desc 判断某张卡是否被绑定为学生
             * @param cardId
             * @returns {boolean}
             */
            this.isCardBindAsStudent = function (cardId) {
                if (cardId === "") {
                    return false;
                }

                let courses = _normalCourses;
                for (let course of courses) {
                    let students = course.students || [];
                    for (let stu of students) {
                        if (stu.cardId === cardId) {
                            return true;
                        }
                    }
                }
                return false;
            };

            /**
             * @desc 获取当前课程所有学生的引用
             * @returns {Array}
             */
            this.getCurrentCourseStudentsReference = function () {
                let students = [];

                let course = this.getCurrentCourseReference();
                if (course) {
                    if (course.students == null) {
                        course.students = [];
                    }
                    students = course.students;
                }
                return students;
            };


            this.getCurrentCourseStudents = function () {
                let students = this.getCurrentCourseStudentsReference();
                return angular.copy(students);
            };

            /**
             * @desc 检测当前所有的学生是否还在还在，如果已经不在了的话，将其比较为不在场
             */
            this.checkStudentPresent = function () {
                this.unMarkStudentPresent(PRESENT_INTERVAL);

                $timeout(()=>{
                    this.checkStudentPresent();
                }, 10000);
            };

            /**
             * @desc 对于签到时间后在interval时间内没有再次签到的学生标记为没有到
             * @param interval {int 毫秒数}
             */
            this.unMarkStudentPresent = function (interval) {
                let now = Date.now();

                let courses = this.getCoursesReference();

                for (let course of courses) {
                    if (course.students == null) {
                        course.students = [];
                    }
                    let students = course.students;
                    for (let stu of students) {
                        if (stu.isBePresent && stu.attendanceTime < now - interval) {
                            stu.isBePresent = false;
                        }
                    }
                }
            };

            // 通过学生卡的id来对学生进行签到
            this.markStudentPresentByCardId = function (cardId) {
                let courses = this.getCoursesReference();

                for (let course of courses) {
                    if (course.students == null) {
                        course.students = [];
                    }
                    
                    let students = course.students;
                    for (let stu of students) {
                        if (stu.cardId === cardId) {
                            stu.isBePresent = true;
                            stu.attendanceTime = Date.now();
                        }
                    }
                }
            };

            /**
             * @desc 通过课程id判断当前课程是否存在
             * @param course
             */
            this.isCourseExistsById = function (courseId) {
                let courses = this.getCourses();

                for (let course of courses) {
                    if (course._id === courseId) {
                        return true;
                    }
                }
                return false;
            };

            /**
             * @desc 获取某个班级在某个日期前（包括当天）创建的学生
             * @param courseId
             * @param date
             */
            this.getStudentsByCourseIdAndBeforeDate = function (courseId, date) {
                date = +date;
                date += 24 * 60 * 60 * 1000;
                date = new Date(date);

                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);

                date = +date;

                let courses = _getCourses();
                let tmpStudents = null;
                for (let course of courses) {
                    if (course._id === courseId) {
                        tmpStudents = course.students || [];
                        break;
                    }
                }

                let targetStudents = [];

                for (let stu of tmpStudents) {
                    if (stu.createTime < date) {
                        targetStudents.push(stu);
                    }
                }

                return targetStudents;
            };
        }
    ]);

})();


