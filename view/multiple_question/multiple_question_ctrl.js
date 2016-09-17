/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyLogin标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").controller('MultipleQuestionCtrl',[
    '$scope',
    '$rootScope',
    '$q',
    '$timeout',
    'Timer',
    'UserService',
    'StationService',
    'WindowService',
    'MultipleQuestionModel',
    'WebsocketService',
    function (
        $scope,
        $rootScope,
        $q,
        $timeout,
        Timer,
        UserService,
        StationService,
        WindowService,
        MultipleQuestionModel,
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

        $scope.$on(APP_EVENTS.onStudentAnswered, (event, data)=>{
            // 超出angular的上下文，所以这里我们用$timeout
            $timeout(()=>{
                updateStudentAnswer(data);
            });
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onQuestionAnswerSet, (event, data)=>{
            // 超出angular的上下文，所以这里我们用$timeout
            $timeout(()=>{
                updateCorrectAnswer(data);
            });
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            close();
        });

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            close();
        });

        $scope.getTimeString = function () {
            return _timeString;
        };

        $scope.getStudents = function () {
            return _students;
        };

        $scope.stopAnswering = function () {
            openMultipleQuestionResultPage();
        };

        $scope.minimize = function () {
            WindowService.minimizeWindow();
        };

        $scope.closeWin = function () {
            WindowService.backToWindow();
        };

        /**
         * @desc 获取学生回答题目的数量
         * @param student
         */
        $scope.getStuAnsweredQuestionCount = function (student) {
            return getStudentAnsweredQuestionCount(student);
        };

        /**
         * @desc 获取学生答题完成度
         * @param student
         * @returns {number}
         */
        $scope.getStuCompleteRate = function (student) {
            let answeredCount = getStudentAnsweredQuestionCount(student);
            let totalCount    = Math.floor($scope.numberOfQuestions || 0);

            let rate = 0;
            if (totalCount > 0) {
                rate = answeredCount / totalCount;
            }

            return rate;
        };

        $scope.getAnswers = function () {
            return _answers;
        };

        $scope.onQuestionNumberInputBlur = function (event) {
            let number = $scope.numberOfQuestions || 0;
            if (isNaN(number) || number <= 0
                    || number != Math.floor(number)) {  // 判断number是否为整数
                $scope.numberOfQuestions = undefined;
                alertMsg("题目数只能为大于零的整数", 2000);
                return;
            }

            number = parseInt(number);

            if (number > 99) {
                $scope.numberOfQuestions = undefined;
                alertMsg("题目数不能超过99", 2000);
                return;
            }
        };

        $scope.onTableScroll = function (data) {
            let scrollTop    = data.scrollTop;
            let scrollHeight = data.scrollHeight;
            let offsetHeight = data.offsetHeight;

            if (scrollHeight - offsetHeight - scrollTop < 100) {
                if ($scope.numberOfStudentsToDisplay + STUDENTS_TO_DISPLAY_INCREMENT > _students.length) {
                    $scope.numberOfStudentsToDisplay = _students.length;
                } else {
                    $scope.numberOfStudentsToDisplay += STUDENTS_TO_DISPLAY_INCREMENT;
                }
            }
        };

        const STUDENTS_TO_DISPLAY_INCREMENT = 20;

        let _students  = [];
        let _answers = {};
        let _timeoutId = null;

        let _timeString = "00:00";

        $scope.numberOfQuestions;

        $scope.numberOfStudentsToDisplay = 0;

        function reset () {
            if (_timeoutId != null) {
                $timeout.cancel(_timeoutId);
            }
            _timeoutId = null;

            _timeString = "00:00";

            _students = [];
            _answers = {};

            $scope.numberOfQuestions = undefined;

            $scope.numberOfStudentsToDisplay = 0;

            scrollTableToTop();
        }

        function init () {
            reset();

            // 先清除，然后在设置固定table header
            disableFixedTableHeader();
            fixedTableHeader();

            initStudents();
            initTime();

            WebsocketService.startQuestion(true, false);
        }

        function initStudents () {
            let students = UserService.getCurrentCourseStudents();
            for (let stu of students) {
                stu.answers = {};
            }
            _students = students;

            initStudentNumberToDisplay(_students.length);
        }

        function initTime () {
            if (_timeoutId != null) {
                $timeout.cancel(_timeoutId);
            }

            startTime();

            let count = 0;
            function startTime () {
                _timeoutId = $timeout(()=>{
                    ++count;
                    _timeString = Timer.translateTimerString(count);
                    startTime();
                }, 1000);
            }
        }

        function initStudentNumberToDisplay (studentsCount) {
            $scope.numberOfStudentsToDisplay = STUDENTS_TO_DISPLAY_INCREMENT;

            if (studentsCount < STUDENTS_TO_DISPLAY_INCREMENT) {
                $scope.numberOfStudentsToDisplay = studentsCount;
            }
        }

        function close () {
            reset();
            WebsocketService.endQuestion(true, false);
        }

        function getStudentAnsweredQuestionCount (student) {
            let answers = student.answers;

            let numberOfQuestions = Math.ceil($scope.numberOfQuestions || 0);

            let qNumberStrs = Object.keys(answers);
            let qNumbers    = [];
            for (let qNumberStr of qNumberStrs) {
                let qNumber = parseInt(qNumberStr);
                if (qNumber <= numberOfQuestions) {
                    qNumbers.push(qNumber);
                }
            }
            return qNumbers.length;
        }

        function updateStudentAnswer (data) {
            let cardId  = data.cardId;
            let options = data.opt;
            let qNumber = data.number + 1;

            let students = _students;
            for (let stu of students) {
                if (stu.cardId === cardId) {
                    let answers = stu.answers || {};
                    answers[qNumber] = options;
                    stu.answers = answers;
                    break;
                }
            }
        }

        function updateCorrectAnswer (data) {
            let options = data.opt;
            let qNumber = data.number;

            let answers = _answers || {};
            answers[qNumber] = options;

            _answers = answers;
        }

        function openMultipleQuestionResultPage () {
            MultipleQuestionModel.reset();

            MultipleQuestionModel.setQuestionCount($scope.numberOfQuestions || 0);
            MultipleQuestionModel.setAnswers(_answers);
            MultipleQuestionModel.setStudents(_students);

            WindowService.replaceWithWindow(APP_WINDOWS.multipleQuestionResult);
        }

        /**
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question .xy-multiple-question-table");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question .xy-multiple-question-table");
            let tableHeader = document.querySelector(".xy-multiple-question-info-header");

            let offset = innerWrapper.scrollTop;

            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question .xy-multiple-question-table");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table到头
         */
        function scrollTableToTop () {
            let innerWrapper = document.querySelector(".xy-multiple-question .xy-multiple-question-table");
            innerWrapper.scrollTop = 0;
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
    }]
);