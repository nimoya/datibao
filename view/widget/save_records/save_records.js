/**
 * @fileOverview 保存records界面的directive
 * @author 周靖人   16/8/18
 * @version 0.1
 */
dtb.directive('xySaveRecords',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/save_records/save_records.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
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
