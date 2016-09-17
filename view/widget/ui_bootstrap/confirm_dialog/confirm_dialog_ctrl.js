/**
 * @ignore  =====================================================================================
 * @fileoverview 创建班级的控制器
 * @author  沈奥林
 * @version 0.1.0
 * @ignore  created in 2016/6/14
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').controller('ConfirmDialogCtrl',[
    '$scope',
    '$uibModalInstance',
    'ConfirmDialogModel',

    function (
        $scope,
        $uibModalInstance,
        ConfirmDialogModel) {

        $scope.message = ConfirmDialogModel.getMessage();

        $scope.ok = function () {
            $uibModalInstance.close(true);
        };

        $scope.cancel = function () {
            $uibModalInstance.close(false);
        };
    }])
