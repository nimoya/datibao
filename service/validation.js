/**
 * @ignore  =====================================================================================
 * @fileoverview 验证信息合法性的服务
 * @author  周靖人
 * @version 0.1.0
 * @ignore  created in 2016/8/19
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module('DTB').service('ValidationService',[
    function () {
        /**
         * @desc 判断用户名是否合法
         * @param name
         * @returns {boolean}
         */
        this.checkStudentName=function (name) {
             for(let i=0;i<name.length;i++){
                if(name[i]=='/'||name[i]=='\\'||name[i]==':'
                ||name[i]=='*'||name[i]=='?'||name[i]=='"'
                ||name[i]=='>'||name[i]=='<'||name[i]=='|')
                {
                    return false;
                }
            }
            return name !== "" && name != null;
        };
        
        /**
         * @desc 判断卡号是否合法
         * @param cardId
         * @returns {boolean}
         */
        this.checkCardId =function(cardId) {
            return /^[0-9a-f]{8}$/.test(cardId) || cardId == null || cardId === "";
        };

        /**
         * @desc 判断用户的学号是够合法
         * @param sNumber
         * @returns {boolean}
         */
        this.checkStudentSNumber=function(sNumber) {
            return /^[0-9a-zA-Z]*$/.test(sNumber) || sNumber == null || sNumber === "";
        };

        /**
         * @desc 判断手机号码是否合法
         * @param phone
         * @returns {boolean}
         */
        this.checkStudentPhone=function(phone) {
            return /^[0-9]{11}$/.test(phone) || phone == null || phone === "";
        };

        /**
         * @desc 判断课程名是否合法
         * @param name
         * @returns {boolean}
         */
         this.checkCourseName=function (name) {
             for(let i=0;i<name.length;i++){
                 if(name[i]=='/'||name[i]=='\\'||name[i]==':'
                     ||name[i]=='*'||name[i]=='?'||name[i]=='"'
                     ||name[i]=='>'||name[i]=='<'||name[i]=='|')
                 {
                     return false;
                 }
             }
             return name !== "" && name != null;
        };
        /**
         * @desc 检测老师名是否合法
         * @param name
         * @returns {boolean}
         */
        this.checkTeacherName=function(name) {
            for(let i=0;i<name.length;i++){
                if(name[i]=='/'||name[i]=='\\'||name[i]==':'
                    ||name[i]=='*'||name[i]=='?'||name[i]=='"'
                    ||name[i]=='>'||name[i]=='<'||name[i]=='|')
                {
                    return false;
                }
            }
            return name !== "" && name != null;
        };

        /**
         * @desc 检测教师卡是否合法
         * @param cardId
         * @returns {boolean}
         */
        this.checkTeacherCardId=function(cardId) {
             return /^[0-9a-f]{8}$/.test(cardId) || cardId == null || cardId === "";
        }
    }
    ]);