/**
 * @ignore  =====================================================================================
 * @fileoverview 定义xyLogin标签
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module("DTB").controller('MultipleQuestionAnswerSetDialogCtrl',[
    '$rootScope',
    '$scope',
    '$uibModalInstance',
    'StudentCardService',
    'MultipleQuestionAnswerSetModel',

    function (
        $rootScope,
        $scope,
        $uibModalInstance,
        StudentCardService,
        MultipleQuestionAnswerSetModel
    ) {

        let originAnswer = MultipleQuestionAnswerSetModel.getAnswer() || [];
        $scope.multipleSelectOptions = StudentCardService.getSelectOptions();

        $scope.multipleSelect = {};
        for (let option of $scope.multipleSelectOptions) {
            $scope.multipleSelect[option] = !!(originAnswer.indexOf(option) >= 0);
        }

        $scope.trueOrFalseSelect = null;
        if (originAnswer.join("") === "^" || originAnswer.join("") === "$") {
            $scope.trueOrFalseSelect = originAnswer.join("");
        }

        $scope.clearMultipleSelect = function () {
            for (let option of $scope.multipleSelectOptions) {
                $scope.multipleSelect[option] = false;
            }
        };

        $scope.clearTrueOrFalseSelect = function () {
            $scope.trueOrFalseSelect = null;
        };


        $scope.isOkBtnEnable = function () {
            if ($scope.trueOrFalseSelect != null) {
                return true;
            }

            for (let option of $scope.multipleSelectOptions) {
               if ($scope.multipleSelect[option]) {
                   return true;
               }
            }

            return false;

        };

        $scope.ok = function () {
            let options = [];
            if ($scope.trueOrFalseSelect != null) {
                options.push($scope.trueOrFalseSelect);
            } else {
                for (let option of $scope.multipleSelectOptions) {
                    if ($scope.multipleSelect[option]) {
                        options.push(option);
                    }
                }
            }
            $rootScope.$emit(APP_EVENTS.onQuestionAnswerSet, {
                target: APP_WINDOWS.multipleQuestionResult,
                data: {
                    number: MultipleQuestionAnswerSetModel.getQuestionNumber(),
                    opt: options,
                }
            });
            $uibModalInstance.dismiss('cancel');
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

    }]
);