/**
* @ignore  =====================================================================================
* @fileoverview 创建班级的控制器
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/14
* @ignore  depend
* @ignore  =====================================================================================
*/
angular.module('DTB').controller('CreateClassCtrl',[
    '$scope',
    'ValidationService',
    '$rootScope',
    '$uibModalInstance',
    'CreateClassDialogModel',

    function (
            $scope,
            ValidationService,
            $rootScope,
            $uibModalInstance,
            CreateClassDialogModel) {

        $scope.newCourseName='';
        $scope.errMsg='';
        $scope.ok = function () {
            let courseName = $scope.newCourseName.trim();
            if (courseName === "") {
                $scope.errMsg = "课程名不能为空";
                return;
            }

             if (!ValidationService.checkCourseName(courseName)) {
                $scope.errMsg = "课程名不能包含以下字符: \\ / : * ? : < > |";
                return;
            }
            
            let isExist = CreateClassDialogModel.isCourseExistByCourseName(courseName);
            if (isExist) {
                $scope.errMsg = "该课程已经存在";
                return;
            }

            $rootScope.$emit(APP_EVENTS.onCourseCreated, $scope.newCourseName);
            $uibModalInstance.dismiss('cancel');
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
}]);
