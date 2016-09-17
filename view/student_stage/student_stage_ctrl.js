/**
 * Created by deng on 16/6/12.
 */
dtb.controller('StudentStageCtrl',[
    '$scope',
    '$interval',
    '$timeout',
    'Timer',
    'WindowService',
    'UserService',
    'StationService',
    'TeacherCardService', 
    'StudentStageModel',
    function (
                $scope,
                $interval,
                $timeout,
                Timer,
                WindowService,
                UserService,
                StationService,
                TeacherCardService,
                StudentStageModel) {

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

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            reset();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            reset();
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

        $scope.$on(APP_EVENTS.onTeacherCommanded, (event, data) => {
            // 对九键教师卡的按钮进行响应
            if( data.type == 1 ){
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

        // $intervalId函数的返回值，用来解除$intervalId
        let intervalId = null;

        function init(){
            $scope.time    = 0;
            $scope.timeStr = "00:00";
            $scope.style   = StudentStageModel.getStyle();
            $scope.title   = StudentStageModel.getTitle();
            $scope.student = StudentStageModel.getStudent();

            $scope.close   = function () {
                reset();
                StudentStageModel.getCloseCallback()();
            };

            // 下面的代码是用来计时的
            intervalId = $interval(function() {
                $scope.timeStr = Timer.translateTimerString(++$scope.time); 
            }, 1000);
        }

        function reset () {
            if (intervalId != null) {
                $interval.cancel(intervalId);
                intervalId = null;
            }

            $scope.time    = 0;
            $scope.timeStr = "00:00";
            $scope.style   = "";
            $scope.title   = "";
            $scope.student = null;
        }

        function handleTeacherCardCommand (command) {
            switch (command) {
                case APP_CARD_COMMANDS.esc:
                    $scope.close();
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

                case APP_CARD_COMMANDS.rush:
                    openRushAnswerPage();
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
                return false;
            }
            return true;
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

        function openRushAnswerPage () {
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
    }]
);