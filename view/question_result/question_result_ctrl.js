/**
 * @ignore  =====================================================================================
 * @fileoverview
 * @author  周靖人
 * @version 0.1.0
 * @ignore  created in 2016/8/8
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").controller('QuestionResultCtrl',[
    '$scope',
    '$q',
    '$timeout',
    'WindowService',
    'TeacherCardService',
    'UserService',
    'StationService',
    'RecordService',
    'Timer',
    'DataService',
    'QuestionResultModel',

    function (
        $scope,
        $q,
        $timeout,
        WindowService,
        TeacherCardService,
        UserService,
        StationService,
        RecordService,
        Timer,
        DataService,
        QuestionResultModel
    ) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            $timeout(function(){
                nw.Window.get().show();
            });
        });


        function init(){
                $scope.loadingQuestionShow=true;
                document.getElementById('questionPicture').src="";
                $scope.showPicture=true;
                $scope.curtCourse = QuestionResultModel.getCourse();
                $scope.questionIndex=QuestionResultModel.getTheQuestionINdex();
                $scope.question=QuestionResultModel.getTheQuestion();
                $scope.showNumber=QuestionResultModel.getTheNumber();
                $scope.showDate=Timer.translateDateString(parseInt($scope.question.createTime));
                if($scope.question.answer=='$') {
                    $scope.showAnswer = '√';
                }
                else if($scope.question.answer=='^'){
                    $scope.showAnswer='×';
                }
                else{
                    $scope.showAnswer=$scope.question.answer;
                }
               $scope.students=QuestionResultModel.getTheStudents();
                $scope.studentsLen=$scope.students.length;
                if($scope.question.file) {
                    document.getElementById('questionPicture').src = $scope.question.file;
                }
                else{
                    $scope.showPicture=false;
                }
                //对同学们的答案进行归类
                var isInCollection;
                var notChooseName='';
                var notChooseNum=0;
                var notChoose;
                $scope.studentsByAnswer=[];
                $scope.studentsByAnswer.push({answer:"",names:notChooseName,
                    studentNum:notChooseNum,
                    students:[]
                });
                for(let i=0;i<$scope.students.length;i++){
                    notChoose=false;
                    isInCollection=false;
                    for(let j=0;j<$scope.studentsByAnswer.length;j++){
                        //如果该答案在已有的类别中
                        if($scope.students[i].records[$scope.questionIndex]&&$scope.students[i].records[$scope.questionIndex].answer==$scope.studentsByAnswer[j].answer){
                            $scope.studentsByAnswer[j].studentNum++;
                            $scope.studentsByAnswer[j].students.push($scope.students[i]);
                            if($scope.studentsByAnswer[j].names) {
                                $scope.studentsByAnswer[j].names = $scope.studentsByAnswer[j].names
                                    + '、' + $scope.students[i].name;
                            }
                            else{
                                $scope.studentsByAnswer[j].names =$scope.students[i].name;
                            }
                            isInCollection=true;
                            break;
                        }
                    }
                    if(isInCollection==false){
                        if($scope.students[i].records[$scope.questionIndex]) {
                            $scope.studentsByAnswer.push({
                                    answer: $scope.students[i].records[$scope.questionIndex].answer,
                                    studentNum: 1, names: $scope.students[i].name,
                                students:[$scope.students[i]]
                                }
                            );
                        }
                        else{
                            $scope.studentsByAnswer[0].students.push($scope.students[i]);
                            $scope.studentsByAnswer[0].studentNum++;
                            if($scope.studentsByAnswer[0].names) {
                                $scope.studentsByAnswer[0].names = $scope.studentsByAnswer[0].names
                                    + '、' + $scope.students[i].name;
                            }
                            else{
                                $scope.studentsByAnswer[0].names =$scope.students[i].name;
                            }
                        }
                    }
                }
                for(let i=0;i<$scope.studentsByAnswer.length;i++){
                    if(!$scope.studentsByAnswer[i].answer){
                        $scope.studentsByAnswer[i].answer='未选择';
                        $scope.studentsByAnswer[i].order=100;
                    }
                    if($scope.studentsByAnswer[i].answer=='$'){
                        $scope.studentsByAnswer[i].showAnswer='√';
                        $scope.studentsByAnswer[i].order=99;
                    }
                    else if($scope.studentsByAnswer[i].answer=='^'){
                        $scope.studentsByAnswer[i].showAnswer='×';
                        $scope.studentsByAnswer[i].order=98;
                    }
                    else{
                        $scope.studentsByAnswer[i].showAnswer=$scope.studentsByAnswer[i].answer;
                        $scope.studentsByAnswer[i].order=$scope.studentsByAnswer[i].answer.charCodeAt(0)-65;
                    }
                }
                 let temp;
                temp=$scope.studentsByAnswer[$scope.studentsByAnswer.length-1];
                $scope.studentsByAnswer[$scope.studentsByAnswer.length-1]=$scope.studentsByAnswer[0];
                $scope.studentsByAnswer[0]=temp;
                if($scope.studentsByAnswer[$scope.studentsByAnswer.length-1].names==''){
                    $scope.studentsByAnswer.pop();
                }
                $scope.studentsByAnswer.sort(function (stu1,stu2){
                     return stu1.order-stu2.order;
                } );

                $scope.loadingQuestionShow=false;
        }
    }]
);