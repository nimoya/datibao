/**
 * @description 处理WebSocket消息的地方
 * @author 吴亚
 * @createTime 2016/9/3
 */
"use strict";

angular.module('DTB').service('WebsocketService', [
    '$rootScope',
    function ($rootScope) {
        
        var self = this;
        
        const stationId = ((Math.random() * 256) >> 0).toString(16);
        const serverUrl = {
            url: 'ws://127.0.0.1:9981'
        };
        const exec = require('child_process').execFile;
        const path = require('path');
        var ws = {};
        
        self.serverIds = {};

        /**
         * 初始化WebSocket
         */
        function initWebsocket() {
            var child = exec(path.resolve('./lib/WebSocketServer.exe'), function (err) {
                if (err) {
                    console.error(err);
                }
                else {
                    ws = new WebSocket(serverUrl.url);

                    ws.onopen = function () {
                        console.log('websocket opened!');
                        writeStationId();
                        $rootScope.$emit(APP_EVENTS.onWebSocketOpen);
                    };

                    ws.onerror = function (err) {
                        console.log('websocket error');
                        console.error(err);
                    };

                    ws.onmessage = function (message) {
                        console.log('websocket on message:');
                        console.log(message.data);
                        try {
                            var data = JSON.parse(message.data);
                            if (data.action == 'connect' && data.data.hasOwnProperty('connected')) {
                                if (data.data.connected) {
                                    $rootScope.$emit(APP_EVENTS.onDeviceAdded);
                                }
                                else {
                                    $rootScope.$emit(APP_EVENTS.onDeviceRemoved);
                                }
                            }
                        }
                        catch (err) {
                            console.log(err);
                        }
                        $rootScope.$emit(APP_EVENTS.onWebSocketMessage, message.data);
                    };

                    ws.onclose = function () {
                        console.log('websocket closed');
                        $rootScope.$emit(APP_EVENTS.onWebSocketClose);
                    };
                }
            });
            
            child.on('close', function (code) {
                console.log('close with code:' + code);
                initWebsocket();
            })
        }

        /**
         * 发送WebSocket通信数据
         * @param data
         */
        function sendData(data) {
            data.from = 'vote-main';
            console.log(JSON.stringify(data));
            if (ws && ws.send) {
                ws && ws.send(JSON.stringify(data));
            }
        }

        /**
         * 写基站id
         */
        function writeStationId() {
            console.log('写基站id');
            sendData({
                type: 'logic',
                action: 'write_station_id',
                to: 'all',
                data: stationId
            });
        }

        /**
         * 卡片的id数组
         * @param {Array} ids
         */
        function handshake(ids) {
            console.log('握手！');
            sendData({
                type: 'logic',
                action: 'send_id_list',
                to: 'all',
                data: mapIds(ids)
            });
        }

        /**
         * 映射id列表
         * @param {Object} ids
         */
        function mapIds(ids) {
            self.serverIds = {};
            var arr = new Array(200);
            for(var i = 0; i < ids.length; i++) {
                if (i < 196) {
                    arr[i] = ids[i];
                }
            }
            arr.splice(0, 0, '');
            arr.splice(50, 0, '');
            arr.splice(100, 0, '');
            arr.splice(150, 0, '');
            var str = "";
            for (var j=0; j<arr.length; j++) {
                if (arr[j]) {
                    self.serverIds[arr[j]] = j;
                    str += arr[j].substr(0,2) + ',' + arr[j].substr(2,2) + ',' + arr[j].substr(4,2) + ',' + arr[j].substr(6,2) + '|';
                }
                else {
                    arr[j] = '';
                }

            }
            console.log(str);
            return str;
        }

        /**
         * 广播内容
         * @param {Object} data
         */
        function broadcastData(data) {
            for(var i=0;i<data.length;i++){
                data[i] = data[i].toString(16);
            }
            sendData({
                type: 'logic',
                action: 'broadcast',
                to: 'all',
                data: stationId + ',0,0,0,f2,' + data.join(',')
            });
        }

        /**
         * 开始答题
         * @param {Object} isMulti 是否是多题
         * @param {Object} isJudge 是否是判断
         */
        function startQuestion(isMulti, isJudge) {
            console.log('开始答题！');
            var data = [0, 0, 0, 0];
            data[0] = data[0] | (1<<7);
            if (isMulti) {
                data[0] = data[0] | (1<<6);
            }
            if (isJudge) {
                data[0] = data[0] | (1<<5);
            }
            broadcastData(data);
        }

        /**
         * 结束答题
         * @param {Object} isMulti 是否是多题
         * @param {Object} isJudge 是否是判断
         */
        function endQuestion(isMulti, isJudge) {
            console.log('结束答题！');
            var data = [0, 0, 0, 0];
            if (isMulti) {
                data[0] = data[0] | (1<<6);
            }
            if (isJudge) {
                data[0] = data[0] | (1<<5);
            }
            broadcastData(data);
        }

        /**
         * 公布答案
         * @param {Object} answer
         */
        function publicAnswer(answer) {
            if (answer) {
                var arr1 = ['A', 'B', '√', 'C', 'D', '×'];
                var arr2 = ['E', 'F', 'G'];
                var data = [0, 0, 0, 0];
                data[0] = data[0] | (1<<4);
                for (var i=0; i<arr1.length; i++) {
                    if (answer.indexOf(arr1[i]) >= 0) {
                        data[1] = data[1] | (1<<i);
                    }
                }
                for (var j=0; j<arr2.length; j++) {
                    if (answer.indexOf(arr2[j]) >= 0) {
                        data[2] = data[2] | (1<<j);
                    }
                }
                broadcastData(data);
            }
        }

        /**
         * 停止广播
         */
        function stopBroadcast() {
            console.log('停止广播！');
            sendData({
                type: 'logic',
                action: 'broadcast',
                to: 'all',
                data: '0,0,0,0,f3,0,0,0,0'
            });
        }

        /**
         * 开始广播
         */
        function startBroadcast() {
            console.log('开始广播！');
            sendData({
                type: 'logic',
                action: 'broadcast',
                to: 'all',
                data: '0,0,0,0,f3,1,0,0,0'
            });
        }

        /**
         * 初始化WebSocket
         * @type {initWebsocket}
         */
        self.initWebsocket = initWebsocket;

        /**
         * 发送握手信息
         * @type {handshake}
         */
        self.handshake = handshake;

        /**
         * 写基站id
         * @type {writeStationId}
         */
        self.writeStationId = writeStationId;

        /**
         * 开始广播
         * @type {startBroadcast}
         */
        self.startBroadcast = startBroadcast;

        /**
         * 停止广播
         * @type {stopBroadcast}
         */
        self.stopBroadcast = stopBroadcast;

        /**
         * 开始答题
         * @type {startQuestion}
         */
        self.startQuestion = startQuestion;

        /**
         * 结束答题
         * @type {endQuestion}
         */
        self.endQuestion = endQuestion;

        /**
         * 公布答案
         * @type {publicAnswer}
         */
        self.publicAnswer = publicAnswer;
        
    }
]);