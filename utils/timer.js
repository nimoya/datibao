/**
* @fileOverview 计时器相关方法
* @author 邓俊生   16/6/12
* @version 0.1
*/
angular.module('DTB').service('Timer',[function () {

    /**
     * 将秒数转化为时间字符串
     * @param _timer
     * @returns {string}
     */
    this.translateTimerString= function (_timer) {
        let min=parseInt(_timer/60)<10?'0'+parseInt(_timer/60):parseInt(_timer/60);
        let sec=parseInt(_timer%60)<10?'0'+parseInt(_timer%60):parseInt(_timer%60);

        return min+':'+sec;
    };

    /**
     * 转化日期格式为：yyyy-MM-dd
     * @param _date
     * @returns {string}
     */
    this.translateDateString = function(_date){
        let newDate = new Date(_date);
        let year = newDate.getFullYear();
        let month = ('00' + (newDate.getMonth() + 1)).substr(-2, 2);
        let date = ('00' + newDate.getDate()).substr(-2, 2);
        return year + '-' + month + '-' + date;
    }
}])
