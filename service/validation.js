/**
 * @ignore  =====================================================================================
 * @fileoverview ��֤��Ϣ�Ϸ��Եķ���
 * @author  �ܾ���
 * @version 0.1.0
 * @ignore  created in 2016/8/19
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module('DTB').service('ValidationService',[
    function () {
        /**
         * @desc �ж��û����Ƿ�Ϸ�
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
         * @desc �жϿ����Ƿ�Ϸ�
         * @param cardId
         * @returns {boolean}
         */
        this.checkCardId =function(cardId) {
            return /^[0-9a-f]{8}$/.test(cardId) || cardId == null || cardId === "";
        };

        /**
         * @desc �ж��û���ѧ���ǹ��Ϸ�
         * @param sNumber
         * @returns {boolean}
         */
        this.checkStudentSNumber=function(sNumber) {
            return /^[0-9a-zA-Z]*$/.test(sNumber) || sNumber == null || sNumber === "";
        };

        /**
         * @desc �ж��ֻ������Ƿ�Ϸ�
         * @param phone
         * @returns {boolean}
         */
        this.checkStudentPhone=function(phone) {
            return /^[0-9]{11}$/.test(phone) || phone == null || phone === "";
        };

        /**
         * @desc �жϿγ����Ƿ�Ϸ�
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
         * @desc �����ʦ���Ƿ�Ϸ�
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
         * @desc ����ʦ���Ƿ�Ϸ�
         * @param cardId
         * @returns {boolean}
         */
        this.checkTeacherCardId=function(cardId) {
             return /^[0-9a-f]{8}$/.test(cardId) || cardId == null || cardId === "";
        }
    }
    ]);