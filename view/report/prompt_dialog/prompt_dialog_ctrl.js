/**
 * @ignore  =====================================================================================
 * @fileoverview report信息提示对话框的controller
 * @author  沈奥林
 * @version 0.1.0
 * @ignore  created in 2016/6/14
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').controller('ReportPromptDialog',[
    '$scope',
    '$uibModalInstance',
    'ReportPromptDialogModel',

    function (
        $scope,
        $uibModalInstance,
        ReportPromptDialogModel) {

        $scope.message = ReportPromptDialogModel.getMessage();

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }])
