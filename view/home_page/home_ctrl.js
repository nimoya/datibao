/**
 * Created by 11433 on 2016/6/2.
 */
angular.module("DTB").controller('HomeCtrl',[
    '$scope',
    'SaveRecordsModel',
    '$timeout',
    '$rootScope',
    'WindowService',
    'UserService',
    'StationService',
    'TeacherCardService',
    'WebsocketService',
    function (
            $scope,
            SaveRecordsModel,
            $timeout,
            $rootScope,
            WindowService,
            UserService,
            StationService,
            TeacherCardService,
            WebsocketService) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();
            
            //发送握手信息
            handshake();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();
            
            //发送握手信息
            handshake();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            close();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            close();
        });

        $scope.$on(APP_EVENTS.onTeacherCommanded,(event, data)=>{
            let command = TeacherCardService.getCommandByOpt(data.opt);

            // 该卡没有绑定或当前窗口隐藏情况下并且命令不是triggerWindow的情况下不做处理
            if (!UserService.isCardBindAsTeacher(data.cardId)
                    || (!WindowService.isShowing()
                            && command !== APP_CARD_COMMANDS.triggerWindow )) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
            if (!WindowService.isShowing()
                    && command !== APP_CARD_COMMANDS.triggerWindow) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.getUsername = function () {
            return _user.name;
        };

        /**
         * @desc 获取当前课程的名字
         * @returns {string}
         */
        $scope.getCurtCourseName = function () {
            return _currentCourse == null ? "" : _currentCourse.name;
        };

        $scope.getCourses = function () {
            return _courses;
        };

        $scope.openSetting = function () {
            openSetting();
        };

        $scope.openReport = function () {
            if (!UserService.isNormal()) {
                alertMsg("公开课模式下不能进入", 2000);
                return;
            }
            openReport();
        };

        $scope.openClassAnswer = function () {
            openClassAnswer();
        };

        $scope.openRandomRoll = function () {
            openRandomRoll();
        };

        $scope.openRushAnswer = function () {
            openRushAnswer();
        };
        
        $scope.openAttendance = function () {
            openAttendance();
        };

        $scope.openMultipleQuestionPage = function () {
            openMultipleQuestionPage();
        };


        /**
         * 用户切换了课程
         */
        $scope.onCourseChanged = function (course) {
            updateCurrentCourse(course);
            //发送握手信息
            handshake();
        };

        let _user          = {};
        let _courses       = [];
        let _currentCourse = {};

        function reset () {
            _user          = {};
            _courses       = {};
            _currentCourse = {};
        }

        function init () {
            reset();
            $scope.saveRecordsShow=SaveRecordsModel.getSaveRecordsShow();
            _user          = UserService.getTeacher();
            _courses       = UserService.getCourses();
            _currentCourse = UserService.getCurrentCourse();
        }

        function close () {
            UserService.updateCurrentCourse(_currentCourse);
        }

        function updateCurrentCourse (course) {
            _currentCourse = course;
            UserService.updateCurrentCourse(course);
        }

        /**
         * @desc 判断当前的课程是否有学生
         */
        function isCurtCourseHasStudents(){
            let students = _currentCourse.students || [];
            return students.length > 0;
        }

        /**
         * 打开设置界面
         */
        function openSetting() {
            WindowService.enterToWindow('setting');
        }

        function openReport() {
            WindowService.enterToWindow('report');
        }

        function openClassAnswer(){
            if(!checkStationConnection()){
                //如果没有连接基站
                alertMsg(APP_ALERT.station_unconn);
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()
                    && UserService.isNormal()) {
                alertMsg("当前课程没有学生！", 1000);
                return;
            }

            WindowService.enterToWindow(APP_WINDOWS.classAnswer);
        }

        function openRandomRoll () {
            if(!checkStationConnection()){
                //如果没有连接基站
                alertMsg(APP_ALERT.station_unconn);
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                alertMsg(APP_ALERT.is_not_normal);
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                alertMsg("当前课程没有学生！", 1000);
                return;
            }

            WindowService.enterToWindow(APP_WINDOWS.randomRoll);
        }

        function openRushAnswer(){
            if(!checkStationConnection()){
                //如果没有连接基站
                alertMsg(APP_ALERT.station_unconn);
                return;

            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                alertMsg(APP_ALERT.is_not_normal);
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                alertMsg("当前课程没有学生！", 1000);
                return;
            }

            WindowService.enterToWindow(APP_WINDOWS.rushAnswer);
        }

        function openTeacherCard () {
            WindowService.enterToWindow(APP_WINDOWS.teacherCard);
        }

        /**
         * @desc 打开多题模式的页面
         */
        function openMultipleQuestionPage () {
            // if(!checkStationConnection()){
            //     //如果没有连接基站
            //     alertMsg(APP_ALERT.station_unconn);
            //     return;
            // }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                alertMsg(APP_ALERT.is_not_normal);
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                alertMsg("当前课程没有学生！", 1000);
                return;
            }

            WindowService.enterToWindow(APP_WINDOWS.multipleQuestion);
        }

        /**
         * @desc 打开签到的页面
         */
        function openAttendance () {
            if(!checkStationConnection()){
                //如果没有连接基站
                alertMsg(APP_ALERT.station_unconn);
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                alertMsg(APP_ALERT.is_not_normal);
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                alertMsg("当前课程没有学生！", 1000);
                return;
            }

            WindowService.enterToWindow(APP_WINDOWS.attendance);
        }

        /**
         * 检查基站是否连接
         */
        function checkStationConnection(){
            if(!StationService.checkStation()){
                alertMsg(APP_ALERT.station_unconn);
                return false;
            }
            return true;
        }

        /**
         * 基站连接成功的回调
         */
        function onStationConnection(){
            if(StationService.checkStation()){
                alertMsg(APP_ALERT.station_conn);
                return;
            }
        }

        /**
         * 播出提示信息
         * @param msg
         * @param interval
         */
        function alertMsg(msg, interval) {
            if(!interval){
                interval=1000;
            }

            $timeout(()=>{
                $scope.alerting=true;
                $scope.alertContent=msg;
            });
            $timeout(()=>{
                $scope.alerting=false;
            },interval);
        }

        /**
         * 教师卡的处理
         * @param data
         */
        function handleTeacherCardCommand(command) {
            switch (command){
                case APP_CARD_COMMANDS.triggerWindow:
                    WindowService.triggerWindow();
                    break;

                case APP_CARD_COMMANDS.classAnswer:
                    openClassAnswer();
                    break;
                case APP_CARD_COMMANDS.random:
                    openRandomRoll();
                    break;
                case APP_CARD_COMMANDS.rush:
                    openRushAnswer();
                    break;
                default:
                    break;
            }
        }

        /**
         * 向基站发送握手信息
         */
        function handshake() {
            console.log(_currentCourse.students);
            var ids = [];
            for (var i=0; i < _currentCourse.students.length; i++) {
                var id = _currentCourse.students[i].cardId;
                if (id) {
                    ids.push(id);
                }
            }
            WebsocketService.handshake(ids);
        }
}])