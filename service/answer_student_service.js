/**
 * @ignore  =====================================================================================
 * @file answer student 的model
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/6/28
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module("DTB").service("AnswerStudentService", [function() {
    let model = {
        students: [],
        title: "",
        canAnswer: false,
    };

    this.setStudents = function (students) {
    	model.students = students;
    };

    this.getStudents = function () {
    	return model.students;
    };

    this.setTitle = function (title) {
    	model.title = title;
    };

    this.getTitle = function () {
    	return model.title;
    };

    this.getStudentByIndex = function (index){
        return model.students[index];
    };

    this.isCanAnswer = function () {
        return model.canAnswer ||  false;
    };

    this.setCanAnswer = function (canAnswer) {
        model.canAnswer = canAnswer;
    };

    this.reset = function () {
        model = {
            students: [],
            title: "",
            canAnswer: true
        };
    };
}]);
