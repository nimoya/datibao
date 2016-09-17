/**
* @ignore  =====================================================================================
* @fileoverview 提供题目选项
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/20
* @ignore  depend
* @ignore  =====================================================================================
*/
angular.module('DTB')
    .service('QuestionOptionService',[
        function () {

            /**
             * 获得单选题按键值和答案之间的对应关系
             * @returns {{1: string, 2: string, 8: string, 16: string}}
             */
            this.getRadioOptions=function () {
                return {
                    '1':'A',
                    '2':'B',
                    '8':'C',
                    '16':'D'
                }
            }
        }]);
