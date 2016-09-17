/**
 * 学生回答问题记录的service
 * Created by 王磊 on 2016/7/4.
 */
angular.module('DTB').service('RecordService',[
    '$q',
    'RecordTable',
    'QuestionTable',
    'StudentTable',

    function(
        $q,
        RecordTable,
        QuestionTable,
        StudentTable){

        let uuid = require("node-uuid");

        this.createDefaultRecord = function (){
            return {
                _id: uuid.v4(),
                answer: "",
                answerTime: Date.now(),
                question: null,
                student: null,
                isRight: -1,
            };
        };

        this.saveRecord = function (record) {
            return RecordTable.addRecord(record);
        };

        /**
         * @desc 获取指定班级某日的问题
         * @param course
         * @param date
         */
        this.fetchQuestionsByCourseAndDate = function (course, date) {
            return QuestionTable.getQuestionsByCourseAndDate(course, date);
        };

        /**
         * @desc 获取指定question的record
         * @param question
         * @returns {$q|*}
         */
        this.fetchRecordsByQuestion = function (question) {
            return RecordTable.getRecordsByQuestion(question);
        };

        /**
         * @desc 通过questions获取记录
         * @param questions
         * @returns {$q|*}，resolve的时候获取的结果是一个二维数组，二维数组的数据对应传过来的questions数组
         */
        this.fetchRecordsListByQuestions = function (questions) {
            return RecordTable.getRecordsListByQuestions(questions);
        };

        /**
         * @desc 通过questions获取指定学生的问题记录
         * @param student
         * @param questions
         * @returns {$q|*}
         */
        this.fetchRecordsByStudentAndQuestions = function(student, question) {
            return RecordTable.getRecordsByStudentAndQuestions(student, question);
        };

        /**
         * @desc 通过record获取对应的学生
         * @param records
         * @returns {$q|*}
         */
        this.fetchStudentsByRecords = function (records) {
            let studentIds = [];
            for (let record of (records || [])) {
                studentIds.push(record.student);
            }

            return StudentTable.getStudentsByIds(studentIds);
        };

        /**
         * @desc 通过record获取学生
         * @param recordsList,一个二维数组，每一个元素都是一个record数组
         * @returns {$q|*} resolve的结果是一个学生的二维数组，对应参数recordsList
         */
        this.fetchStudentsListByRecordsList = function (recordsList) {
            let idsList = [];
            for (let records of recordsList) {
                let ids = [];
                for (let record of records) {
                    ids.push(record.student);
                }
                idsList.push(ids);
            }
            return StudentTable.getStudentsListByIdsList(idsList);
        };
    }]
);