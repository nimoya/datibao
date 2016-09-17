/**
* @ignore  =====================================================================================
* @fileoverview 设置页面的控制器
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/2
* @ignore  depend
* @ignore  =====================================================================================
*/
(function(){
    let uuid = require('node-uuid');

    angular.module("DTB").controller('SettingCtrl',[
        '$scope',
        '$rootScope',
        '$q',
        '$timeout',
        '$uibModal',
        'Uuid',
        'Clipboard',
        'ValidationService',
        'StationService',
        'WindowService',
        'UserService',
        'DataService',
        'TeacherCardService',
        'ImportClassDialogModel',
        'CreateClassDialogModel',
        'ConfirmDialogModel',
        'WebsocketService',
        function (
            $scope,
            $rootScope,
            $q,
            $timeout,
            $uibModal,
            Uuid,
            Clipboard,
            ValidationService,
            StationService,
            WindowService,
            UserService,
            DataService,
            TeacherCardService,
            ImportClassDialogModel,
            CreateClassDialogModel,
            ConfirmDialogModel,
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

                WebsocketService.stopBroadcast();
            });

            $scope.$on(APP_EVENTS.onWindowBacked, ()=>{
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
                console.log('设置窗口关闭');
                // 同步设置页面、教师卡管理页面，课程管理页面的位置
                WindowService._sameWindowPosition('manageClass','setting');
                WindowService._sameWindowPosition('teacherCard','setting');

                close();
                
                WebsocketService.startBroadcast();
            });

            $scope.$on(APP_EVENTS.onWindowLeaved, ()=>{
                // 同步设置页面、教师卡管理页面，课程管理页面的位置
                WindowService._sameWindowPosition('manageClass','setting');
                WindowService._sameWindowPosition('teacherCard','setting');
                close();
            });

            $scope.$on(APP_EVENTS.onCourseStudentsReplaced, (event, course)=>{
                replaceCurtCourseStudents(course.students);
            });

            //有新的课程创建,则切换当前的课程
            $rootScope.$on(APP_EVENTS.onCourseCreated,(event, courseName)=>{
                let course = createDefaultCourse({
                    name: courseName,
                });

                persistData().then(()=>{
                    console.log("persist data success");
                }).catch(err=>{
                    console.error(err);
                });

                addCourse(course);
                updateCurtCourse(course);
            });

            //基站事件的监听,用于提示消息
            $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
            $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

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

            // 对于已经绑定为教师卡的学生卡的处理
            $scope.$on(APP_EVENTS.onQuestionAnswerSet, (event, data) => {
                if (isWaitingBind()) {
                    alertMsg("该卡已经绑定为教师卡", 1000);
                }
            });


            $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
                if (!WindowService.isShowing()
                        && command !== APP_CARD_COMMANDS.triggerWindow) {
                    return;
                }

                handleTeacherCardCommand(command);
            });

            //接收学生卡按键,绑定学生
            $scope.$on(APP_EVENTS.onStudentBind,(event, data)=>{
                // 判断当前是有教师需要绑卡
                if (!isWaitingBind()) {
                    console.warn("not in waiting bind status");
                    return ;
                }

                // 这里已经超出了angular的context的所有得用$timeout
                $timeout(()=>{
                    let ret = bindStudentCard(data.cardId);
                    if (!ret.success) {
                        alertMsg(ret.msg, 2000);
                    }
                });
            });

            const STUDENTS_TO_DISPLAY_INCREMENT = 10;

            let createClassDialog = null;
            let importClassDialog = null;

            $scope.oldInputVal = "";
            $scope.oldStudentName = "";

            $scope.numberOfStudentsToDisplay = 0; // 当前显

            let _normalCourses      = []; // 当前所有的课程
            let _normalCoursesToAdd = []; // 新添加的课程

            let _curtCourseIndex = 0;

            let _students         = []; // 当前课程的学生
            let _studentsToAdd    = []; // 新添加的学生
            let _studentsToUpdate = []; // 需要更新的学生
            let _studentsToDelete = []; // 需要删除的学生

            
            let _isWaitingBind = false;

            let _defaultOutputFileName = "";

            $scope.onTableScroll = function (data) {
                let scrollTop    = data.scrollTop;
                let scrollHeight = data.scrollHeight;
                let offsetHeight = data.offsetHeight;

                let leftHeight = scrollHeight - offsetHeight - scrollTop;

                if (leftHeight < 100) {
                    if ($scope.numberOfStudentsToDisplay + STUDENTS_TO_DISPLAY_INCREMENT > _students.length) {
                        $scope.numberOfStudentsToDisplay = _students.length;
                    } else {
                        $scope.numberOfStudentsToDisplay += STUDENTS_TO_DISPLAY_INCREMENT;
                    }
                }
            };
            
            function reset () {
                if (createClassDialog) {
                    createClassDialog.dismiss("cancel");
                }
                createClassDialog = null;

                if (importClassDialog) {
                    importClassDialog.dismiss("cancel");
                }
                importClassDialog = null;

                _normalCourses = [];
                _curtCourseIndex = 0;

                _students         = [];
                _studentsToAdd    = [];
                _studentsToUpdate = [];
                _studentsToDelete = [];

                _isWaitingBind = false;

                _defaultOutputFileName = "";

                $scope.numberOfStudentsToDisplay = 0;

                scrollTableToTop();
            }

            function init () {
                reset();

                // 先清除，然后在设置固定table header
                disableFixedTableHeader();
                fixedTableHeader();

                _normalCourses = UserService.getNormalCourses();

                // 有课程的情况
                if (_normalCourses.length > 0) {
                    let course = null;
                    // 非公开课模式下，显示当前选中课程的学生信息
                    if (UserService.isNormal()) {
                        course = UserService.getCurrentCourse();
                    } else {
                        course = _normalCourses[0];
                    }

                    for (let i = 0, len = _normalCourses.length; i < len; ++i) {
                        let tmpCourse = _normalCourses[i];
                        if (tmpCourse._id === course._id) {
                            _curtCourseIndex = i;
                            break;
                        }
                    }

                    _students = course.students || [];
                    for (let stu of _students) {
                        stu.available = !!stu.cardId ? 2: 0;
                    }

                    initStudentNumberToDisplay(_students.length);
                }
            }

            function initStudentNumberToDisplay (studentsCount) {
                $scope.numberOfStudentsToDisplay = STUDENTS_TO_DISPLAY_INCREMENT;

                if (studentsCount < STUDENTS_TO_DISPLAY_INCREMENT) {
                    $scope.numberOfStudentsToDisplay = studentsCount;
                }
            }

            function close () {
                // 当前没有课程的时候，不进行处理
                let currentCourse = getCurtCourse();
                if (currentCourse == null) {
                    reset();
                    return;
                }

                // 保存当前课程的学生
                currentCourse.students = _students;

                UserService.setNormalCourses(_normalCourses);

                persistData().then(()=>{
                    console.log("persist data success");
                }).catch(err=>{
                    console.error(err);
                });

                reset();
            }

            function startWaitingBind (student) {
                cancelWaitingBind();
                _isWaitingBind = true;

                student.available = 1;
                delete student.isBePresent;
                delete student.attendanceTime;
            }

            function cancelWaitingBind () {
                _isWaitingBind = false;

                let students = _students;
                for (let stu of students) {
                    stu.available = !!stu.cardId ? 2 : 0;
                }
            }

            function isWaitingBind () {
                return _isWaitingBind;
            }

            /**
             * @desc 创建一个默认的课程
             * @param course
             * @returns {Object}
             */
            function createDefaultCourse (course) {
                return angular.extend({
                    _id: Uuid.v4(),
                    name:"",
                    createTime: Date.now(),
                    students: [],
                }, course || {});
            }

            function addCourse (course) {
                course = angular.copy(course);

                _normalCourses.push(course);
                _normalCoursesToAdd.push(course);
            }

            function updateCurtCourse (course) {
                cancelWaitingBind();

                let curtCourse = getCurtCourse();
                curtCourse.students = _students;

                for (let i = 0, len = _normalCourses.length; i < len; ++i) {
                    let nc = _normalCourses[i];
                    if (nc._id === course._id) {
                        _curtCourseIndex = i;
                        break;
                    }
                }

                _students = course.students || [];
                for (let stu of _students) {
                    stu.available = !!stu.cardId ? 2: 0;
                }

                _studentsToAdd    = [];
                _studentsToDelete = [];
                _studentsToUpdate = [];

                initStudentNumberToDisplay(_students.length);
            }

            function replaceCurtCourseStudents (students) {
                let studentsToDelete = [];
                for (let stu of _students) {
                    if (isStudentToUpdate(stu) || !isStudentToAdd(stu)) {
                        studentsToDelete.push(stu);
                    }
                }

                _studentsToDelete = _studentsToDelete.concat(studentsToDelete);
                _studentsToUpdate = [];
                _studentsToAdd = angular.copy(students);
                _students = angular.copy(_studentsToAdd);

                initStudentNumberToDisplay(_students.length);
            }

            function isCourseToAdd (course) {
                let courses = _normalCoursesToAdd;

                for (let tmpCourse of courses) {
                    if (tmpCourse._id === course._id) {
                        return true;
                    }
                }

                return false;
            }

            function getCurtCourseIndex () {
                return _curtCourseIndex;
            }

            function getCurtCourse () {
                let index = getCurtCourseIndex();
                return _normalCourses[index] || null;
            }

            /**
             * @desc 判断课程是否存在
             * @param name
             * @returns {boolean}
             */
            function isCourseExistByName (name) {
                for (let course of _normalCourses) {
                    if (course.name === name) {
                        return true;
                    }
                }

                let openCourses = UserService.getOpenCourses();
                for (let course of openCourses) {
                    if (course.name === name) {
                        return true;
                    }
                }

                return false;
            }


            /**
             * @desc  判断当前是否有班级
             * @returns {boolean}
             */
            function hasClass () {
                let courses = _normalCourses || [];
                return courses.length > 0;
            }

            /**
             * @desc 创建一个默认的学生
             * @param student
             * @returns {Object}
             */
            function createDefaultStudent (student) {
                return angular.extend({
                    _id: Uuid.v4(),
                    name:'同学姓名',
                    mPhone: "",
                    cardId: "",
                    createTime: Date.now(),
                    available:0         //0:未绑定  1:正在绑定 2:已经绑定
                }, student || {});
            }

            function isStudentInStudentList (student, studentList) {
                for (let i = 0, len = studentList.length; i < len; ++i) {
                    let tmpStu = studentList[i];
                    if (tmpStu._id === student._id) {
                        return true;
                    }
                }
                return false;
            }

            function addStudentToStudentList (student, studentList) {
                studentList.push(student);
            }

            function updateStudentToStudentList (student, studentList) {
                for (let i = 0, len = studentList.length; i < len; ++i) {
                    let tmpStu = studentList[i];
                    if (tmpStu._id === student._id) {
                        studentList[i] = student;
                        break;
                    }
                }
            }

            function deleteStudentInStudentList (student, studentList) {
                for (let i = 0, len = studentList.length; i < len; ++i) {
                    let tmpStu = studentList[i];
                    if (tmpStu._id === student._id) {
                        studentList.splice(i , 1);
                        break;
                    }
                }
            }

            function getIndexOfStudentInStudents (cardId) {
                let students = _students;
                for (let i = 0, len = students.length; i < len; ++i) {
                    let stu = students[i];

                    if (stu.cardId === cardId) {
                        return i;
                    }
                }
                return -1;
            }

            function addStudent (student) {
                if (!hasClass()) {
                    console.error("setting page: do not have normal course");
                    return;
                }

                addStudentToStudents(student);
                addStudentToStudentsToAdd(student);
            }

            function updateStudent (student) {
                if (!hasClass()) {
                    console.error("setting page: do not have normal course");
                    return;
                }

                updateStudentInStudents(student);

                if (isStudentToAdd(student)) {
                    updateStudentInStudentsToAdd(student);
                } else if (isStudentToUpdate(student)) {
                    updateStudentInStudentsToUpdate(student);
                } else {
                    addStudentToStudentsToUpdate(student);
                }
            }

            function deleteStudent (student) {
                if (!hasClass()) {
                    console.error("setting page: do not have normal course");
                    return;
                }


                deleteStudentFromStudents(student);

                // 删除的卡是之前新增加的卡
                if (isStudentToAdd(student)) {
                    deleteStudentFromStudentsToAdd(student);
                } else if (isStudentToUpdate(student)) {
                    deleteStudentFromStudentsToUpdate(student);
                    addStudentToStudentsToDelete(student);
                } else {
                    addStudentToStudentsToDelete(student);
                }
            }

            function addStudentToStudents (student) {
                addStudentToStudentList(student, _students);
            }

            function updateStudentInStudents (student) {
                updateStudentToStudentList(student, _students);
            }

            function deleteStudentFromStudents (student) {
                deleteStudentInStudentList(student, _students);
            }

            function isStudentToAdd (student) {
                return isStudentInStudentList(student, _studentsToAdd);
            }

            function addStudentToStudentsToAdd (student) {
                addStudentToStudentList(student, _studentsToAdd);
            }

            function updateStudentInStudentsToAdd (student) {
                updateStudentToStudentList(student, _studentsToAdd);
            }

            function deleteStudentFromStudentsToAdd (student) {
                deleteStudentInStudentList(student, _studentsToAdd);
            }

            function isStudentToUpdate (student) {
                return isStudentInStudentList(student, _studentsToUpdate);
            }

            function addStudentToStudentsToUpdate (student) {
                addStudentToStudentList(student, _studentsToUpdate);
            }

            function updateStudentInStudentsToUpdate (student) {
                updateStudentToStudentList(student, _studentsToUpdate);
            }

            function deleteStudentFromStudentsToUpdate (student) {
                deleteStudentInStudentList(student, _studentsToUpdate);
            }

            function isStudentToDelete (student) {
                return isStudentInStudentList(student, _studentsToDelete);
            }

            function addStudentToStudentsToDelete (student) {
                addStudentToStudentList(student, _studentsToDelete);
            }

            function updateStudentInStudentsToDelete (student) {
                updateStudentToStudentList(student, _studentsToDelete);
            }

            function deleteStudentFromStudentsToDelete (student) {
                deleteStudentInStudentList(student, _studentsToDelete);
            }

            function isCardBindAsStudent (cardId) {
                if (cardId === "") {
                    return;
                }

                for (let stu of _students) {
                    if (stu.cardId === cardId && stu.available != 1) {
                        return true;
                    }
                }
                return false;
            }

            
            function isCardBindAsTeacher (cardId) {
                return UserService.isCardBindAsTeacher(cardId);
            }

            function bindStudentCard (cardId) {
                cardId = cardId || "";
                
                // 检查学生卡是否合法
                if (!ValidationService.checkCardId(cardId)) {
                    return {
                        success: false,
                        msg: "卡号格式不合法",
                    };
                }

                if (isCardBindAsTeacher(cardId)) {
                    return {
                        success: false,
                        msg: APP_ALERT.card_binded_teacher,
                    };
                }

                // 判断卡是否已经被绑定为学生
                if (isCardBindAsStudent(cardId)) {
                    let index = getIndexOfStudentInStudents(cardId);
                    let msg = "卡号" + cardId + "已经被绑定为" + (index + 1) + "号同学";
                    return {
                        success: false,
                        msg: msg,
                    };
                }

                let students = _students;
                for (let stu of students) {
                    if (stu.available === 1) {
                        stu.cardId = cardId;
                        stu.available = 2;

                        delete stu.isBePresent;
                        delete stu.attendanceTime;

                        updateStudent(stu);
                        break;
                    }
                }
                cancelWaitingBind();

                return {
                    success: true
                };
            }

            function persistData () {
                let course = getCurtCourse();
                // 在最开始没有课程情况下，会出现当前没有课程的情况
                if (course == null) {
                    console.warn("current course is null");
                    return new $q.resolve();
                }

                let coursePromise = null;

                if (isCourseToAdd(course)) {
                    let teacher = UserService.getTeacher();
                    coursePromise = DataService.addCourse(teacher, course);
                } else {
                    coursePromise = $q.resolve();
                }

                let promise = null;

                // 这里采用了匿名函数来保存_studentsToAdd，_studentsToDelete和_studentsToUpdate
                // 从而方便闭包问题
                promise = (function(_studentsToAdd, _studentsToDelete, _studentsToUpdate){
                    return new $q((resolve, reject)=>{
                        coursePromise.then(()=>{
                            let ps = [];
                            let p = null;

                            if (_studentsToAdd.length > 0) {
                                let studentMapToAdd = {};
                                studentMapToAdd[course._id] = _studentsToAdd;
                                p = DataService.addStudentList(studentMapToAdd);
                            } else {
                                p = $q.resolve();
                            }
                            ps.push(p);

                            if (_studentsToUpdate.length > 0) {
                                let studentMapToUpdate = {};
                                studentMapToUpdate[course._id] = _studentsToUpdate;
                                p = DataService.updateStudentList(studentMapToUpdate);
                            } else {
                                p = $q.resolve();
                            }
                            ps.push(p);

                            if (_studentsToDelete.length > 0) {
                                p = DataService.deleteStudentList(course, _studentsToDelete);
                            } else {
                                p = $q.resolve();
                            }
                            ps.push(p);

                            $q.all(ps).then(resolve).catch(reject);
                        }).catch(reject);
                    });
                })(_studentsToAdd, _studentsToDelete, _studentsToUpdate);

                _normalCoursesToAdd = [];

                _studentsToAdd    = [];
                _studentsToDelete = [];
                _studentsToUpdate = [];
                
                return promise;
            }

            /**
             * @desc 获取当前的课程
             * @returns {Array}
             */
            $scope.getCourses = function () {
                return _normalCourses || [];
            };

            /**
             * @desc 获取当前选中课程数组下标
             * @returns {Number}
             */
            $scope.getCurtCourseIndex = function () {
                return getCurtCourseIndex();
            };

            /**
             * @desc 获取当前课程
             * @returns {*|null}
             */
            $scope.getCurtCourse = function(){
                return getCurtCourse();
            };

            /**
             * @desc 获取当前课程的名字
             * @returns {string}
             */
            $scope.getCurtCourseName = function () {
                let course = this.getCurtCourse();

                return course == null ? "" : course.name;
            };

            $scope.getCurtCourseStudent = function () {
                let course = this.getCurtCourse();
                let students = [];
                if (course != null) {
                    students = course.students;
                }
                return students;
            };

            $scope.onCourseChanged = function (index) {
                if (_curtCourseIndex ===  index) {
                    return;
                }

                scrollTableToTop();
                
                persistData().then(()=>{
                    console.log("persist data success");
                }).catch(err=>{
                    console.error(err);
                });

                let course = _normalCourses[index];
                updateCurtCourse(course);
            };

            /**
             * @desc 判断是否需要显示学生表
             * @returns {boolean}
             */
            $scope.showStudentsTable = function () {
                return hasClass();
            };

            /**
             * @desc 是否显示班级选择的selector
             * @returns {boolean}
             */
            $scope.showClassSelector = function () {
                return hasClass();
            };

            /**
             * @desc 获取当前课程的学生
             * @returns {Array}
             */
            $scope.getStudents = function () {
                return _students;
            };

            /**
             * 增加一个默认学生
             */
            $scope.addStudent = function () {
                //添加之前清除绑定中的状态
                cancelWaitingBind();

                let student = createDefaultStudent();

                addStudent(student);

                $scope.numberOfStudentsToDisplay++;

                $timeout(scrollTableToBottom)
            };

            /**
             * 页面中删除学生按钮的回调函数
             * @param $event
             * @param index
             */
            $scope.deleteStudent = function (student) {
                let message = `您确认要删除${student.name}同学吗?`;

                ConfirmDialogModel.reset();
                ConfirmDialogModel.setMessage(message);

                $uibModal.open({
                    animation:true,
                    openedClass: "xy-setting-confirm-dialog",
                    templateUrl:'view/widget/ui_bootstrap/confirm_dialog/confirm_dialog.html',
                    size:'sm',
                    controller:'ConfirmDialogCtrl'
                }).result.then( isDelete => {
                    if (isDelete) {
                        deleteStudent(student);
                        $scope.numberOfStudentsToDisplay--;
                    }
                });
            };

            $scope.startWaitingBind = function (student) {
                // 检测基站是否连接
                if (!checkStationConnection()) {
                    alertMsg(APP_ALERT.station_unconn, 2000);
                    return;
                }

                startWaitingBind(student);
            };

            $scope.rebindStudentCard = function (student) {
                if (!checkStationConnection()) {
                    alertMsg(APP_ALERT.station_unconn, 2000);
                    return;
                }

                student.cardId = "";
                delete student.isBePresent;
                delete student.attendanceTime;

                updateStudent(student);
                startWaitingBind(student);
            };


            $scope.onCardIdInputOnFocus = function (student) {
                startWaitingBind(student);
            };

            $scope.onNameInutFocus = function (student) {
                $scope.oldStudentName = student.name;
            };

            /**
             * @desc 更新学生的名字
             * @param index 学生的下标
             * @param name 学生的名字
             */
            $scope.updateStudentName = function (student) {
                student.name = student.name || "";
                // 学生姓名为空的情况进行处理
                if(!(student.name !== "" && student.name != null)){
                    alertMsg("学生姓名不能为空", 1000);
                    student.name = $scope.oldStudentName;
                }
                else if (!ValidationService.checkStudentName(student.name)) {
                    alertMsg("学生姓名不能包含以下字符: \\ / : * ? < > |", 1000);
                    student.name = $scope.oldStudentName;
                }

                updateStudent(student);
            };

            /**
             * @desc 更新学生的sNumber
             * @param index
             * @param sNumber
             */
            $scope.updateStudentSNumber = function (student) {
                if (!ValidationService.checkStudentSNumber(student.sNumber)) {
                    alertMsg("学号不合法，请重新输入", 1000);
                    student.sNumber = "";
                }

                updateStudent(student);
            };

            /**
             * @desc  更新学生的电话号码
             * @param index
             * @param phone
             */
            $scope.updateStudentPhone = function (student) {
                if (!ValidationService.checkStudentPhone(student.mPhone)) {
                    alertMsg("手机号码格式不正确", 1000);
                    student.mPhone = "";
                }

                updateStudent(student);
            };

            /**
             * @desc 更新学生绑定的卡
             * @param index
             * @param cardId
             */
            $scope.onCardIdInputBlur = function (student) {
                // 判断当前是有教师需要绑卡
                if (!isWaitingBind()) {
                    return ;
                }

                let ret = bindStudentCard(student.cardId);
                if (!ret.success) {
                    alertMsg(ret.msg, 2000);
                    student.cardId = "";
                    updateStudent(student);
                }
            };

            $scope.onInputKeyDown = function ($event, index, column) {
                // 用户按下enter键的处理
                if ($event.keyCode === 13) {
                    $event.currentTarget.blur();

                    // ctrl + v的处理（复制的功能）
                } else if ($event.keyCode === 86 && $event.ctrlKey) {
                    $event.preventDefault();

                    let texts = Clipboard.get("text").split("\n");

                    let infos = [];
                    let maxColumn = 4;

                    for (let i = 0, len = texts.length; i < len; ++i) {
                        let tmpText = texts[i];

                        if (tmpText == "") {
                            break;
                        }

                        let tmpInfo = tmpText.split("\t");
                        if (tmpInfo.length > maxColumn - column + 1) {
                            alertMsg("粘贴的内容不合法", 3000);
                            return;
                        }

                        for (let j = 0; j < tmpInfo.length; ++j) {
                            tmpInfo[j] = tmpInfo[j].trim();
                        }

                        infos.push(tmpInfo);
                    }

                    // 没有需要绑定的内容，所以不进行处理
                    if (infos.length <= 0) {
                        return;
                    }

                    let validationFuncs = [
                        ValidationService.checkStudentName,
                        ValidationService.checkStudentSNumber,
                        ValidationService.checkStudentPhone,
                        ValidationService.checkCardId,
                    ];

                    // 检查要粘贴的内容的合法性
                    for (let info of infos) {
                        for (let i = column - 1, j = 0, len = column + info.length - 1; i < len; ++i, ++j) {
                            if (!validationFuncs[i](info[j])) {
                                alertMsg("粘贴的内容不合法", 3000);
                                return;
                            }
                        }
                    }

                    // 检查卡号是否重复或者已经被绑定
                    if ( column + infos[0].length - 1 >= maxColumn ) {
                        for (let i = 0; i < infos.length; ++i) {
                            let info = infos[i];
                            let cardId = info[info.length - 1];

                            // 检查卡号是否已经绑定为学生卡
                            if (isCardBindAsStudent(cardId)) {
                                let index = getIndexOfStudentInStudents(cardId);
                                let msg = "卡号" + cardId + "已经被" + (index + 1) + "号学生绑定";
                                alertMsg(msg, 3000);
                                return;
                            }

                            // 检测卡号是否已经被绑定为教师卡
                            if (isCardBindAsTeacher(cardId)) {
                                let msg = "卡号" + cardId + "已经被绑定为教师卡";
                                alertMsg(msg, 3000);
                                return;
                            }
                        }

                        // 检查卡号是够重复
                        for (let i = 0, len = infos.length; i < len; ++i) {
                            let info1 = infos[i];
                            let cardId1 = info1[info1.length - 1];

                            // cardId 为空的情况下不属于和其他卡重复
                            if (!cardId1) {
                                continue;
                            }

                            for (let j = 0; j < len; ++j) {
                                let info2 = infos[j];
                                let cardId2 = info2[info2.length - 1];
                                if (cardId1 === cardId2 && i !== j) {
                                    let msg = "卡号" + cardId1 + "重复";
                                    alertMsg(msg, 3000);
                                    return;
                                }
                            }
                        }
                    }

                    let keys = [
                        "name",
                        "sNumber",
                        "mPhone",
                        "cardId",
                    ];

                    let studentsToUpdate = [];
                    let studentsToAdd    = [];

                    let curtStudentsLen = _students.length;
                    // $scope.students.length;
                    for (let i = 0, len = infos.length; i < len; ++i) {
                        let info = infos[i];

                        // 需要新添加的学生
                        if (i + index + 1 > curtStudentsLen) {
                            let tmpStu = createDefaultStudent();
                            for (let j = 0; j < info.length; ++j) {
                                let key = keys[column + j - 1];
                                tmpStu[key] = info[j];
                            }
                            addStudent(tmpStu);

                            // 需要更新非学生
                        } else {
                            let tmpStu = angular.copy(_students[index + i]);
                            for (let j = 0; j < info.length; ++j) {
                                let key = keys[column + j - 1];
                                tmpStu[key] = info[j];
                            }
                            updateStudent(tmpStu);
                        }
                    }
                }
            };
            
            $scope.openManageClassPage = function () {
                WindowService.replaceWithWindow(APP_WINDOWS.manageClass);
            };

            $scope.openTeacherCardPage = function () {
                WindowService.replaceWithWindow(APP_WINDOWS.teacherCard);
            };

            $scope.closeWin = function () {
                WindowService.backToWindow();
            };

            $scope.minimize = function () {
                WindowService.minimizeWindow();
            };

            $scope.getVersion = function () {
                return APP_CONFIG.version;
            };


            /**
             *创建班级
             */
            $scope.createClass = function () {
                let openCourses = UserService.getOpenCourses();
                let courses = _normalCourses.concat(openCourses);
                courses = angular.copy(courses);

                CreateClassDialogModel.reset();
                CreateClassDialogModel.setCourses(courses);

                //打开模态框
                createClassDialog = $uibModal.open({
                    animation:true,
                    openedClass: "xy-setting-add-class",
                    templateUrl:'view/setting/create_class_dialog/create_class_dialog.html',
                    size:'lg',
                    controller:'CreateClassCtrl'
                });
            };

            $scope.getDefaultOutputFilename = function () {
                return _defaultOutputFileName;
            };

            function triggerInputFileClickEvent (input) {
                $timeout(function(input){
                    let event = new MouseEvent("click", {
                        bubbles: false,
                        cancelable: true
                    });
                    input.dispatchEvent(event);
                }, 0 ,false, input);
            }

            /**
             * @desc 这个函数是用来点击
             * @param $event
             */
            $scope.inputClassBtnClickHandler = function ($event) {
                let input = $event.currentTarget.querySelector("input");

                triggerInputFileClickEvent(input);
            };

            /**
             * @desc 导入班级
             * @param filePath 班级文件路径
             */
            $scope.importClass = function (input) {
                let filePath = input.files[0].path;
                input.value =  null;

                if (!filePath.endsWith(".dtb")) {
                    alertMsg("文件格式不正确", 1000);
                    return;
                }

                try {
                    let fs = require("fs");
                    let json = fs.readFileSync(filePath);
                    let ret = JSON.parse(json);

                    let classes = Object.keys(ret);
                    if (classes.length <= 0) {
                        alertMsg("文件格式不正确", 1000);
                        return;
                    }

                     let cls = classes[0];
                    if(!(cls !== "" && cls != null)){
                        alertMsg("课程名不能为空", 1000);
                        return;
                    }
                    else if (!ValidationService.checkCourseName(cls)) {
                        alertMsg("课程名不能包含以下字符: \\ / : * ? < > |", 1000);
                        return;
                    }

                    let students = ret[cls] || [];

                    // 更新学生的id，从而防止和之前在数据库中学生的id冲突
                    for (let stu of students) {
                        stu._id = Uuid.v4();
                        stu.createTime = Date.now();
                    }

                    if (isCourseExistByName(cls)) {
                        ImportClassDialogModel.setCourse({
                            name: cls,
                            students: students,
                        });

                        importClassDialog = $uibModal.open({
                            animation:true,
                            openedClass: "xy-setting-import-class",
                            templateUrl:'view/setting/import_class_dialog/import_class_dialog.html',
                            size:'lg',
                            controller:'ImportClassDialogCtrl'
                        });

                    } else {
                        let course = createDefaultCourse({
                            name: cls,
                            students: [],
                        });

                        addCourse(course);
                        updateCurtCourse(course);

                        for (let stu of students) {
                            addStudent(stu);
                        }

                        initStudentNumberToDisplay(students.length);
                    }

                } catch (err) {
                    alertMsg("文件格式不正确", 1000);
                }
            };

            $scope.outputClassBtnClickHandler = function ($event) {
                let input = $event.currentTarget.querySelector("input");

                let course = getCurtCourse();
                if (course == null) {
                    alertMsg("没有课程可导出", 1000);
                    return;
                }

                _defaultOutputFileName = course.name + ".dtb";

                triggerInputFileClickEvent(input);
            };

            /**
             * @desc 导出班级文件
             */
            $scope.outputClass = function (input) {
                let filePath = input.files[0].path;
                input.value = null;

                let course = getCurtCourse();
                let courseName = course.name;

                let ret = {};
                ret[courseName] = _students;

                try {
                    let json = JSON.stringify(ret);

                    let fs = require("fs");
                    fs.writeFileSync(filePath, json);

                } catch (err) {
                    console.error(err);
                }
            };


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

            /**
             * @desc 固定table header
             */
            function fixedTableHeader () {
                let innerWrapper = document.querySelector(".xy-setting-body .inner-wrapper");
                innerWrapper.addEventListener("scroll", scrollTableHeader, false);
            }

            /**
             * @desc 滚动table header
             */
            function scrollTableHeader () {
                let innerWrapper = document.querySelector(".xy-setting-body .inner-wrapper");
                let tableHeader = document.querySelector(".xy-setting-class-info-header");

                let offset = innerWrapper.scrollTop;

                offset = offset === 0 ? 0 : offset - 1;

                tableHeader.style.transform = "translateY(" + offset + "px)";
            }

            /**
             * @desc 接触table header的滚动
             */
            function disableFixedTableHeader () {
                let innerWrapper = document.querySelector(".xy-setting-body .inner-wrapper");
                innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
            }

            /**
             * @desc 滚动table到头
             */
            function scrollTableToTop () {
                let innerWrapper = document.querySelector(".xy-setting-body .inner-wrapper");
                innerWrapper.scrollTop = 0;
            }

            /**
             * @desc 滚动table到底
             */
            function scrollTableToBottom () {
                let innerWrapper = document.querySelector(".xy-setting-body .inner-wrapper");
                innerWrapper.scrollTop = innerWrapper.scrollHeight;
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
                let course = UserService.getCurrentCourse();
                let students = UserService.getStudentsByCourseId(course._id);

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
})();
