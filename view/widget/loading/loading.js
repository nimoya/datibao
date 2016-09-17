/**
 * @fileOverview loading�����directive
 * @author �ܾ���   16/8/16
 * @version 0.1
 */
dtb.directive('xyLoading',['WindowService',
    function (WindowService) {
        return{
            templateUrl:'view/widget/loading/loading.html',
            scope:{},
            link:function (scope, iElement, iAttrs, controller) {
                scope.titleStr=iAttrs.xyLoadingTitle;                      //��ñ��������
                scope.bodyClass=iAttrs.xyBodyClass;
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
