/**
 * Created by 11433 on 2016/6/2.
 */
dtb.directive('xyTitleBar',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/title_bar/title_bar.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
                scope.titleStr=iAttrs.xyTitle;                      //获得标题的名字
                scope.minDisable=(iAttrs.xyMinDisable!=undefined);  //获得标题栏是否可以最小化
                scope.closeable=(iAttrs.xyCloseable!=undefined);

                scope.minimize=()=>{
                    WindowService.minimizeWindow();
                };

                scope.closeWin=()=>{
                    WindowService.backToWindow();
                };
            }
        }
    }]
);