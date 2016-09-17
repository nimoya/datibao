/**
 * @ignore  =====================================================================================
 * @file 多题作答的model
 * @author 王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/20
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('MultipleQuestionModel',[
    function () {
        let _answers = {};
        let _students  = [];
        let _questionCount = 0;

        this.reset = function () {
            _answers  = [];
            _students = [];

            _questionCount = 0;
        };

        this.setQuestionCount = function (count) {
            _questionCount = count;
        };

        this.getQuestionCount = function () {
            return _questionCount;
        };


        this.setStudents = function (students) {
            _students = angular.copy(students || []);
        };

        this.getStudents = function () {
            return angular.copy(_students || []);
        };

        this.setAnswers = function (answers) {
            _answers = angular.copy(answers || []);
        };

        this.getAnswers = function () {
            return angular.copy(_answers || []);
        };
    }]
);
