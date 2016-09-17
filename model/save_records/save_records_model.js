/**
 * @ignore  =====================================================================================
 * @file 保存记录页面的model
 * @author 周靖人
 * @version 0.1.0
 * @ignore  created in 2016/8/18
 * @ignore  depend
 * @ignore  =====================================================================================
 */
angular.module('DTB').service('SaveRecordsModel',[
    function(){
        let _saveRecordsShow=false;
        this.getSaveRecordsShow=function(){
            return _saveRecordsShow;
        };
        this.setSaveRecordsShow=function(x){
            _saveRecordsShow=x;
        }
    }]
);