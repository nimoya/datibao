/**
* @ignore  =====================================================================================
* @fileoverview 主窗口的控制器
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/1
* @ignore  depend
* @ignore  =====================================================================================
*/
"use strict";

var dtb=angular.module("DTB");

angular.module('DTB').controller('MainCtrl',[
    '$scope',
    '$timeout',
    'WindowService',

    function (
            $scope,
            $timeout,
            WindowService
        ) {

        nw.Screen.Init();

        preventDragFileToApp();
        
        $timeout(function () {
            // 引用windowService里面的currentWindow数据,
            // 这样在windowService里面修改currentWindow，
            // 就会影响到这个对象，使得页面切换
            $scope.currentWindow=WindowService.getCurrentWindow();

            WindowService.enterToWindow(APP_WINDOWS.guide);
        }, 50);

        // 禁止把文件拖到应用的默认行为
        function preventDragFileToApp () {
            window.addEventListener("dragover",function(e){
                e = e || event;
                e.preventDefault();
            },false);
            
            window.addEventListener("drop",function(e){
                e = e || event;
                e.preventDefault();
            },false);
        }
    }]
);