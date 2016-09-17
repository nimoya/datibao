/**
 * @fileOverview 给元素绑定onscroll事件
 * @author 王磊  16/8/24
 * @version 0.1
 */
angular.module("DTB").directive('xyScroll',[
    function () {
        return{
            scope: {
                onScroll: "&"
            },
            restrict: 'A',
            link:function (scope, iElement, iAttrs, controller) {
                iElement = iElement[0];

                iElement.addEventListener("scroll", function (event) {
                    scope.$apply(function () {
                        scope.onScroll && scope.onScroll({
                            data: {
                                scrollTop: event.target.scrollTop,
                                scrollHeight: event.target.scrollHeight,
                                offsetHeight: event.target.offsetHeight,
                            }
                        });
                    });
                }, false);
            }
        }
    }]
);
