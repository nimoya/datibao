/**
 * @ignore  =====================================================================================
 * @fileoverview 导入班级询问对话框的控制器
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/3
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').controller('ImportClassDialogCtrl',[
    '$scope',
    '$rootScope',
    '$q',
    '$uibModalInstance',
    'WindowService',
    'ImportClassDialogModel',

    function (
        $scope,
        $rootScope,
        $q,
        $uibModalInstance,
        WindowService,
        ImportClassDialogModel) {

        $scope.cancel = function () {
            ImportClassDialogModel.reset();
            $uibModalInstance.dismiss('cancel');
        };

        $scope.ok = function () {
            let course = ImportClassDialogModel.getCourse();
            if (course == null) {
                console.error("导入课程发生错误");
                return;
            }

            let windowName = WindowService.getCurrentWindow().name;
            $rootScope.$emit(APP_EVENTS.onCourseStudentsReplaced, {
                target: windowName,
                data: course,
            });
            $uibModalInstance.dismiss('cancel');
        };
    }])
