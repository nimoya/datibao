/**
* @ignore  =====================================================================================
* @fileoverview 答题学生列表的控制器
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/20
* @ignore  depend
* @ignore  =====================================================================================
*/
angular.module('DTB').controller('AnswerStudentsCtrl',[
    '$scope',
    '$rootScope',
    '$timeout',
    'WindowService',
    'TeacherCardService', 
    'AnswerStudentService',
    'ClassAnswerService',
    'StudentStageModel',
    'UserService',
    'StationService',

    function (
        $scope,
        $rootScope,
        $timeout,
        WindowService,
        TeacherCardService, 
        AnswerStudentService,
        ClassAnswerService,
        StudentStageModel,
        UserService,
        StationService) {

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

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
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

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onStudentAnswered,(event, data)=>{
            if (!_canAnswer) {
                return;
            }

            // let options = data.opt || [];
            // if (options.join("") === "^" || options.join("") === "$") {
            //     return;
            // }

            updateMemberAnswer(data);
        });

        $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
            if (!WindowService.isShowing()
                    && command !== APP_CARD_COMMANDS.triggerWindow) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        $scope.openStudentStage = function (sIndex) {
            let student = ClassAnswerService.getMemberBySIndex(sIndex);
            let style = "greenBlack";
            let title = "全班作答";


            StudentStageModel.reset();
            
            StudentStageModel.setStudent(student);
            StudentStageModel.setTitle(title);
            StudentStageModel.setStyle(style);

            StudentStageModel.setCloseCallback(function () {
                WindowService.backToWindow();
            });

            WindowService.enterToWindow(APP_WINDOWS.studentStage);
        };

        let _canAnswer = false;

        $scope.title = "";
        $scope.students = [];

        function init() {
            _canAnswer = AnswerStudentService.isCanAnswer() || false;
            $scope.title = AnswerStudentService.getTitle() || "";
            $scope.students = AnswerStudentService.getStudents() || [];
        }

        function updateMemberAnswer (data) {
            let students = $scope.students || [];

            for (let i = 0, len = students.length; i < len; ++i) {
                let stu = students[i];
                if (stu.cardId === data.cardId) {
                    students.splice(i, 1);
                    break;
                }
            }

            $scope.students = students;

            let ret = ClassAnswerService.updateMemberAnswer(data);
            if (!ret.success) {
                alertMsg(ret.msg, 1000);
            }
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
    }
]);
