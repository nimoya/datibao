/**
* @ignore  =====================================================================================
* @fileoverview $rootScope触发的所有事件
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/14
* @ignore  depend 
* @ignore  =====================================================================================
*/

const APP_EVENTS={
    onWindowChanged:'onWindowOpened',       //窗口窗口切换
    onWindowOpened:'onWindowOpened',        //窗口打开
    onWindowBacked:'onWindowBacked',        //返回之前窗口
    onWindowClosed:'onWindowClosed',        //窗口关闭
    onWindowLeaved:'onWindowLeaved',        //离开窗口进入新窗口,
    onWindowFold:'onWindowFold',            // 窗口折叠
    onWindowExpand: 'onWindowExpand',      // 窗口展开
    onStationAdded:'onStationAdded',        //基站插入
    onStationRemoved:'onStationRemoved',    //基站拔出
    onCourseCreated:'onCourseCreated',      //班级创建
    onCourseStudentsReplaced: 'onCourseStudentsReplaced',  // 替换班级学生
    onStudentAnswered:'onStudentAnswered',  //学生答题
    onQuestionAnswerSet: 'onQuestionAnswerSet', //用学生卡设置正确答案
    onStudentBind: 'onStudentBind', //当学生卡发送绑定信息
    onTeacherCommanded:'onTeacherCommanded',//教师按卡
    onRCDCommanded: "onRCDCommanded",        // 遥控器按键功能
    onPrompt: "onPrompt", // 底层有信息要提示用户
    onWebSocketOpen: 'onWebSocketOpen', //当WebSocket打开
    onWebSocketClose: 'onWebSocketClose', //当WebSocket关闭
    onWebSocketMessage: 'onWebSocketMessage', //当WebSocket收到消息
    onDeviceAdded: 'onDeviceAdded', //当基站插入时
    onDeviceRemoved: 'onDeviceRemoved', //当拔出基站时
};