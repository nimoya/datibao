/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyLogin标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").controller('MultipleQuestionResultCtrl',[
    '$scope',
    '$rootScope',
    '$q',
    '$timeout',
    '$uibModal',
    'UserService',
    'WindowService',
    'DataService',
    'StationService',
    'StudentCardService',
    'ClassAnswerService',
    'MultipleQuestionModel',
    'MultipleQuestionAnswerSetModel',

    function (
        $scope,
        $rootScope,
        $q,
        $timeout,
        $uibModal,
        UserService,
        WindowService,
        DataService,
        StationService,
        StudentCardService,
        ClassAnswerService,
        MultipleQuestionModel,
        MultipleQuestionAnswerSetModel
    ) {

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
            let qNumber = ClassAnswerService.getQuestionNumber();
            let answer  = ClassAnswerService.getAnswer();

            updateCorrectAnswer({
                number: qNumber,
                opt: answer
            });
        });

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            close();
        });

        //基站事件的监听,用于提示消息
        $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        $scope.$on(APP_EVENTS.onQuestionAnswerSet,(event, data)=>{
            // 这里之所以先将窗口隐藏在显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            $timeout(function(){
                updateCorrectAnswer(data);
            });
        });

        $scope.getQuestions = function () {
            return _questions;
        };

        $scope.getQuestionByQuestionNumber = function (qNumber) {
            return getQuestionByQuestionNumber(qNumber);
        };

        $scope.isShowQuestionSetBtn = function (question) {
            return !isQuestionHasAnswer(question);
        };

        $scope.isShowQuestionAnswer = function (question) {
            return isQuestionHasAnswer(question);
        };

        $scope.getQuestionAnswer = function (question) {
            return (question.options || []).join("");
        };

        $scope.getQuestionCRate = function (question) {
            return (question.cRate.toFixed(2) * 100) + "%";
        };

        $scope.getQuestionPRate = function (question) {
            return (question.pRate.toFixed(2) * 100) + "%";
        };

        $scope.setQuestionAnswer = function (question) {
            openQuestionAnswerSetDialog(question);
        };

        $scope.openDetail = function (question) {
            if (!$scope.isDetailBtnEnable(question)) {
                return;
            }
            // 跳转页面之前先保存记录
            saveRecords();

            let type = getQuestionType(question);

            let qNumber        = question.number;
            let questionRecord = _questionRecords[qNumber];
            let students       = angular.copy(getDetailPageStudentsByQuestion(question));
            let answer         = angular.copy(getQuestionAnswer(question));
            let answerRecords  = _studentAnswerRecords[qNumber];
            let answerRecordsArr = [];
            let keys = Object.keys(answerRecords);
            for (let key of keys) {
                answerRecordsArr.push(answerRecords[key]);
            }

            ClassAnswerService.reset();
            ClassAnswerService.setQuestion(questionRecord);
            ClassAnswerService.setQuestionNumber(qNumber);
            ClassAnswerService.setMembers(students);
            ClassAnswerService.setAnswer(answer);
            ClassAnswerService.setRecords(answerRecordsArr);

            if (type === SELECTION_QUESTION) {
                ClassAnswerService.setValidOptions(StudentCardService.getSelectOptions());
                WindowService.enterToWindow(APP_WINDOWS.answerDetail);
            } else {
                ClassAnswerService.setValidOptions(StudentCardService.getTrueFalseOptions());
                WindowService.enterToWindow(APP_WINDOWS.trueFalseQuestionAnswerDetail);
            }
        };

        $scope.isDetailBtnEnable = function (question) {
            let answer = getQuestionAnswer(question);

            if (answer && answer.length > 0) {
                return true;
            }
            return false;
        };

        $scope.minimize = function () {
            WindowService.minimizeWindow();
        };

        $scope.closeWin = function () {
            WindowService.backToWindow();
        };

        $scope.getQuestionType = function (question) {
            return getQuestionType(question);
        };

        $scope.showResetQuestionButton = function (event) {
            let el = event.target.querySelector(".reset-answer-btn");
            if (el) {
                el.classList.remove("hide");
            }
        };

        $scope.hideResetQuestionButton = function (event) {
            let el = event.target.querySelector(".reset-answer-btn");
            if (el) {
                el.classList.add("hide");
            }
        };

        $scope.onTableScroll = function (data) {
            let scrollTop    = data.scrollTop;
            let scrollHeight = data.scrollHeight;
            let offsetHeight = data.offsetHeight;

            if (scrollHeight - offsetHeight - scrollTop < 100) {
                if ($scope.numberOfQuestionsToDisplay + QUESTIONS_TO_DISPLAY_INCREMENT > _qCount) {
                    $scope.numberOfQuestionsToDisplay = _qCount;
                } else {
                    $scope.numberOfQuestionsToDisplay += QUESTIONS_TO_DISPLAY_INCREMENT;
                }
            }
        };

        const QUESTIONS_TO_DISPLAY_INCREMENT = 20;

        const SELECTION_QUESTION  = "SELECTION_QUESTION";
        const TRUE_FALSE_QUESTION = "TRUE_FALSE_QUESTION";

        $scope.SELECTION_QUESTION  = SELECTION_QUESTION;
        $scope.TRUE_FALSE_QUESTION = TRUE_FALSE_QUESTION;

        $scope.numberOfQuestionsToDisplay = 0;

        let _questions = [];

        let _qCount  = 0;
        let _answers = {};
        let _students = [];

        let _questionRecords      = {};
        let _studentAnswerRecords = {};

        let _questionAnswerSetDialog = null;

        function reset () {
            _questions = [];

            _qCount  = 0;
            _answers = {};
            _students = [];

            if (_questionAnswerSetDialog != null) {
                _questionAnswerSetDialog.dismiss("cancel");
            }

            scrollTableToTop();
        }

        function init () {
            reset();

            // 先清除，然后在设置固定table header
            disableFixedTableHeader();
            fixedTableHeader();

            _qCount   = MultipleQuestionModel.getQuestionCount();
            _answers  = MultipleQuestionModel.getAnswers();
            _students = MultipleQuestionModel.getStudents();

            let questions       = initQuestions(_qCount, _answers, _students);
            let questionRecords = initQuestionRecords(questions);
            initStudentAnswerRecords(questions, questionRecords);

            initQuestionNumberToDisplay(_qCount);
        }

        function initQuestionNumberToDisplay (questionCount) {
            $scope.numberOfQuestionsToDisplay = QUESTIONS_TO_DISPLAY_INCREMENT;

            if (questionCount < QUESTIONS_TO_DISPLAY_INCREMENT) {
                $scope.numberOfQuestionsToDisplay = questionCount;
            }
        }

        function getQuestionAnswer (question) {
            let qNumber = question.number;
            let answer  = (_answers || {})[qNumber] || [];
            return answer;
        }

        function getDetailPageStudentsByQuestion (question) {
            let qNumber  = question.number;
            let students = angular.copy(_students) || [];

            for (let stu of students) {
                let answer = (stu.answers || {})[qNumber] || [];
                stu.opt = answer;
            }

            return students;
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
         * 弹出提示信息
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

        function initQuestions (qCount, answers, students) {
            return updateQuestions(qCount, answers, students);
        }

        /**
         * @desc 更新学生的回答
         * @param qCount
         * @param answers
         * @param students
         * @returns {Array}
         */
        function updateQuestions (qCount, answers, students) {
            let questions       = [];

            for (let i = 0; i < qCount; ++i) {
                let questionNumber = i + 1;
                let options = answers[questionNumber];

                let pRate  = 0;
                let cRate  = 0;

                let pCount = 0;
                let cCount = 0;
                if (students.length > 0) {
                    for (let stu of students) {
                        let tmpAnswers = stu.answers || {};
                        let tmpOptions = tmpAnswers[questionNumber];

                        if (tmpOptions) {
                            pCount++;

                            if (options && options.join("") === tmpOptions.join("")) {
                                cCount++;
                            }
                        }
                    }

                    pRate = pCount / students.length;

                    if (pCount > 0) {
                        cRate = cCount / pCount;
                    }
                }

                let question = {
                    options: options || null,
                    pRate: pRate,
                    cRate: cRate,
                    number: questionNumber,
                };
                questions.push(question);
            }

            _questions = questions;

            return _questions;
        }

        /**
         * @desc 初始化问题的记录
         * @param questions
         * @returns {{}}
         */
        function initQuestionRecords (questions) {
            let course = UserService.getCurrentCourse();

            let questionRecords = {};
            for (let question of questions) {
                let questionRecord = ClassAnswerService.createDefaultQuestion();
                questionRecord.course = course._id;
                questionRecord.rate   = question.cRate;
                questionRecord.pRate  = question.pRate;
                questionRecord.answer = question.options || [];
                questionRecords[question.number] = questionRecord;
            }

            _questionRecords = questionRecords;
            return _questionRecords;
        }

        /**
         * @desc 更新问题记录
         * @param questions
         * @returns {{}}
         */
        function updateQuestionRecords (questions) {
            let course = UserService.getCurrentCourse();

            let questionRecords = {};
            for (let question of questions) {
                let qNumber = question.number;
                let questionRecord = _questionRecords[qNumber];
                questionRecord.course = course._id;
                questionRecord.rate   = question.cRate;
                questionRecord.pRate  = question.pRate;
                questionRecord.answer = question.options || [];
            }
            return _questionRecords;
        }

        /**
         * @desc 初始化学生对于问题回答的记录
         * @param questions
         * @param questionRecords
         * @returns {{}}
         */
        function initStudentAnswerRecords (questions, questionRecords) {
            return updateStudentAnswerRecords(questions, questionRecords);
        }

        /**
         * @desc 更新对于问题回答的记录
         * @param questions
         * @param questionRecords
         * @returns {{}}
         */
        function updateStudentAnswerRecords (questions, questionRecords) {
            for (let question of questions) {
                let qNumber = question.number;
                let records = _studentAnswerRecords[qNumber] || {};

                let answer = getQuestionAnswer(question);

                let students = getDetailPageStudentsByQuestion(question);
                for (let stu of students) {
                    let record = records[stu._id] || ClassAnswerService.createDefaultRecord();

                    record.student = stu._id;

                    record.question = questionRecords[qNumber]._id;

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

                    record.answer = opt || [];
                    records[stu._id] = record;
                }
                _studentAnswerRecords[question.number] = records;
            }
            return _studentAnswerRecords;
        }

        function close () {
            saveRecords();

            reset();
        }

        /**
         * @desc 通过问题，获取问题的类型
         * @param question
         * @returns {*}
         */
        function getQuestionType (question) {
            let number = question.number;
            let answer = _answers[number] || [];

            if (answer.join("") === "$" || answer.join("") === "^") {
                return TRUE_FALSE_QUESTION;
            }
            return SELECTION_QUESTION;
        }

        /**
         * @desc 根据问题的题号获取指定的问题
         * @param qNumber
         * @returns {*}
         */
        function getQuestionByQuestionNumber (qNumber) {
            let question = null;
            for (let tmpQuestion of _questions) {
                if (qNumber === tmpQuestion.number) {
                    question = tmpQuestion;
                    break;
                }
            }
            return question;
        };

        function openQuestionAnswerSetDialog (question) {
            MultipleQuestionAnswerSetModel.reset();
            MultipleQuestionAnswerSetModel.setQuestionNumber(question.number);
            MultipleQuestionAnswerSetModel.setAnswer(getQuestionAnswer(question) || []);
            $uibModal.open({
                animation:true,
                openedClass: "xy-multiple-question-answer-set-dialog",
                templateUrl:'view/multiple_question_result/multiple_question_answer_set_dialog/multiple_question_answer_set_dialog.html',
                size:'sm',
                controller:'MultipleQuestionAnswerSetDialogCtrl'
            });
        }

        /**
         * @desc 更新问题的正确答案
         * @param data
         */
        function updateCorrectAnswer (data) {
            let options = data.opt;
            let qNumber = data.number;

            let answers = _answers || {};
                answers[qNumber] = options;
            _answers = answers;

            let questions       = updateQuestions(_qCount, _answers, _students);
            let questionRecords = updateQuestionRecords(questions);
            updateStudentAnswerRecords(questions, questionRecords);
        }

        /**
         * @desc 设置问题的id
         * @param question
         * @param id
         */
        function setQuestionId (question, id) {
            let questions = _questions;
            for (let tmpQuestion of _questions) {
                if (question.number === tmpQuestion.number) {
                    tmpQuestion._id = id;
                    break;
                }
            }
        }

        /**
         * @desc 判断问题是否设置了答案
         * @param question
         * @returns {boolean}
         */
        function isQuestionHasAnswer (question) {
            let answer = getQuestionAnswer(question);
            return answer != null && answer.length > 0;
        }

        /**
         * @desc 保存问题记录
         */
        function saveRecords () {

            let questions            = _questions;
            let questionRecords      = _questionRecords;
            let studentAnswerRecords = _studentAnswerRecords;

            let datas = [];

            let save = false;
            for (let i = questions.length - 1; i >= 0; --i) {
                let question = questions[i];
                let qNumber = question.number;
                let questionRecord = angular.copy(questionRecords[qNumber]);
                questionRecord.answer = (questionRecord.answer || []).join("");

                let answerRecords    = angular.copy(studentAnswerRecords[qNumber]);
                let answerRecordsArr = [];

                let recordKeys = Object.keys(answerRecords);
                for (let key of recordKeys) {
                    let record = answerRecords[key];
                    record.answer = (record.answer || []).join("");
                    answerRecordsArr.push(record);
                }

                if (!save) {
                    if (!!questionRecord.answer) {
                        save = true;
                    } else {
                        for (let answerRecord of answerRecordsArr) {
                            if (!!answerRecord.answer) {
                                save = true;
                                break;
                            }
                        }
                    }
                }

                if (save) {
                    datas.push({
                        question: questionRecord,
                        records: answerRecordsArr,
                    });
                }
            }

            // 这里反转数据，为的是用来保存问题的顺序
            datas.reverse();

            DataService.addOrUpdateQuestions(datas).then(()=>{
                console.log("addOrUpdateQuestions: success");
            }).catch(err=>{
                console.error(err);
            });

        }

        /**
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question-result .xy-multiple-question-result-table");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table到头
         */
        function scrollTableToTop () {
            let innerWrapper = document.querySelector(".xy-multiple-question-result .xy-multiple-question-result-table");
            innerWrapper.scrollTop = 0;
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question-result .xy-multiple-question-result-table");
            let tableHeader = document.querySelector(".xy-multiple-question-result-info-header");

            let offset = innerWrapper.scrollTop;

            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-multiple-question-result .xy-multiple-question-result-table");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
        }
    }]
);