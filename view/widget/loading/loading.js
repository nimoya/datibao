/**
 * @fileOverview loading界面的directive
 * @author 周靖人   16/8/16
 * @version 0.1
 */
dtb.directive('xyLoading',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/loading/loading.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
                scope.titleStr=iAttrs.xyLoadingTitle;                      //获得标题的名字
                scope.bodyClass=iAttrs.xyBodyClass;
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
