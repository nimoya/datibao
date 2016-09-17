/**
 * Created by deng on 16/6/12.
 */
dtb.directive('xyFloatTabs',['$timeout','WindowService',function ($timeout,WindowService) {
    return{
        templateUrl:'view/widget/float_tabs/float_tabs.html',
        link:function (scope, iElement, iAttrs, controller) {

            scope.style = iAttrs.xyStyle;
            scope.isFolden=false;
            /**
             * 收起窗口
             */
            scope.foldWin=()=>{
                WindowService.foldWindow();

                $timeout(()=>{
                    scope.isFolden=true;

                },50);

            };

            /**
             * 展开窗口
             */
            scope.expandWin=()=>{
                WindowService.expandWindow();
                $timeout(()=>{
                    scope.isFolden=false;

                },50);
            };
            scope.closeWin=()=>{
                WindowService.backToWindow();
            }
        }
    }
}])