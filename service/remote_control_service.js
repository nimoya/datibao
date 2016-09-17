/**
 * @ignore  =====================================================================================
 * @fileoverview 处理窗口的位置和缩放
 * @author  王磊
 * @version 0.1.0
 * @ignore  created in 2016/7/13
 * @ignore  depend
 * @ignore  =====================================================================================
 */

angular.module('DTB').service("RemoteControlService",[
    '$rootScope',
    '$timeout',
    'WindowService',

    function (
        $rootScope,
        $timeout,
        WindowService) {

        const net = require("net");

        const INTERVAL = 500;
        const MAX_CONNECT_COUNT = 10;

        let uuid = {};

        let isResponseToRCD = true; // 用来判断是否对于遥控器进行响应

        let connectCount = 0;

        const COMMAND_MAP = {};
        COMMAND_MAP[APP_CARD_COMMANDS.triggerWindowAlias] = APP_CARD_COMMANDS.triggerWindow;
        COMMAND_MAP[APP_CARD_COMMANDS.escAlias] = APP_CARD_COMMANDS.esc;;
        COMMAND_MAP[APP_CARD_COMMANDS.classAnswerAlias] = APP_CARD_COMMANDS.classAnswer;
        COMMAND_MAP[APP_CARD_COMMANDS.randomAlias] = APP_CARD_COMMANDS.random;
        COMMAND_MAP[APP_CARD_COMMANDS.rushAlias] = APP_CARD_COMMANDS.rush;

        function connect () {
            let client = net.connect({
                host: "127.0.0.1",
                port: 8124
            }, function() {
                console.log('Connected to server!');
            });

            client.on('data', function(command){
                command = command.toString();

                let prevTime = uuid[command] || 0;
                let curtTime = Date.now();
                if (curtTime - prevTime < INTERVAL) {
                    return;
                }
                uuid[command] = curtTime;


                command = COMMAND_MAP[command];

                if (command == null || !isResponseToRCD) {
                    return;
                }

                let currentWindow = WindowService.getCurrentWindow();
                let curtWindowName = currentWindow.name;

                $rootScope.$emit(APP_EVENTS.onRCDCommanded, {
                    target: curtWindowName,
                    command: command,
                });
            });

            client.on("error", function (err) {
                console.error(err);
                if (connectCount < MAX_CONNECT_COUNT) {
                    connectCount++;
                    $timeout(()=>{
                        connect();
                    }, 3000);
                }
            });

            client.on('end', function() {
                console.log('disconnected from server');
            });
        }

        this.setResponseToRCD = function (isResponse) {
            isResponseToRCD = !!isResponse;
        };

        this.init = function () {
            $timeout(connect, 3000);

            // 当用户点击title bar的时候，如果老师通过遥控器进行页面跳转的话
            // 会出现页面错乱的情况，所以这里我们在用户mousedown的时候屏蔽
            // 处理遥控器传过来的信号
            document.addEventListener("mousedown", function () {
                isResponseToRCD = false;
            }, false);

            document.addEventListener("mouseup", function () {
                isResponseToRCD = true;
            }, false);
        };
    }]
);
