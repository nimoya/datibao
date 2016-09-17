/**
* @ignore  =====================================================================================
* @fileoverview 随机选人服务
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/20
* @ignore  depend 
* @ignore  =====================================================================================
*/
angular.module('DTB').service('RandomSelectService',[
    'UserService',
    'QuestionOptionService',
    'StationService',

    function (
            UserService,
            QuestionOptionService,
            StationService
        ) {

        //答题的成员
        let _members=[];

        //当前的问题
        let _question={};

        this.reset = function () {
            _members  = [];
            _question = {};
        };

        this.setMembers = function (members) {
            members = angular.copy(members);
            for (let i=0, len = members.length; i < len; i++){
                members[i].index=i+1;
            }
            _members = members;
        };


        this.getMembers=function () {
            return _members;
        };

        /**
         * 开始新一轮答题
         * @param cb
         */
        this.startAnswer=function () {
            this.reset();
            StationService.resetDeviceMode();
        };

        /**
         * 获得答题数据和选项之间的对应关系
         */
        this.getOptionMap=function () {
            //TODO:当前题型只支持单选
            let map=QuestionOptionService.getRadioOptions();
            return map;
        };
        
    }]);
