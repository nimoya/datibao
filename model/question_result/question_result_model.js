/**
 * @ignore  =====================================================================================
 * @file ��Ŀ���������model
 * @author �ܾ���
 * @version 0.1.0
 * @ignore  created in 2016/8/8
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('QuestionResultModel',[
    function(){
        let theCourse = {};
        let theQuestion={};
        let theStudents={};
        let theNumber=0;
        let theQuestionIndex=0;

        this.reset=function(){
            theCourse = {};
            theQuestion={};
            theStudents={};
            theNumber=0;
            theQuestionIndex=0;
        };

        this.setCourse = function (course) {
            theCourse = course;
        };

        this.getCourse = function () {
            return theCourse;
        };
        
        this.setTheQuestion=function (question) {
            theQuestion=question;
        };
        this.getTheQuestion=function () {
            return theQuestion;
        };
        this.setTheStudents=function(students){
            theStudents=students;
        };
        this.getTheStudents=function(){
            return theStudents;
        };
        this.setTheNumber=function(x){
          theNumber=x;  
        };
        this.getTheNumber=function(){
          return theNumber;  
        };
        this.setTheQuestionIndex=function(x){
          theQuestionIndex=x;            
        };
        this.getTheQuestionINdex=function(){
            return theQuestionIndex;
        }
    }]
);