/**
 * Created by 11433 on 2016/6/17.
 */

(function(){
    let uuid = require("node-uuid");

    angular.module('DTB').service('TeacherCardService',[
        '$rootScope',
        '$q',
        'WindowService',
        'UserService',
        'PPTService',

        function (
            $rootScope,
            $q,
            WindowService,
            UserService,
            PPTService) {

            let self=this;

            var getID = function (data) {
                if (data && data.length > 0) {
                    var ids =data.slice(0,4);
                    var id = "";
                    ids.forEach(function(a){
                        if(a.toString(16).length==1){
                            id += ('0'+a.toString(16));
                        }
                        else {
                            id += a.toString(16);
                        }
                    });
                    return id;
                }
            };


            /**
             * 根据按键值获得相应的意义
             * @param command
             */
            this.getCommandByOpt=function (command) {
                let commandName='';
                switch (command){
                    case 1:
                        commandName=APP_CARD_COMMANDS.keya;
                        break;
                    case 2:
                        commandName=APP_CARD_COMMANDS.keyb;

                        break;
                    case 4:
                        commandName=APP_CARD_COMMANDS.keyRight;

                        break;
                    case 8:
                        commandName=APP_CARD_COMMANDS.keyc;

                        break;
                    case 16:
                        commandName=APP_CARD_COMMANDS.keyd;

                        break;
                    case 32:
                        commandName=APP_CARD_COMMANDS.keyFalse;

                        break;
                    case 193:
                        commandName=APP_CARD_COMMANDS.triggerWindow;

                        break;
                    case 194:
                        commandName=APP_CARD_COMMANDS.up;

                        break;
                    case 196:
                        commandName=APP_CARD_COMMANDS.tab;

                        break;
                    case 129:
                        commandName=APP_CARD_COMMANDS.esc;

                        break;
                    case 130:
                        commandName=APP_CARD_COMMANDS.down;

                        break;
                    case 132:
                        commandName=APP_CARD_COMMANDS.enter;

                        break;
                    case 136:
                        commandName=APP_CARD_COMMANDS.rush;

                        break;
                    case 144:
                        commandName=APP_CARD_COMMANDS.classAnswer;

                        break;
                    case 160:
                        commandName=APP_CARD_COMMANDS.random;

                        break;
                    default:
                        break;

                }
                return commandName
            }

            this.broadcastTeacher=function (data) {
                var command=data[4];
                var opt = data[5];

                // 对于页面隐藏的状态不对按键进行处理，除了隐藏显示功能
                if (!WindowService.isWindowShowing()
                        && (self.getCommandByOpt(opt) != APP_CARD_COMMANDS.triggerWindow
                            && self.getCommandByOpt(opt) != APP_CARD_COMMANDS.up
                                && self.getCommandByOpt(opt) != APP_CARD_COMMANDS.down)) {
                    return;
                }


                //TODO:判断流水号
                switch (command){
                    case 0xc1:
                    {
                        let type=0;     //0:未知类型    1:九键类型  2:选项卡类型
                        if(data[5]>128){
                            //九键教师卡
                            type=1;

                        }else if(UserService.isCardBindAsTeacher(getID(data))){
                            //教师公布答案的卡
                            type=2;
                        }

                        let cardId = getID(data);
                        let isBind = UserService.isCardBindAsTeacher(cardId);

                        console.log("enter");

                        let info={
                            cardId: cardId,
                            opt:data[5],
                            type:type
                        };

                        let currentWindow = WindowService.getCurrentWindow();

                        if (!isBind) {
                            $rootScope.$emit(APP_EVENTS.onTeacherCommanded,{
                                data:info,
                                target:currentWindow.name
                            });
                            return;
                        }


                        switch (self.getCommandByOpt(info.opt)){
                            case APP_CARD_COMMANDS.up:
                                PPTService.pptPageUp();
                                break;

                            case APP_CARD_COMMANDS.down:
                                PPTService.pptPageDown();
                                break;

                            default:
                                $rootScope.$emit(APP_EVENTS.onTeacherCommanded,{
                                    data:info,
                                    target:currentWindow.name
                                });
                                break;
                        }

                        // this.isCardBindAsTeacher(cardId).then((isBind)=>{
                        //     console.log("enter");
                        //
                        //     let info={
                        //         cardId: cardId,
                        //         opt:data[5],
                        //         type:type
                        //     };
                        //
                        //     let currentWindow = WindowService.getCurrentWindow();
                        //
                        //     if (!isBind) {
                        //         $rootScope.$emit(APP_EVENTS.onTeacherCommanded,{
                        //             data:info,
                        //             target:currentWindow.name
                        //         });
                        //         return;
                        //     }
                        //
                        //
                        //     switch (self.getCommandByOpt(info.opt)){
                        //         case APP_CARD_COMMANDS.up:
                        //             PPTService.pptPageUp();
                        //             break;
                        //
                        //         case APP_CARD_COMMANDS.down:
                        //             PPTService.pptPageDown();
                        //             break;
                        //
                        //         default:
                        //             $rootScope.$emit(APP_EVENTS.onTeacherCommanded,{
                        //                 data:info,
                        //                 target:currentWindow.name
                        //             });
                        //             break;
                        //     }
                        //
                        // }).catch((err)=>{
                        //     console.error(err);
                        // });

                    }
                        break;
                }
            }

            // this.setWaitingBind =  setWaitingBind;
            //
            // this.cancelWaitingBind = cancelWaitingBind;
            //
            // this.getWaitingStatus = getWaitingStatus;

            // this.init();
        }]
    );
})();