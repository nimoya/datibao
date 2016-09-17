/**
* @fileOverview 日志处理
* @author 邓俊生   16/6/15
* @version 1.0
 * @event 16/6/15 沈奥林定稿
*/
// const log4js = require('log4js');
const nowTime=new Date();
const timeString=nowTime.getFullYear()+'-'+(nowTime.getMonth()+1)+'-'+nowTime.getDate()+'-'
    +(nowTime.getHours())+'-'+(nowTime.getMinutes());
// log4js.configure({
//     appenders: [
//         { type: 'console' },
//         { type: 'file', filename: 'logs/'+timeString+'.log', category: 'datibao' }
//     ]
// });
// var logger = log4js.getLogger('datibao');
var logger = console;
onerror=function (msg, url, l) {
    let txt='';
    txt="There was an error on this page.\n\n";
    txt+="Error: " + msg + "\n";
    txt+="URL: " + url + "\n";
    txt+="Line: " + l + "\n\n";
    txt+="Click OK to continue.\n\n";
    logger.error(txt);
}