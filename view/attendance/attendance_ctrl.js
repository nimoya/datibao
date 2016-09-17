/**
 * @fileOverview 签到页面的控制器
 * @author 王磊   16/7/13
 * @version 0.1
 */
dtb.controller('AttendanceCtrl',[
    '$rootScope',
    '$scope',
    '$timeout',
    'UserService',
    'StationService',
    
    function (
        $rootScope,
        $scope,
        $timeout,
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
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            reset();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            reset();
        });

        const STUDENTS_TO_DISPLAY_INCREMENT = 20;

        $scope.numberOfStudentsToDisplay = 0;

        $scope.ALL_MODE = "ALL";
        $scope.PRESENT_MODE = "PRESENT";
        $scope.UNPRESENT_MODE = "UNPRESENT";
        $scope.UNBINDSTUDENS_MODE = "UNBINDSTUDENS";

        $scope.curtMode = $scope.ALL_MODE;

        $scope.students = [];

        $scope.getCurtModeStudents = function () {
            let students = null;

            switch ($scope.curtMode) {
                case $scope.ALL_MODE:
                    students = getAllStudents();
                    break;

                case $scope.UNPRESENT_MODE:
                    students = getUnPresentsStudents();
                    break;

                case $scope.PRESENT_MODE:
                    students = getPresentStudents();
                    break;

                case $scope.UNBINDSTUDENS_MODE:
                    students = getUnBindCardStudents();
                    break;

                default:
                    students = getAllStudents();
                    break;
            }

            return students;
        };

        /**
         * @desc 获取学生的状态描述
         * @param stu
         * @returns {string}
         */
        $scope.getStudentStateDescription = function (stu) {
            let stateDesc = "";
            if (stu.isBePresent) {
                stateDesc = "到场";
            } else if (!!stu.cardId) {
                stateDesc = "未到场";
            } else {
                stateDesc = "未绑卡";
            }
            return stateDesc;
        };

        /**
         * @desc 获取不同学生状态的class名
         * @param stu
         * @returns {string}
         */
         $scope.getStudentStateStyleClassName = function (stu) {
            let style = "";
            if (stu.isBePresent) {
                style = "attendance";
            } else if (!!stu.cardId) {
                style = "unAttendance";
            } else {
                style = "unBindCard";
            }
            return style;
        };

        $scope.changeStudentType = function (type) {
            scrollTableToTop();

            let students = [];

            switch ($scope.curtMode) {
                case $scope.ALL_MODE:
                    students = getAllStudents();
                    break;

                case $scope.UNPRESENT_MODE:
                    students = getUnPresentsStudents();
                    break;

                case $scope.PRESENT_MODE:
                    students = getPresentStudents();
                    break;

                case $scope.UNBINDSTUDENS_MODE:
                    students = getUnBindCardStudents();
                    break;

                default:
                    students = getAllStudents();
                    break;
            }

            initStudentNumberToDisplay(students.length);
        };

        $scope.onTableScroll = function (data) {
            let scrollTop    = data.scrollTop;
            let scrollHeight = data.scrollHeight;
            let offsetHeight = data.offsetHeight;

            let students = $scope.students || [];

            if (scrollHeight - offsetHeight - scrollTop < 100) {
                if ($scope.numberOfStudentsToDisplay + STUDENTS_TO_DISPLAY_INCREMENT > students.length) {
                    $scope.numberOfStudentsToDisplay = students.length;
                } else {
                    $scope.numberOfStudentsToDisplay += STUDENTS_TO_DISPLAY_INCREMENT;
                }
            }
        };

        function reset () {
            scrollTableToTop();
            disableFixedTableHeader();

            $scope.students = [];
            $scope.curtMode = $scope.ALL_MODE;

            $scope.numberOfStudentsToDisplay = 0;

            StationService.changeToNormalMode().catch((err)=>{
                console.error(err);
            });
        }

        function init () {
            reset();
            
            fixedTableHeader();
            StationService.changeToCheckAnswerMode().then(()=>{
                $scope.students = UserService.getCurrentCourseStudentsReference() || [];

                initStudentNumberToDisplay($scope.students.length);

            }).catch((err)=>{
                console.error(err);
            });
        }

        function initStudentNumberToDisplay (studentsCount) {
            $scope.numberOfStudentsToDisplay = STUDENTS_TO_DISPLAY_INCREMENT;

            if (studentsCount < STUDENTS_TO_DISPLAY_INCREMENT) {
                $scope.numberOfStudentsToDisplay = studentsCount;
            }
        }

        /**
         * @desc 获取该班级所有的学生
         * @returns {Array}
         */
        function getAllStudents () {
            return $scope.students;
        }

        /**
         * @desc 获取所有在场的学生
         * @returns {Array}
         */
        function getPresentStudents () {
            let students = [];
            for (let stu of $scope.students) {
                // 学生已经签到，并且签到时间在20分钟内
                if (!!stu.cardId
                        && !!stu.isBePresent
                            && stu.attendanceTime > Date.now() - 1200000) {
                    students.push(stu);
                }
            }
            return students;
        }

        /**
         * @desc 获取所有不在场的学生
         * @returns {Array}
         */
        function getUnPresentsStudents () {
            let students = [];
            for (let stu of $scope.students) {
                // 学生没有签到或者签到时间理现在已经超过20分钟
                if (!!stu.cardId
                        && ( !stu.isBePresent || stu.attendanceTime < Date.now() - 1200000)) {
                    students.push(stu);
                }
            }
            return students;
        }

        /**
         * @desc 获取获取没有绑定卡的学生
         * @returns {Array}
         */
        function getUnBindCardStudents () {
            let students = [];
            for (let stu of $scope.students) {
                if (!stu.cardId) {
                    students.push(stu);
                }
            }
            return students;
        }

        /**
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-attendance .inner-wrapper");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table到头
         */
        function scrollTableToTop () {
            let innerWrapper = document.querySelector(".xy-attendance .inner-wrapper");
            innerWrapper.scrollTop = 0;
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-attendance .inner-wrapper");
            let tableHeader = document.querySelector(".xy-attendance .xy-attendance-student-info-header");

            let offset = innerWrapper.scrollTop;
            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-attendance .inner-wrapper");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
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
    }]
);
