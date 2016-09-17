/**
 * Created by 11433 on 2016/6/16.
 */
angular.module('DTB').directive('xyId',['$rootScope','WindowService',
function ($rootScope,WindowService) {
    return{
        link:function (scope,ele,attrs) {
            scope.windowName=attrs.xyId;
            $rootScope.$on(APP_EVENTS.onWindowOpened,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowOpened);

                }
            });
            $rootScope.$on(APP_EVENTS.onWindowBacked,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowBacked);
                }
            });
            $rootScope.$on(APP_EVENTS.onWindowClosed,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowClosed);
                }
            });
            $rootScope.$on(APP_EVENTS.onWindowLeaved,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowLeaved);
                }
            });

            $rootScope.$on(APP_EVENTS.onWindowExpand,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowExpand);
                }
            });

            $rootScope.$on(APP_EVENTS.onWindowFold,(event, windowName)=>{
                if(windowName==attrs.xyId){
                    scope.$emit(APP_EVENTS.onWindowFold);
                }
            });
            
            $rootScope.$on(APP_EVENTS.onTeacherCommanded,(event,op)=>{

                let currentWin=op.target;
                let data=op.data;
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onTeacherCommanded,data);

                }
            });

            $rootScope.$on(APP_EVENTS.onQuestionAnswerSet,(event,opt)=>{

                let currentWin = opt.target;
                let data = opt.data;
                if(currentWin == attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onQuestionAnswerSet,data);

                }
            })

            $rootScope.$on(APP_EVENTS.onStudentAnswered,(event,op)=>{

                let currentWin=op.target;
                let data=op.data;
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onStudentAnswered,data);

                }
            });

            $rootScope.$on(APP_EVENTS.onStudentBind, (event, op) => {
                let currentWin=op.target;
                let data=op.data;
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onStudentBind,data);
                }
            });

            $rootScope.$on(APP_EVENTS.onCourseStudentsReplaced,(event,opt)=>{
                let currentWin=opt.target;
                let data=opt.data;
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onCourseStudentsReplaced,data);
                }
            });

            $rootScope.$on(APP_EVENTS.onRCDCommanded, (event, opt)=>{
                let currentWin = opt.target;
                let command = opt.command;
                
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onRCDCommanded, command);
                }
            });

            $rootScope.$on(APP_EVENTS.onPrompt,(event,op)=>{
                let currentWin = op.target;
                let message = op.message;
                if(currentWin==attrs.xyId){
                    //向指定window分发事件
                    scope.$emit(APP_EVENTS.onPrompt, message);
                }
            });

        }

    }
}])