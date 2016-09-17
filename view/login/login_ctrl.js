/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyLogin标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").controller('LoginCtrl',[
    '$scope',
    '$q',
    '$timeout',
    'Database',
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
    'DataService',
    "CacheService",
    'WindowService',
    'UserService',
    'TeacherCardService',
    'RemoteControlService',
    'StationService',
    'NetworkService',

    function (
            $scope,
            $q,
            $timeout,
            Database,
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
            DataService,
            CacheService,
            WindowService,
            UserService,
            TeacherCardService,
            RemoteControlService,
            StationService,
            NetworkService
        ) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏在显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.isLogining = false;

        $scope.users = [];

        $scope.username = "";
        $scope.password = "";

        $scope.rememberPassword = false;

        // 登陆的提示信息
        $scope.promptMsg = "";
        
        // 选中指定下标的默认用户
        $scope.selectUser = function (index) {
            let user = $scope.users[index];

            $scope.username = user.account;
            $scope.rememberPassword = user.rememberPassword || false;
            $scope.password = !!user.rememberPassword ? user.password : "";
            let keyPresser = require("./lib/keypresser");
            keyPresser.keyDown(9);
            keyPresser.keyUp(9);
        };

        $scope.changeClick=function(){
            document.getElementById("userAccount").select();
                $scope.selectAccount=false;
            $scope.clickAble=false;
        };
        
        $scope.changeClickPass=function(){
            $scope.clickAble=false;
        };
        
        $scope.clearPassword=function(){
            $scope.password='';
        };
        
        $scope.changeClickAble=function(){
            $scope.clickAble=true;
        };

        $scope.isShowUserSelector = function () {
            return $scope.users.length > 0;
        };

        $scope.login = function () {
            let username = $scope.username;
            let password = $scope.password;
            let rememberPassword = !!$scope.rememberPassword;

            $scope.isLogining = true;

            if (navigator.onLine) {
                NetworkService.login(username, password).then(data => {
                    if (data.success) {
                        let user = data.teacher;

                        let account = {
                            account: username,
                            password: password,
                            rememberPassword: rememberPassword
                        };

                        DataService.cacheLoginAccount(account).then(()=>{
                            console.log("cache login account success");
                        }).catch(err=>{
                            console.error(err);
                        });

                        mergeDataToBackend(user).then(()=>{
                            UserService.init(user).then(() => {
                                changeToHomePage();
                                $scope.isLogining = false;
                            }).catch(err => {
                                $scope.isLogining = false;
                                console.error(err);
                            });

                        }).catch(err=>{
                            console.error(err);
                            $scope.isLogining = false;
                        });

                    } else {
                        $scope.isLogining = false;
                        $scope.promptMsg = data.error.message;
                    }
                }).catch(err=>{
                    $scope.isLogining = false;
                    console.error(err);
                });
            } else {
                if (!isUserExistByName(username)) {
                    $scope.isLogining = false;
                    $scope.promptMsg = "当前处于断网状态，请联网后登录";
                    return;
                }

                let loginSuccess = false;
                let teacher = null;

                for (let user of $scope.users) {
                    if (user.account === username
                            && user.password === password) {
                        loginSuccess = true;
                        teacher = user;
                    }
                }

                if (loginSuccess) {
                    UserService.init(teacher).then(()=>{
                        changeToHomePage();
                        $scope.isLogining = false;
                    }).catch(err => {
                        $scope.isLogining = false;
                        console.error(err);
                    });
                } else {
                    $scope.isLogining = false;
                    $scope.promptMsg = "用户名或密码错误";
                }
            }
        };

        $scope.closeWin = function () {
            nw.Window.get().close();
        };

        $scope.minimize = function () {
            WindowService.minimizeWindow();
        };

        $scope.disableLoginBtn = function () {
            return $scope.isLogining;
        };

        $scope.getLoginBtnContext = function () {
            return $scope.isLogining ? "登录中..." : "登录";
        };

        /**
         * @desc 删除缓存的用户登陆数据
         * @param user
         */
        $scope.deleteUser = function (user) {
            let users = $scope.users || [];
            

            for (let i = 0, len = users.length; i < len; ++i) {
                let tmpUser = users[i];

                if (tmpUser.account === user.account) {
                    users.splice(i, 1);
                    DataService.deleteCachedAccount(user).then(()=>{
                        console.log("delete cached account success");
                    }).catch(err => {
                        console.error(err);
                    });
                    break;
                }
            }

             if ($scope.username === user.account) {
                 $scope.username = "";
                 $scope.password = "";
                 $scope.rememberPassword = false;
             }
        };

        function init () {
            $scope.username = "";
            $scope.password = "";
            $scope.rememberPassword = false;
            $scope.clickAble=true;
            let users = $scope.users = UserService.getTeacehrs();

            if (!!users && users.length > 0) {
                let user = users[0];

                $scope.username = user.account;
                $scope.rememberPassword = user.rememberPassword;
                $scope.password = !!user.rememberPassword ? user.password : "";
            }

            if (!$scope.username) {
                document.querySelector(".xy-login .userAccount").autofocus = "autofocus";
            } else {
                document.querySelector(".xy-login .password").autofocus = "autofocus";
            }
        }

        function isUserExistByName (name) {
            let users = $scope.users;
            for (let tmpUser of users) {
                if (tmpUser.account === name) {
                    return true;
                }
            }
            return false;
        }

        /**
         * @desc 同步数据到后台去
         * @returns {Promise}
         */
        function mergeDataToBackend (user) {
            return new $q((resolve, reject)=>{
                CacheService.restoreUserData(user).then(data=>{
                    if (data == null) {
                        resolve();
                        return;
                    }

                    let promises = [];
                    let p = null;

                    // 同步教师卡
                    let teacherCards = data.teacherCards || [];
                    if (teacherCards.length > 0) {
                        p = mergeTeacherCardsToBackend(user, teacherCards);
                    } else {
                        p = $q.resolve();
                    }
                    promises.push(p);

                    // 同步学生
                    let courses = data.courses || [];
                    if (courses.length > 0) {
                        p = mergeStudentsToBackend(courses);
                    } else {
                        p = $q.resolve();
                    }

                    $q.all(promises).then(resolve).catch(reject);

                }).catch(reject);
            });
        }

        /**
         * @desc 同步课程的学生到后台
         * @param courses
         * @returns {*}
         */
        function mergeStudentsToBackend (courses) {
            let studentsMap = {};
            for (let course of courses) {
                let students = course.students || [];
                if (students.length > 0) {
                    studentsMap[course._id] = students;
                }
            }

            let promise = null;
            let count = Object.keys(studentsMap);
            if (count > 0) {
                promise = DataService.updateStudentList(studentsMap);
            } else {
                promise = $q.resolve();
            }
            return promise;
        };

        /**
         * @desc 同步教师卡到后台去
         * @returns {$q|*}
         */
        function mergeTeacherCardsToBackend (teacher, teacherCards) {
            return DataService.mergeTeacherCardsToBackend(teacher, teacherCards);
        }

        /**
         * @desc 跳转到home page的页面
         */
        function changeToHomePage () {
            // 延迟2秒，防止页面跳转太快，看不到加载页面
            WindowService.replaceWithWindow(APP_WINDOWS.homePage)
        }
        

    }]
);