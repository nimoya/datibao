/**
 * @fileOverview 班级管理的控制器
 * @author 王磊   16/6/24
 * @version 0.1
 */

angular.module("DTB").controller("ManageClassCtrl", [
    "$scope",
    "$q",
    'ValidationService',
    "$timeout",
    "$uibModal",
    "WindowService",
    "TeacherCardService",
    "UserService",
    'StationService',
    'DataService',
    'ConfirmDialogModel',

    function(
        $scope,
        $q,
        ValidationService,
        $timeout,
        $uibModal,
        WindowService,
        TeacherCardService,
        UserService,
        StationService,
        DataService,
        ConfirmDialogModel){

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
            WindowService._sameWindowPosition('teacherCard','manageClass');
            WindowService._sameWindowPosition('setting','manageClass');
            close();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved,()=>{
            WindowService._sameWindowPosition('teacherCard','manageClass');
            WindowService._sameWindowPosition('setting','manageClass');
            close();
        });

        $scope.$on(APP_EVENTS.onTeacherCommanded, (event, data) => {
            // 对九键教师卡的按键进行响应的处理
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

        let _normalCourses = []; // 当前页面显示的所有课程
        let _normalCoursesToUpdate = []; // 需要更新的课程
        let _normalCoursesToDelete = []; // 需要删除的课程

        let _showSelectAllBtn = true;

        let _oldInputValue = "";

        function reset () {
            _normalCourses = [];
            _normalCoursesToUpdate = [];
            _normalCoursesToDelete = [];

            _showSelectAllBtn = true;

            _oldInputValue = "";
        }

        function init () {
            //WindowService._setWindowList('manageClass','setting');
            //WindowService._setWindowList('manageClass','teacherCard');
            reset();

            _normalCourses = UserService.getNormalCourses();
            for (let course of _normalCourses) {
                course.selected = false;
            }

            disableFixedTableHeader();
            fixedTableHeader();
        }

        function close () {
            UserService.setNormalCourses(_normalCourses);

            persistData().then(()=>{
                console.log("persist manage class success");
            }).catch(err=>{
                console.error(err);
            });

            reset();
        }

        function deleteCourse (course) {
            for (let i = 0, len = _normalCourses.length; i < len; ++i) {
                let tmpCourse = _normalCourses[i];
                if (tmpCourse._id === course._id) {
                    _normalCourses.splice(i, 1);
                    break;
                }
            }

            if (isCourseToUpdate(course)) {
                deleteCourseFromUpdate(course);
            }

            addCourseToDelete(course)
        }

        function updateCourse (course) {
            let courses = _normalCourses;
            for (let i = 0, len = courses.length; i < len; ++i) {
                let tmpCourse = courses[i];
                if (tmpCourse._id === course._id) {
                    courses[i] = course;
                    break;
                }
            }

            if (!isCourseToUpdate(course)) {
                addCourseToUpdate(course);
            } else {
                updateCourseFromUpdate(course);
            }
        }

        function isCourseToDelete (course) {
            let courses = _normalCoursesToDelete;
            for (let tmpCourse of courses) {
                if (tmpCourse._id === course._id) {
                    return true;
                }
            }
            return false;
        }

        function addCourseToDelete (course) {
            _normalCoursesToDelete.push(course);
        }
        
        function deleteCourseFromDelete (course) {
            let courses = _normalCoursesToDelete;
            for (let i = 0, len = courses.length; i < len; ++i) {
                let tmpCourse = courses[i];

                if (tmpCourse._id === course._id) {
                    courses.splice(i, 1);
                    break;
                }
            }
        }

        function isCourseToUpdate (course) {
            let courses = _normalCoursesToUpdate;
            for (let tmpCourse of courses) {
                if (tmpCourse._id === course._id) {
                    return true;
                }
            }
            return false;
        }

        function addCourseToUpdate (course) {
            _normalCoursesToUpdate.push(course);
        }

        function updateCourseFromUpdate (course) {
            let courses = _normalCoursesToUpdate;
            for (let i = 0, len = courses.length; i < len; ++i) {
                let tmpCourse = courses[i];

                if (tmpCourse._id === course._id) {
                    courses[i] = course;
                    break;
                }
            }
        }

        function deleteCourseFromUpdate (course) {
            let courses = _normalCoursesToUpdate;
            for (let i = 0, len = courses.length; i < len; ++i) {
                let tmpCourse = courses[i];

                if (tmpCourse._id === course._id) {
                    courses.splice(i, 1);
                    break;
                }
            }
        }

        function persistData () {
            return new $q((resolve, reject)=>{
                let teacher = UserService.getTeacher();
                let promises = [];
                let p = null;

                p = DataService.updateCourses(teacher, _normalCoursesToUpdate);
                promises.push(p);

                p = DataService.deleteCourses(teacher, _normalCoursesToDelete);
                promises.push(p);

                $q.all(promises).then(resolve).catch(reject);

                _normalCoursesToUpdate = [];
                _normalCoursesToDelete = [];
            });
        }

        /**
         * @desc 获取所有的课程
         * @returns {Array}
         */
        $scope.getCourses = function () {
            return _normalCourses;
        };

        $scope.isShowSelectAllBtn = function () {
            return _showSelectAllBtn;
        };

        /**
         * @desc 删除课程
         * @param course
         */
        $scope.deleteCourse = function (course) {
            let message = `您确认要删除${course.name}课程吗?`;

            ConfirmDialogModel.reset();
            ConfirmDialogModel.setMessage(message);

            $uibModal.open({
                animation:true,
                openedClass: "xy-manage-class-confirm-dialog",
                templateUrl:'view/widget/ui_bootstrap/confirm_dialog/confirm_dialog.html',
                size:'sm',
                controller:'ConfirmDialogCtrl'
            }).result.then( isDelete => {
                isDelete && deleteCourse(course);
            });
        };

        $scope.updateCourse = function (course) {
            updateCourse(course);
        };

        /**
         * @desc 批量删除课程
         */
        $scope.batchDelete = function () {
            let message = `您确认要批量删除您选择的课程吗?`;

            ConfirmDialogModel.reset();
            ConfirmDialogModel.setMessage(message);

            $uibModal.open({
                animation:true,
                openedClass: "xy-manage-class-confirm-dialog",
                templateUrl:'view/widget/ui_bootstrap/confirm_dialog/confirm_dialog.html',
                size:'sm',
                controller:'ConfirmDialogCtrl'
            }).result.then( isDelete => {
                if (isDelete) {
                    let courses = angular.copy(_normalCourses || []);

                    for (let i = 0, len = courses.length; i < len; ++i) {
                        let course = courses[i];
                        if (course.selected) {
                            deleteCourse(course);
                        }
                    }
                }
            });
        };

        /**
         * @desc 获取所有选中的课程
         * @returns {Array}
         */
        $scope.getSelectedCourses = function () {
            let selectedCourses = [];

            let courses = angular.copy(_normalCourses || []);

            for (let i = 0, len = courses.length; i < len; ++i) {
                let course = courses[i];
                if (course.selected) {
                    selectedCourses.push(course);
                }
            }

            return selectedCourses;
        };

        /**
         * @desc 选中所有的学生
         */
        $scope.selectAll = function () {
            _showSelectAllBtn = false;
            for (let course of _normalCourses) {
                course.selected = true;
            }
        };

        /**
         * @desc 对于所有学生全部不选中
         */
        $scope.unSelectAll = function (){
            _showSelectAllBtn = true;
            for (let course of _normalCourses) {
                course.selected = false;
            }
        };


        /**
         * 更新下标为index课程名
         * @param index
         * @param $event
         */
        $scope.onCourseNameInputBlur = function (course) {
             let name = course.name.trim();
            if(!(name !== "" && name != null)){
                alertMsg("课程名不能为空", 1000);
                course.name = _oldInputValue;
                 updateCourse(course);
                return;
            }
            else if (!ValidationService.checkCourseName(name)) {
                alertMsg("课程名不能包含以下字符: \\ / : * ? < > |", 1000);
                course.name = _oldInputValue;
                updateCourse(course);
                return;
            }

            for (let tmpCourse of _normalCourses) {
                if (tmpCourse.name === course.name
                        && tmpCourse._id !== course._id) {
                    alertMsg("名字为" + name + "的课程已经存在", 1000);
                    course.name = _oldInputValue;
                    updateCourse(course);
                    return;
                }
            }

            let openCourses = UserService.getOpenCourses();
            for (let tmpCourse of openCourses) {
                if (tmpCourse.name === course.name
                    && tmpCourse._id !== course._id) {
                    alertMsg("名字为" + name + "的课程已经存在", 1000);
                    course.name = _oldInputValue;
                    updateCourse(course);
                    return;
                }
            }

            updateCourse(course);
        };

        /**
         * @desc 获取指定课程的学生数目
         * @param course
         * @returns {Number}
         */
        $scope.getStudentsNumber = function (course) {
            return (course.students || []).length;
        };

        /**
         * 用来记录input修改前的值
         * @param $event
         */
        $scope.onInputFocusIn = function ($event) {
            _oldInputValue = ($event.currentTarget.value || "").trim();
        };


        $scope.getVersion = function () {
            return APP_CONFIG.version;
        };


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
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-manage-class_all_class");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-manage-class_all_class");
            let tableHeader = document.querySelector(".xy_manage_class_header");

            let offset = innerWrapper.scrollTop;
            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-manage-class_all_class");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
        }

        // $scope.init();

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
            let course = UserService.getCurrentCourse();
            let students = UserService.getStudentsByCourseId(course._id);

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
            if(!checkStationConnection()) {
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
    }
]);