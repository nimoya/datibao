/**
 * @ignore  =====================================================================================
 * @file 多题作答的model
 * @author 王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/20
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('MultipleQuestionAnswerSetModel',[
    function () {
        let _qNumber = 0;

        let _answer = [];

        this.reset = function () {
            _qNumber = 0;
        };

        this.setQuestionNumber = function (number) {
            _qNumber = number;
        };

        this.getQuestionNumber = function () {
            return _qNumber;
        };

        this.setAnswer = function (answer) {
            _answer = answer;
        };

        this.getAnswer = function () {
            return _answer;
        };
    }]
);
