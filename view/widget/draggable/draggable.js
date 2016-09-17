/**
 * @desc 一个directive, 对于应用了这个directive的div，在拖动的时候可以拖动界面移动
 * Created by 11433 on 2016/6/2.
 */
angular.module("DTB").directive('xyDraggable', ["$window", function ($window) {

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element = element[0];

            let canDrag = false;

            let windowOriginPosition = {};
            let mouseOriginPosition  = {};

            element.addEventListener("mousedown", function (event) {
                canDrag = true;

                let win = nw.Window.get();
                windowOriginPosition.x = win.x;
                windowOriginPosition.y = win.y;

                mouseOriginPosition.x  = event.screenX;
                mouseOriginPosition.y  = event.screenY;
            }, false);

            $window.addEventListener("mousemove", function (event) {
                if (!canDrag) {
                    return;
                }

                let position = {
                    x: event.screenX,
                    y: event.screenY
                };

                let offset = {
                    x: position.x - mouseOriginPosition.x,
                    y: position.y - mouseOriginPosition.y
                };

                let windowPosition = {
                    x: windowOriginPosition.x + offset.x,
                    y: windowOriginPosition.y + offset.y
                };

                let win = nw.Window.get();
                win.moveTo(windowPosition.x, windowPosition.y);
            }, false);

            $window.addEventListener("mouseup", function () {
                canDrag = false;

                windowOriginPosition = {};
                mouseOriginPosition  = {};
            }, false);
        }
    };
}]);