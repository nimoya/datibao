/**
* @ignore  =====================================================================================
* @fileoverview 抢答结果页面的controller
* @author 王磊
* @version 0.1.0
* @ignore  created in 2016/6/29
* @ignore  depend 
* @ignore  =====================================================================================
*/

angular.module("DTB").controller("RushAnswerResultCtrl", [
	"$rootScope",
	"$scope",
    "$timeout",
	"WindowService",
    'UserService',
    'StationService',
	"TeacherCardService",
	"AnswerStudentService",
    "ClassAnswerService",
    "StudentStageModel",

	function (
        $rootScope, 
        $scope,
        $timeout,
        WindowService,
        UserService,
        StationService,
        TeacherCardService,
        AnswerStudentService, 
        ClassAnswerService, 
        StudentStageModel ) {

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

        $scope.openStudentStage = function (index) {
            let student = AnswerStudentService.getStudentByIndex(index);
            let style = "green";
            let title = "抢答";


            StudentStageModel.reset();

            StudentStageModel.setStudent(student);
            StudentStageModel.setTitle(title);
            StudentStageModel.setStyle(style);
            StudentStageModel.setCloseCallback(function () {
                WindowService.backToWindow();
            });

            WindowService.enterToWindow(APP_WINDOWS.studentStage);
        };

        function init () {
        	$scope.title    = AnswerStudentService.getTitle();
        	$scope.students = AnswerStudentService.getStudents();
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
