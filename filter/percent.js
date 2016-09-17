/**
 * @file 将小数显示为百分比的形式（小数保留3为小数， 1的时候就显示100%）
 * Created by 26053 on 2016/8/5.
 */

angular.module("DTB").filter("percent", [
    function() {
        return function(number){
            if(number<1) {
                return (parseFloat(number) * 100).toFixed(1) + "%";
            }
            else {
                return "100%";
            }
        }
    }
]);