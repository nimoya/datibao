/**
 * Created by 11433 on 2016/6/2.
 */
angular.module("DTB").controller('GuideCtrl',[
    '$scope',
    '$timeout',
    '$q',
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
    'WindowService',
    'UserService',
    'TeacherCardService',
    'RemoteControlService',
    'StationService',

    function (
            $scope,
            $timeout,
            $q,
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
            WindowService,
            UserService,
            TeacherCardService,
            RemoteControlService,
            StationService
        ) {

        const LOCAL_TEACHER_ID = "&&**&&^^^^**&&&";

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });


        function init () {
            let promise = null;

            if (APP_CONFIG.version === Constant.LOCAL) {
                // 本地版答题宝入口界面
                promise = initLocalVersion();
            } else {
                // 联网版答题宝入口界面
                promise = initNetworkVersion();
            }

            promise.then(()=>{
                console.log("init success");
            }).catch(err=>{
                console.error(err);
            });
        }

        /**
         * @desc 初始化数据库
         * @returns {$q|*}
         */
        function initDatabase () {
            return Database.creataDatabase()
                .then(SubjectTable.init)
                .then(CourseTable.init)
                .then(StudentTable.init)
                .then(StudentCourseTable.init)
                .then(TeacherTable.init)
                .then(RecordTable.createTable)
                .then(QuestionTable.createTable)
                .then(TeacherCardTable.createTable)
                .then(TeacherTeacherCardTable.createTable)
                .then(TeacherCourseTable.createTable);
        }

        /**
         * @desc 初始化离线版的数据
         * @returns {$q|*}
         */
        function initLocalVersion () {
            return new $q((resolve, reject)=>{
                initDatabase()
                    .then(initLocalTeacherToDatabase)
                    .then(initLocalVersionData)
                    .then(()=>{
                        // 各个service的初始化
                        StationService.init();
                        RemoteControlService.init();
                    })
                    .then(()=>{
                        changeToHomePage();
                        resolve();
                    })
                    .catch(reject);
            });
        }

        /**
         * @desc 初始化联网版的数据
         * @returns {$q|*}
         */
        function initNetworkVersion () {
            return new $q((resolve, reject)=>{
                initDatabase()
                    .then(initNetworkVersionData)
                    .then(()=>{
                        // 各个service的初始化
                        StationService.init();
                        RemoteControlService.init();

                        changeToLoginPage();
                        resolve();
                    })
                    .catch(reject);
            });
        }

        /**
         * @desc 初始化离线版答题宝应用中的数据
         * @returns {$q|*}
         */
        function initLocalVersionData () {
            let promises = [];
            let p = null;

            p = DataService.fetchTeacherById(LOCAL_TEACHER_ID).then(teacher=>{
                if (teacher == null) {
                    console.error("当前老师为空");
                }

                return UserService.init(teacher);
            });
            promises.push(p);

            return $q.all(promises);
        }

        /**
         * @desc 初始化网络版答题宝应用中的数据
         * @returns {$q|*}
         */
        function initNetworkVersionData () {
            let promises = [];

            let p = new $q((resolve, reject)=>{
                DataService.getAllCachedAccounts().then((teachers)=>{
                    UserService.setTeachers(teachers);
                    resolve();
                }).catch(reject);
            });

            promises.push(p);

            return $q.all(promises);
        };

        /**
         * @desc 初始化本地答题宝的老师数据
         * @returns {$q}
         */
        function initLocalTeacherToDatabase () {
            return TeacherTable.hasTeacher({
                        _id: LOCAL_TEACHER_ID,
                    }).then(has => {
                        if (has) {
                            $q.resolve();
                            return;
                        }

                        return TeacherTable.addTeacher({
                            _id: LOCAL_TEACHER_ID,
                            name: "",
                            account: "",
                            password: "",
                            createTime: Date.now()
                        });
                    });
        }

        /**
         * @desc 跳转到home page的页面
         */
        function changeToHomePage () {
            // 延迟2秒，防止页面跳转太快，看不到加载页面
            $timeout(()=>{

                WindowService.replaceWithWindow(APP_WINDOWS.homePage);
            }, 2000);
        }

        /**
         * @desc 跳转到login page的页面
         */
        function changeToLoginPage () {
            // 延迟2秒，防止页面跳转太快，看不到加载页面
            $timeout(()=>{

                WindowService.replaceWithWindow(APP_WINDOWS.login);
            }, 2000);
        }

    }]
);