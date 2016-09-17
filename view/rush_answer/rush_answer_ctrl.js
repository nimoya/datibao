/**
* @ignore  =====================================================================================
* @fileoverview 抢答
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/14
* @ignore  depend 
* @ignore  =====================================================================================
*/

dtb.controller('RushAnswerCtrl',[
    '$scope',
    '$rootScope',
    '$timeout',
    '$interval',
    'WindowService',
    'UserService',
    'StationService',
    'RemoteControlService',
    'Timer',
    'TeacherCardService', 
    'AnswerStudentService',
    'WebsocketService',
    function (
        $scope,
        $rootScope,
        $timeout,
        $interval,
        WindowService,
        UserService,
        StationService,
        RemoteControlService,
        Timer,
        TeacherCardService,
        AnswerStudentService,
        WebsocketService) {
        
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

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏在显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            reset();
            WebsocketService.endQuestion(false, false);
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            reset();
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onTeacherCommanded, (event, data) => {
            // 对九键教师卡的按键进行响应
            if (data.type == 1 && answering <= 0) {
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

            // 已经有学生作答了的情况不进行处理
            if (answering > 0) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        $scope.$on(APP_EVENTS.onStudentAnswered,(event, data)=>{
            // 在页面隐藏的情况下，不处理学生答案请求
            if (!WindowService.isShowing()) {
                return;
            }

            if(answering <= 1){
                updateMemberAnswer(data);
            }
        });

        $scope.getTimeString = function () {
            return _timerString;
        };

        $scope.getAnsweredMembers = function () {
            return _answeredMembers;
        };

        $scope.closeWin = function () {
            closeWin();
        };

        // 当用户用鼠标点住title bar不放的时候，如果页面自动跳转的话
        // 会导致页面大小发生错乱，为了解决这个问题，我们在用户用鼠标点住
        // title bar的话，我们将标记不能跳转页面
        document.addEventListener("mousedown", function () {
            _canChangeToOtherPage = false;
        }, false);

        document.addEventListener("mouseup", function () {
            _canChangeToOtherPage = true;
        }, false);

        let _canChangeToOtherPage = true; // 标记页面是否能够跳转

        // 计时器
        let mainTimer = null;

        // 抢答状态的标志位,
        // 0:未开始 1:第一个已经作答 2:作答结束
        let answering = 0;

        let _members         = [];
        let _answeredMembers = [];

        let _timerString = "00:00";

        let _stopAnswerTimeout = null;

        let isStartStopAnswer = false;

        function reset () {
            _canChangeToOtherPage = true;
            
            answering = 0;

            _members         = [];
            _answeredMembers = [];

            _timerString = "00:00";

            isStartStopAnswer = false;

            if (mainTimer != null) {
                $interval.cancel(mainTimer);
            }
            mainTimer = null;

            if (_stopAnswerTimeout != null) {
                $timeout.cancel(_stopAnswerTimeout);
            }
            _stopAnswerTimeout = null;
            
            StationService.setResponseToNineKeyTeacherCard(true);
            RemoteControlService.setResponseToRCD(true);
        }

        function init() {
            reset();

            _members = UserService.getCurrentCourseStudents();
            for (let i = 0, len = _members.length; i < len; ++i) {
                _members[i].sIndex = i + 1;
            }

            startTimer();

            WebsocketService.startQuestion(false, false);
        }

        /**
         * 开始计时
         */
        function startTimer() {
            let timer=0;
            mainTimer=$interval(function(){

                _timerString = Timer.translateTimerString(timer);
                timer++;

            },1000);
        }
        
        function stopAnswer() {
            answering=2;
            
            // 由于在页面跳转的时候一并处理从基站发送九键教师卡的信息的时候
            // 页面的位置可能会发生问题（页面跑到视口外，无法显示），所以这里我们
            // 屏蔽九键教师信息的接收
            StationService.setResponseToNineKeyTeacherCard(false);
            RemoteControlService.setResponseToRCD(false);


            $timeout(()=>{
                let students = _answeredMembers;
                let title = students[0].sIndex + "号 " + students[0].name + " 成功";

                AnswerStudentService.reset();
                AnswerStudentService.setTitle(title);
                AnswerStudentService.setStudents(students);

                WindowService.replaceWithWindow(APP_WINDOWS.rushAnswerResult);
            }, 1000);
        }

        function tryToStopAnswer () {
            _stopAnswerTimeout = $timeout(()=>{
                _stopAnswerTimeout = null;

                if (_canChangeToOtherPage) {
                    stopAnswer();
                } else {
                    tryToStopAnswer();
                }
            },APP_CONFIG.rush_delay);
        }


        /**
         * 接收到答题数据
         * @param data
         */
        function updateMemberAnswer (data) {
            let cardId = data.cardId;
            let opt = data.opt;

            let members         = _members;
            let answeredMembers = _answeredMembers;

            for (let member of members){
                if (member.cardId==cardId) {
                    answering = 1;
                    if (isMemberHasAnswer(member)) {
                        updateMemberInAnsweredMembers(member);
                    } else {
                        addMemberToAnsweredMembers(member);
                    }

                    if (!isStartStopAnswer) {
                        tryToStopAnswer();
                        isStartStopAnswer = true;
                    }
                    return;
                }
            }
        }

        function isMemberHasAnswer (member) {
            for (let tmpMember of _answeredMembers) {
                if (tmpMember._id === member._id) {
                    return true;
                }
            }
            return false;
        }

        function updateMemberInAnsweredMembers (member) {
            for (let i = 0, len = _answeredMembers.length; i < len; ++i) {
                let tmpMember = _answeredMembers[i];
                if (tmpMember._id === member._id) {
                    _answeredMembers[i] = member;
                    break;
                }
            }
        }

        function addMemberToAnsweredMembers (member) {
            _answeredMembers.push(member);
        }


        function closeWin(){
            reset();
            WindowService.backToHome();
        }

        function handleTeacherCardCommand (command) {
            switch (command) {
                case APP_CARD_COMMANDS.esc:
                    WindowService.backToWindow();
                    break;

                case APP_CARD_COMMANDS.triggerWindow:
                    WindowService.triggerWindow();
                    break;

                case APP_CARD_COMMANDS.random:
                    openRandomRollPage();
                    break;

                case APP_CARD_COMMANDS.classAnswer:
                    openClassAnswerPage();
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

        function openRandomRollPage () {
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

        function openClassAnswerPage () {
            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()
                    && UserService.isNormal()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.classAnswer, false);
        }
    
    }]
);