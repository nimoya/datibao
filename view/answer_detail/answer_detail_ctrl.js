/**
 * Created by deng on 16/6/12.
 */
dtb.controller('AnswerDetailCtrl',[
    '$scope',
    'SaveRecordsModel',
    '$rootScope',
    '$q',
    '$timeout',
    'WindowService',
    'ClassAnswerService',
    'TeacherCardService',
    'StudentCardService',
    'AnswerStudentService',
    'UserService',
    'RecordService',
    'StationService',
    'WebsocketService',
    function(
            $scope,
            SaveRecordsModel,
            $rootScope,
            $q,
            $timeout,
            WindowService,
            ClassAnswerService,
            TeacherCardService,
            StudentCardService,
            AnswerStudentService,
            UserService,
            RecordService,
            StationService,
            WebsocketService){

        $scope.$on(APP_EVENTS.onWindowOpened,function () {
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowExpand, function(){
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowBacked,function () {
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowClosed, function () {
            closeWin();
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);


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

        $scope.$on(APP_EVENTS.onQuestionAnswerSet, (event, data)=>{
            let options = data.opt || [];
            if (options.join("") === "^" || options.join("") === "$") {
                return;
            }

            $timeout(function(){
                setCurrentAnswer(options);
            });
        });

        $scope.openStudentListByOption = function (option) {
            let students = ClassAnswerService.getMembersByOption(option)

            // 没有学生的情况下，不进入answerStudent页面
            if (students.length <= 0) {
                return;
            }

            let title = "选择" + option + "的同学";
            openStudentList(students, title, false);
        };

        $scope.openUnAnsweredStudentList = function () {
            let unAnsweredStudents = ClassAnswerService.getUnAnsweredMembers() || [];
            let inValidStudents    = ClassAnswerService.getAnswerInvalidMembers() || []
            let students = unAnsweredStudents.concat(inValidStudents);

            // 没有学生的情况下，进入studentAnswer页面
            if (students.length <= 0) {
                return;
            }

            let title = "未作答的学生";
            openStudentList(students, title, false);
        };

        $scope.setCurrentAnswer = function (options) {
            setCurrentAnswer(options);
        };

        $scope.getStudentRateByOption = function (option) {
            let members    = ClassAnswerService.getMembersByOption(option) || [];
            let allMembers = ClassAnswerService.getMembers() || [];

            let rate = 0;
            if (allMembers.length > 0) {
                rate = members.length / allMembers.length;
            }

            return rate;
        };

        $scope.getStudentsByOption = function (option) {
            return ClassAnswerService.getMembersByOption(option) || [];
        };

        /**
         * @desc 获取没有回答学生的数目，对于选择了不合法选项的学生我们也认为其没有回答
         * @returns {number}
         */
        $scope.getUnAnsweredStudentCount = function () {
            let members = getUnAnsweredStudents() || [];
            return members.length;
        };

        $scope.getUnAnsweredStudentRate = function () {
            let allMembers = ClassAnswerService.getMembers() || [];
            let uAMembers  = getUnAnsweredStudents() || [];

            let rate = 0;
            if (allMembers.length > 0) {
                rate = uAMembers.length / allMembers.length;
            }
            return rate;
        };

        $scope.getStudentsCountByOption = function (option) {
            let members    = ClassAnswerService.getMembersByOption(option);
            return members.length;
        };

        $scope.getOptionClassObj = function (option) {
            let obj = {};
            if (isSetAnswer()) {
                if (isOptionInAnswer(option)) {
                    obj.correct = true;
                } else {
                    obj.error= true;
                }
            }
            return obj;
        };


        $scope.triggerOptionInAnswer = function (option) {
            let answer = $scope.answer || [];
            let index  = answer.indexOf(option);
            if (index >= 0) {
                answer.splice(index, 1);
            } else {
                answer.push(option);
                answer.sort();
            }

            setCurrentAnswer(answer);
            
        };

        $scope.isNormalMode=function(){
            if(UserService.isNormal()){
                return true;
            }
            else{
                return false;
            }
        };


        function init(){
            $scope.options   = StudentCardService.getSelectOptions();
            $scope.answer    = ClassAnswerService.getAnswer() || [];
            $scope.promptMsg = getPromptMsg($scope.answer);
            
            let pRate = ClassAnswerService.getQuestionParticipationRate();
            $scope.pRateStr = pRate;
            
            let cRate = ClassAnswerService.getQuestionCorrectRate();
            $scope.cRateStr = cRate;
        }

        function isOptionInAnswer (option) {
            let answer = $scope.answer || [];
            for (let tmpOption of answer) {
                if (tmpOption === option) {
                    return true;
                }
            }
            return false;
        }

        function isSetAnswer() {
            if (!$scope.answer || $scope.answer.length <= 0) {
                return false;
            }
            return true;
        }

        function getPromptMsg (answer) {
            let info = "请点击选项（或通过教师卡）选中正确答案,如A";
            if (answer && answer.length > 0) {
                info = "正确答案为" + answer.join("");
            }
            return info;
        }

        function getPromptInfo () {
            let prompt = "请点击选项（或通过教师卡）选中正确答案,如A";
            if ($scope.answer != null) {
                let answerVal = "";
                for (let option of $scope.options) {
                    if (parseInt(option.optKey) === parseInt($scope.answer)) {
                        answerVal = option.optVal;
                        break;
                    }
                }

                prompt = "正确答案为：" + answerVal;
            }

            return prompt;
        }

        function setCurrentAnswer(options) {
            $scope.answer = options;
            ClassAnswerService.setAnswer(options);

             $scope.promptMsg = getPromptMsg($scope.answer);

            $scope.pRateStr = getPRateStr();
            $scope.cRateStr = getCRateStr();
        }

        function getPRateStr () {

            let rate = ClassAnswerService.getQuestionParticipationRate();
            return rate;
        }

        function getCRateStr () {
            let rate = ClassAnswerService.getQuestionCorrectRate();
            return rate;
        }

        /**
         * @desc 获取没有回答学生，对于选择了不合法选项的学生我们也认为其没有回答
         * @returns {Array}
         */
        function getUnAnsweredStudents () {
            let uAnsweredMembers = ClassAnswerService.getUnAnsweredMembers()    || [];
            let inValidMembers   = ClassAnswerService.getAnswerInvalidMembers() || [];
            return inValidMembers.concat(uAnsweredMembers);
        }

        /**
         *按照选项查看作答的学生
         * @param opt
         */
        function openStudentList(students, title, canAnswer){
            // 公开课模式下，不打开学生的查看界面
            if (!UserService.isNormal()) {
                console.warn("公开课模式，不打开学生列表");
                return;
            }

            // 没有学生的情况下不进入answer student页面
            if (students.length <= 0) {
                return;
            }

            AnswerStudentService.reset();
            AnswerStudentService.setCanAnswer(!!canAnswer)
            AnswerStudentService.setTitle(title);
            AnswerStudentService.setStudents(students);

            WindowService.enterToWindow(APP_WINDOWS.answerStudent);
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
         * @desc 关闭窗口需要做的事情
         */
        function closeWin () {
            // 非公开课模式且有人回答的情况下，我们需要记录问题
            if (UserService.isNormal()
                    && ClassAnswerService.getAnsweredMembers().length > 0) {
                saveRecord();
            }

            // WebsocketService.publicAnswer($scope.answer.join(','));

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
                $scope._alerting=true;
                $scope._alertContent=msg;
            });
            $timeout(()=>{
                $scope._alerting=false;
            },interval);
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

        function saveRecord () {
            SaveRecordsModel.setSaveRecordsShow(true);
            let answer = $scope.answer || [];

            let course = UserService.getCurrentCourse();
            ClassAnswerService.setCourse(course);

            let allStudents = ClassAnswerService.getMembers();
            let answeredStudents = ClassAnswerService.getAnsweredMembers();
            let correctStudents  = ClassAnswerService.getMembersByOptions(answer);

            let rate = 0;
            if (answeredStudents.length > 0) {
                rate  = (correctStudents.length / answeredStudents.length).toFixed(2);
            }

            let pRate = 0;
            if (allStudents.length > 0) {
                pRate = (answeredStudents.length / allStudents.length).toFixed(2);
            }

            let records = ClassAnswerService.getRecords() || [];
            for (let stu of allStudents) {
                let record = null;
                for (let tmpRecord of records) {
                    if (tmpRecord.student === stu._id) {
                        record = tmpRecord;
                        break;
                    }
                }
                if (record == null) {
                    record = ClassAnswerService.createDefaultRecord();
                }

                record.question = ClassAnswerService.getQuestion()._id;
                record.student = stu._id;

                let opt = stu.opt;

                // 老师没有公布答案的情况
                if (!answer || answer.length <= 0) {
                    record.isRight = -1;

                } else {
                    // 学生没有回答的情况
                    if (opt == null || opt.length <= 0) {
                        record.isRight = 0;

                    } else if (opt.join("") === answer.join("")) {
                        record.isRight = 1;

                    } else {
                        record.isRight = 0;
                    }
                }

                record.answer = (opt || []).join("");
                records.push(record);
            }
            ClassAnswerService.setRecords(records);

            ClassAnswerService.saveQuestion().then(()=>{
                console.log("save question success");
            }).catch(err=>{
                console.error(err);
            });
            SaveRecordsModel.setSaveRecordsShow(false);
        }
    }]
);