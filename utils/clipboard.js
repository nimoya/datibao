/**
* @fileOverview 剪切板相关
* @author 邓俊生   16/6/15
* @version 1.0
 * @event 16/6/15 沈奥林定稿
*/
const clipboard=nw.Clipboard.get();

angular.module('DTB').service('Clipboard',[function () {

    /**
     * 获得剪切板的数据
     * @param type  类型 text, png, jpeg, html , rtf
     * @returns {*}
     */
    this.get= function (type) {
        return clipboard.get(type);
    };

    /**
     * 设置剪切板数据
     * @param data
     * @param type  类型 text, png, jpeg, html , rtf
     */
    this.set= function (data, type) {
        clipboard.set(data,type);
    };

    /**
     * 获得剪切板的可用类型
     * @returns {*}
     */
    this.getTypes= function () {
        return clipboard.readAvailableTypes();
    }

    /**
     * 清空剪切板
     */
    this.clear= function () {
        clipboard.clear();
    }
}]);