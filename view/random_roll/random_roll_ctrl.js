/**
* @ignore  =====================================================================================
* @fileoverview 跑马灯界面
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/14
* @ignore  depend
* @ignore  =====================================================================================
*/

dtb.controller('RandomRollCtrl',[
    '$scope',
    '$timeout',
    '$interval',
    'WindowService',
    'StationService',
    'RemoteControlService',
    'UserService',
    'RandomSelectService',
    'TeacherCardService',
    'StudentStageModel',

    function(
            $scope,
            $timeout,
            $interval,
            WindowService,
            StationService,
            RemoteControlService,
            UserService,
            RandomSelectService,
            TeacherCardService,
            StudentStageModel){

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

        $scope.$on(APP_EVENTS.onWindowClosed, ()=>{
            reset();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved, ()=>{
            reset();
        });

        let timerTimeout = null;
        let randomRollInterval = null;

        function reset () {
            $scope.members = [];
            stopRoll();
            stopRandomRoll();

            StationService.setResponseToNineKeyTeacherCard(true);
            RemoteControlService.setResponseToRCD(true);
        }

        function  init(){
            reset();

            // 由于在页面跳转的时候一并处理从基站发送九键教师卡的信息的时候
            // 页面的位置可能会发生问题（页面跑到视口外，无法显示），所以这里我们
            // 屏蔽九键教师信息的接收
            StationService.setResponseToNineKeyTeacherCard(false);
            RemoteControlService.setResponseToRCD(false);

            let members = $scope.members = UserService.getCurrentCourseStudents();
            if (members.length <= 0) {
                WindowService.backToHome();
                return;
            }

            for (let i = 0, len = members.length; i < len; ++i) {
                members[i].sIndex = i + 1;
            }

            RandomSelectService.startAnswer();
            RandomSelectService.setMembers(members);

            startRoll();
        }

        function startRoll() {
            startRandomRoll();

            timerTimeout = $timeout(()=>{
                stopRandomRoll();
                stopRoll();

                timerTimeout = null;

                // 延迟一秒钟来，以便能够清除的看清选中的是哪位学生
                $timeout(()=>{
                    enterStudentStage();
                }, 1000);
            },2500)
        }

        function stopRoll() {
            if (timerTimeout) {
                $timeout.cancel(timerTimeout);
            }

            timerTimeout = null;
        }


        function startRandomRoll(){
            randomRollInterval = $interval(function(){
               $scope.randomMem = $scope.members[(Math.random()*$scope.members.length)>>0];
            },50);
        }

        function stopRandomRoll () {
            if (randomRollInterval) {
                $interval.cancel(randomRollInterval);
            }

            randomRollInterval = null;
        }
        
        /**
         * 进入学生回答的窗口
         */
        function enterStudentStage(){
            let optionMap=RandomSelectService.getOptionMap();
            if (!$scope.randomMem){
                console.warn(APP_ALERT.get_student_err);
                WindowService.backToHome();
                return;
            }

            let student = $scope.randomMem;
            let style   = "purple";
            let title   = "随机选答";
            let closeCallback = function () {
                 WindowService.backToHome();
            };

            StudentStageModel.setStudent(student);
            StudentStageModel.setStyle(style);
            StudentStageModel.setTitle(title);
            StudentStageModel.setCloseCallback(closeCallback);
            
            WindowService.replaceWithWindow(APP_WINDOWS.studentStage);
        }
    }]
);