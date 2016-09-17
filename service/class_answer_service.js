/**
* @ignore  =====================================================================================
* @fileoverview 全班作答的服务
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/18
* @ignore  depend
* @ignore  =====================================================================================
*/
angular.module('DTB').service('ClassAnswerService',[
    'Uuid',
    'UserService',
    'QuestionTable',
    'DataService',

    function (
            Uuid,
            UserService,
            QuestionTable,
            DataService) {

        let self=this;

        let _isNeedToSaveQuestion = false;

        //答题的成员
        let _members=[];

        // 对于当前问题，学生回答的记录
        let _records = [];

        let _validOptions = [];
        
        //当前的问题
        let _question = createDefaultQuestion();

        function createDefaultQuestion () {
            return {
                _id: Uuid.v4(),
                file: "",
                answer: [],
                course: null,
                createTime: Date.now(),
                rate: 0,
                pRate: 0,
            };
        }

        this.setIsNeedToSaveQuestion = function (isNeed) {
            _isNeedToSaveQuestion = isNeed;
        };

        this.getIsNeedToSaveQuestion = function () {
            return _isNeedToSaveQuestion;
        };

        this.createDefaultQuestion = function () {
            return createDefaultQuestion();
        };

        this.createDefaultRecord = function () {
            return {
                _id: Uuid.v4(),
                answer: [],
                answerTime: Date.now(),
                question: null,
                student: null,
                isRight: -1,
            };
        };

        this.reset = function () {
            _isNeedToSaveQuestion = false;
            
            _members = [];

            _records = [];

            _question = createDefaultQuestion();

            _validOptions = [];
        };

        this.setValidOptions = function (options) {
            _validOptions = options || [];
        };

        this.getValidOptions = function () {
            return _validOptions || [];
        };

        this.setQuestionNumber = function (number) {
            _question.number = number;
        };

        this.getQuestionNumber = function () {
            return _question.number;
        };

        this.setMembers=function (_mem) {
            _members=_mem || [];

            for (let i = 0, len = _members.length; i < len; ++i) {
                let mem = _members[i];
                mem.sIndex = i + 1;
            }
        };

        this.getMembers=function () {
            return _members || [];
        };

        this.setQuestion = function (q) {
            _question = angular.copy(q || createDefaultQuestion());
        };

        this.getQuestion = function () {
            return _question;
        }

        this.setCourse = function (course) {
            _question.course = course._id;
        }

        /**
         * 设置正确答案
         * @param answer
         */
        this.setAnswer=function (answer) {
            _question.answer = answer;
        };

        this.getSelectedOptions = function () {
            let optionsSet = {};
            let members = _members;
            for (let member of members) {
                let tmpOptions = member.opt || [];
                for (let option of tmpOptions) {
                    optionsSet[option] = true;
                }
            }

            let options = Object.keys(optionsSet);
            return options.sort();
        };
        
        this.getAnswer=function () {
            return _question.answer;
        };

        this.setFile = function (file) {
            _question.file = file || "";
        };

        this.getFile = function () {
            return _question.file;
        };

        // this.setQuestionCorrectRate = function (rate) {
        //     _question.rate = rate;
        // };
        //
        this.getQuestionCorrectRate = function () {
            return calculateCRate(_members, _question.answer);
        };
        //
        // this.setQuestionParticipationRate = function (rate) {
        //     _question.pRate = rate;
        // };
        //
        this.getQuestionParticipationRate = function () {
            return calculatePRate(_members);
        };

        this.setRecords = function (records) {
            _records = angular.copy(records);
        };

        this.getRecords = function () {
            return _records;
        };


        /**
         * 开始新一轮答题
         * @param cb
         */
        this.startAnswer=function () {
            this.reset();
        };

        /**
         * 更改学生选择的答案
         * @param data
         */
        this.updateMemberAnswer=function (data) {
            let cardId  = data.cardId;
            let options = data.opt;
            
            for (let member of _members){
                if(member.cardId == cardId){
                    member.opt = options;
                }
            }
            return {
                success: true
            };
        };

        /**
         * 储存问题
         */
        this.saveQuestion=function () {
            let cpQuestion = angular.copy(_question);
            cpQuestion.answer = (cpQuestion.answer || []).join("");
            cpQuestion.rate  = calculateCRate(_members, _question.answer) + "";
            cpQuestion.pRate = calculatePRate(_members) + "";

            return DataService.addOrUpdateQuestion(cpQuestion, _records);
        };
        
        this.isMemberExist = function (member) {
            for (let tmpMem of _members) {
                if (member.cardId === tmpMem.cardId) {
                    return true;
                }
            }
            return false;
        };

        this.addMember = function (member) {
            member.sIndex = _members.length + 1;
            _members.push(member);
        };

        /**
         *@desc 获取已经回答了问题的的学生
         */
        this.getAnsweredMembers = function () {
            let members = [];

            for (let member of _members) {
                if (!!member.opt && member.opt.length > 0) {
                    members.push(member);
                }
            }

            return members;
        };

        /**
         *@desc 获取没有回答问题的学生
         *@return {Array}
         */
        this.getUnAnsweredMembers = function () {
            let members = [];

            for (let member of _members) {
                if (!member.opt || member.opt.length <= 0) {
                    members.push(member);
                }
            }

            return members;
        };

        /**
         * @desc 获取选择了不合法选项的人
         * @returns {Array}
         */
        this.getAnswerInvalidMembers = function () {
            let members = [];

            let validOptions = _validOptions || [];
            for (let member of _members) {
                let options = member.opt || [];
                if (options.length > 0) {
                    let isValid = true;
                    for (let option of options) {
                        if (validOptions.indexOf(option) < 0) {
                            isValid = false;
                            break;
                        }
                    }
                    isValid || members.push(member);
                }
            }

            return members;
        };


        /**
         *@desc 获取选取了指定选项的学生
         *@param options {int} 选项
         *@return {Array}
         */
        this.getMembersByOptions = function (options) {
            options = options || [];

            let members = [];

            for (let member of _members) {
                let tmpOption = member.opt || [];
                if(tmpOption.join("") === options.join("")) {
                    members.push(member);
                }
            }

            return members;
        };

        this.getMembersByOption = function (option) {
            let members = [];

            for (let member of _members) {
                let options = member.opt || [];
                if (options.indexOf(option) >= 0) {
                    members.push(member);
                }
            }
            return members;
        };

        /**
         *@desc 获取指定属相sIndex的学生
         */
        this.getMemberBySIndex = function (sIndex) {
            for (let member of _members) {
                if (member.sIndex === sIndex) {
                    return member;
                }
            }
            return null;
        };

        function calculatePRate (members) {
            if (!members || members.length <= 0) {
                return 0;
            }

            let pMembers = [];
            for (let member of members) {
                if (member.opt && member.opt.length > 0) {
                    pMembers.push(member);
                }
            }

            return pMembers.length / members.length;
        }

        function calculateCRate (members, answer) {
            if (!answer || answer.length <= 0) {
                return 0;
            }

            let pMembers = [];
            let cMembers = [];

            for (let member of members) {
                if (member.opt && member.opt.length > 0) {
                    pMembers.push(member);

                    if (answer.join("") === member.opt.join("")) {
                        cMembers.push(member);
                    }
                }
            }

            if (pMembers.length <= 0) {
                return 0;
            }

            return cMembers.length / pMembers.length;
        }


    }]
);
