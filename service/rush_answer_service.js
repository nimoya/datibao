/**
* @ignore  =====================================================================================
* @fileoverview 抢答的服务
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/18
* @ignore  depend
* @ignore  =====================================================================================
*/
angular.module('DTB')
    .service('RushAnswerService',['UserService','QuestionOptionService','StationService',
    function (UserService,QuestionOptionService,StationService) {


        //当前的问题
        let _question={};

        //当前的成员
        let _members=[];

        //当前课程的总学生
        let _classmates=[];

        this.setMembers = function (_mem) {
            _members=_mem;
            for (let i = 0, len = _members.length; i < len; ++i) {
                 _members[i].sIndex = i + 1;
            }
        };


        this.getMembers=function () {
            return _members;
        };

        this.reset = function () {
            _question={};
            
            _members=[];
        };

        /**
         * 开始新一轮答题
         */
        this.startAnswer=function () {
            //问题置空
            this.reset();
            StationService.resetDeviceMode();
        };

        /**
         * 接收到答题数据
         * @param data
         */
        this.updateStudentAnswer=function (data) {
            let cardId = data.cardId;
            let opt = data.opt;

            for (let classmate of members){
                if(classmate.cardId==cardId){
                    if(classmate.isAnswered){
                        //如果该同学已经回答,则更新选项
                        for(let member of _members){
                            member.opt=opt;
                        }
                    }else{
                        //没有回答过,加入成员中
                        _members.push(classmate);
                        classmate.isAnswered=true;
                    }
                    
                    return;
                }
            }
            cb&&cb(APP_ALERT.is_not_member);
        };
    }]);
