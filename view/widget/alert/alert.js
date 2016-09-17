/**
 * Created by deng on 16/6/13.
 */
angular.module('DTB').directive('xyAlert',[function(){
    return{
        templateUrl:'view/widget/alert/alert.html',
        scope:{},       //将作用域隔离出来
        link: function(scope, element, attrs) {


            attrs.$observe('xyContent', function (value) {
                scope.content=value;

            });

        }
    }
}])