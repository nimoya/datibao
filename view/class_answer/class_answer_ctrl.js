/**
 * @fileOverview 全班答题的控制器
 * @author 邓俊生   16/6/3
 * @version 0.1
 */
angular.module("DTB").controller('ClassAnswerCtrl',[
    '$scope',
    '$rootScope',
    '$timeout',
    'Timer',
    'WindowService',
    'UserService',
    'StationService',
    'StudentCardService',
    'TeacherCardService',
    'AnswerStudentService',
    'ScreenShotService',
    'ClassAnswerService',
    'WebsocketService',
    function (
                $scope,
                $rootScope,
                $timeout,
                Timer,
                WindowService,
                UserService,
                StationService,
                StudentCardService,
                TeacherCardService,
                AnswerStudentService,
                ScreenShotService,
                ClassAnswerService,
                WebsocketService
        ) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{

            // 这里之所以先将窗口隐藏在显示的原因有两个：
            // 1： 页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            // 2:  隐藏我们的界面方便截屏
            if (UserService.isNormal()) {
                nw.Window.get().hide();

                ScreenShotService.quickScreenShot();
                nw.Window.get().show();
                init();
                ScreenShotService.getScreenShot().then((filePath)=> {
                    ClassAnswerService.setFile(filePath);
                }).catch((err)=> {
                    console.error(err);
                });
            }
            else{
                nw.Window.get().hide();
                $timeout(function(){
                    nw.Window.get().show();
                    init();
                });
            }
        });


        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            reset();
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onQuestionAnswerSet, (event, data)=>{
            if (_answering) {
                updateQuestionAnswer(data);
            }
        });

        $scope.$on(APP_EVENTS.onStudentAnswered,(event, data)=>{
            if(_answering){
                updateMemberAnswer(data);
            }
        });
        $scope.$on(APP_EVENTS.onTeacherCommanded,(event,data)=>{
            console.log('教师卡响应');
            // 九键教师卡对应按键响应
            if (data.type === 1) {
                let command = TeacherCardService.getCommandByOpt(data.opt);

                // 该卡没有绑定或当前窗口隐藏情况下并且命令不是triggerWindow的情况下不做处理
                if (!UserService.isCardBindAsTeacher(data.cardId)
                        || (!WindowService.isShowing()
                                && command !== APP_CARD_COMMANDS.triggerWindow )) {
                    return;
                }


                handleTeacherCardCommand(command);
            }
        });

        $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
            if (!WindowService.isShowing()
                    && command !== APP_CARD_COMMANDS.triggerWindow) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        $scope.closeWin = function () {
            closeWin();
        };

        $scope.openDetail = function () {
            openDetail();
        };

        $scope.openUnAnswerStudentPage = function () {
            openUnAnswerStudentPage();
        };

        $scope.isNormalCourse = function () {
            return isNormalCourse();
        };

        $scope.getMembers = function () {
            return ClassAnswerService.getMembers();
        };

        $scope.getAnsweredRate = function () {
            let rate = 0;
            let members = ClassAnswerService.getMembers();
            if (members.length > 0) {
                let aMembers = ClassAnswerService.getAnsweredMembers();
                rate = aMembers.length / members.length;
            }
            return rate;
        }

        $scope.getAnsweredMembers = function () {
            return ClassAnswerService.getAnsweredMembers();
        };

        $scope.getUnAnsweredMembers = function () {
            return ClassAnswerService.getUnAnsweredMembers();
        };

        $scope.getTimeString = function () {
            return _timerString;
        };

        $scope.isShowAlert = function () {
            return _alerting;
        };

        $scope.getAlertContent = function () {
            return _alertContent;
        };


        //计时器
        let _mainTimer = null;

        let _answering = false;

        let _alerting = false;
        let _alertContent = "";
        let _timerString = "00:00";

        let _answer = null;

        function reset() {
            if (_mainTimer) {
                $timeout.cancel(_mainTimer);
            }
            _mainTimer = null;

            _answering = false;

            _alerting = false;
            _alertContent = "";
            _timerString = "00:00";

            _answer = null;
        }

        function stopAnswer() {
            _answering = false;
        }

        function resetTimer(){
            if (_mainTimer) {
                $timeout.cancel(_mainTimer);
            }
            _mainTimer = null;
        }

        /**
         * 初始化页面
         */
        function init(){
            reset();

            _answering = true;
            startTimer();

            ClassAnswerService.startAnswer();
            ClassAnswerService.setValidOptions(StudentCardService.getSelectOptions());

            let students = UserService.getCurrentCourseStudents();
            ClassAnswerService.setMembers(students);

            WebsocketService.startQuestion(false, false);
        }

        /**
         * 开始计时
         */
        function startTimer() {
            let timer=0;
            // 因为在windowXP情况下，有的时候$interval不起作用
            // 所以这里采用的是setInterval
            updateTimerString();

            function updateTimerString () {
                _timerString=Timer.translateTimerString(timer);
                timer++;

                _mainTimer = $timeout(updateTimerString, 1000);
            }
        }

        function updateMemberAnswer (data) {
            //如果在公开课模式下,新答题的卡将会被记录为公开课的学生
            if (!UserService.isNormal()) {
                let member = {
                    name:'公开课学生',
                    cardId:data.cardId
                };

                if (!ClassAnswerService.isMemberExist(member)) {
                    ClassAnswerService.addMember(member);
                }
            }

            let ret = ClassAnswerService.updateMemberAnswer(data);
            if (!ret.success) {
                alertMsg(ret.msg, 1000);
            }
        }

        function updateQuestionAnswer (data) {
            ClassAnswerService.setAnswer(data.opt);
        }

        function closeWin(){
            WindowService.backToHome();

            reset();

            WebsocketService.endQuestion(false, false);
        }

        function mergeOpenClassStudentToUserService () {
            if (UserService.isNormal()) {
                return;
            }
            // 在公开课模式下，需要将学生同步回UserService
            let students = [];

            let members = ClassAnswerService.getMembers();
            for (let member of members) {
                students.push({
                    name: member.name,
                    cardId: member.cardId
                });
            }
            UserService.setOpenClassStudents(students);
        }

        function handleTeacherCardCommand (command) {
            switch (command) {
                case APP_CARD_COMMANDS.esc:
                    closeWin();
                    break;

                case APP_CARD_COMMANDS.triggerWindow:
                    WindowService.triggerWindow();
                    break;

                case APP_CARD_COMMANDS.random:
                    openRandomRollPage();
                    break;

                case APP_CARD_COMMANDS.classAnswer:
                    openAnswerDetailPage();
                    break;

                case APP_CARD_COMMANDS.rush:
                    openRushAnswerPage();
                    break;

                default:
                    break;
            }
        }

        /**
         * @desc 判断当前的课程是否有学生
         */
        function isCurtCourseHasStudents(){
            let students = UserService.getCurrentCourseStudents();
            return students.length > 0;
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
                StationService.initDeviceMode();
            }
        }


        function openRushAnswerPage () {
            let students = ClassAnswerService.getAnsweredMembers();
            // 有学生作答了，那么就不进行处理
            if (students.length > 0) {
                return;
            }

            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.rushAnswer, false);
        }

        function openRandomRollPage () {
            let students = ClassAnswerService.getAnsweredMembers();
            // 有学生作答了，那么就不进行处理
            if (students.length > 0) {
                return;
            }

            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.randomRoll, false);
        }

        function openAnswerDetailPage () {
            WindowService.replaceWithWindow(APP_WINDOWS.answerDetail);
        }

        function openDetail(){
            if (ClassAnswerService.getMembers().length <= 0) {
                alertMsg("课程没有学生", 1000);
                return;
            }

            let trueOrFalseRate = 0;
            let trueMembers     = ClassAnswerService.getMembersByOptions(["$"]) || [];
            let falseMembers    = ClassAnswerService.getMembersByOptions(["^"]) || [];
            let answeredMembers = ClassAnswerService.getAnsweredMembers() || [];
            if (answeredMembers.length > 0) {
                trueOrFalseRate = (trueMembers.length + falseMembers.length) / answeredMembers.length;
            }

            if (trueOrFalseRate > 0.5) {
                ClassAnswerService.setValidOptions(StudentCardService.getTrueFalseOptions());
                WindowService.replaceWithWindow(APP_WINDOWS.trueFalseQuestionAnswerDetail);
                WebsocketService.endQuestion(false, true);

            } else {
                ClassAnswerService.setValidOptions(StudentCardService.getSelectOptions());
                WindowService.replaceWithWindow(APP_WINDOWS.answerDetail);
                WebsocketService.endQuestion(false, false);
            }

            reset();
        }

        /**
         * @desc 判断当前课程是否为正常的课程（非公开课）
         * @returns {boolean}
         */
        function isNormalCourse () {
            return UserService.isNormal();
        }

        /**
         *打开未作答学生的信息
         */
        function openUnAnswerStudentPage () {
            if (ClassAnswerService.getMembers().length <= 0) {
                alertMsg("课程没有学生", 1000);
                return;
            }

            //未作答人数为0
            if (ClassAnswerService.getUnAnsweredMembers().length <= 0){
                return;
            }

            let title = "未作答的学生";
            let students = ClassAnswerService.getUnAnsweredMembers();

            AnswerStudentService.reset();
            AnswerStudentService.setCanAnswer(true);
            AnswerStudentService.setTitle(title);
            AnswerStudentService.setStudents(students);
            
            WindowService.enterToWindow(APP_WINDOWS.answerStudent);
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
                _alerting=true;
                _alertContent=msg;
            });
            $timeout(()=>{
                _alerting=false;
            },interval);
        }
}]);
