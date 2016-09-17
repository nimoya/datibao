/**
 * @fileOverview ����records�����directive
 * @author �ܾ���   16/8/18
 * @version 0.1
 */
dtb.directive('xySaveRecords',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/save_records/save_records.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
                scope.minDisable=(iAttrs.xyMinDisable!=undefined);  //��ñ������Ƿ������С��
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
