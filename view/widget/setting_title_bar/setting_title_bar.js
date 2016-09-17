/**
 * Created by 11433 on 2016/6/2.
 */
angular.module("DTB").directive('xySettingTitleBar',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/setting_title_bar/setting_title_bar.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
                const VERSION = iAttrs.version || Constant.LOCAL;

                let activeButton = iAttrs.activeButton;

                scope.isNetworkVersion = function () {
                    return VERSION === Constant.NETWORK;
                };

                scope.isManageClassBtnActive = function () {
                    return activeButton === "manageClass";
                };

                scope.isManageStudentBtnActive = function () {
                    return activeButton === "manageStudent";
                };

                scope.isManageTeacherBtnActive = function () {
                    return activeButton === "manageTeacher";
                };

                scope.minimize = function (){
                    WindowService.minimizeWindow();
                };

                scope.closeWin=()=>{
                    WindowService.backToWindow();
                };

                scope.openManageClassPage = function () {
                    WindowService.replaceWithWindow(APP_WINDOWS.manageClass);
                };

                scope.openManageStudentPage = function () {
                    WindowService.replaceWithWindow(APP_WINDOWS.setting);
                };

                scope.openTeacherCardPage = function () {
                    WindowService.replaceWithWindow(APP_WINDOWS.teacherCard);
                };
            }
        }
    }]
);