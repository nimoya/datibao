/**
 * @fileOverview 基站设备的操作
 * @author 邓俊生   16/6/13
 * @version 0.1
 */

angular.module('DTB').service('StationService', [
    '$rootScope',
    '$timeout',
    '$interval',
    'UserService',
    'TeacherCardService',
    'StudentCardService',
    'WebsocketService',
    function ($rootScope,
              $timeout,
              $interval,
              UserService,
              TeacherCardService,
              StudentCardService,
              WebsocketService) {

        var self = this;

        const VENDORID = 1305;
        const PRODUCTID = 2097;

        var devices = [];
        var connectionId;
        var stoping = false;  //标志位,是否屏蔽接收
        var heartBeats = {}; //记录流水号

        var isResponseToNineKeyTeacherCard = true; // 是否响应九键教师卡

        const stationDevice = {
            vendorId: VENDORID,
            productId: PRODUCTID,
            deviceId: 0
        };

        /**
         * 初始化设备的监听
         */
        var initListeners = function () {
            console.log('init listener');

            WebsocketService.initWebsocket();

            $rootScope.$on(APP_EVENTS.onWebSocketOpen, function () {
                addDevice(stationDevice);
            });

            $rootScope.$on(APP_EVENTS.onDeviceAdded, function () {
                addDevice(stationDevice);
            });

            $rootScope.$on(APP_EVENTS.onDeviceRemoved, function () {
                removeDevice(0);
            });

            document.addEventListener("mousedown", function () {
                isResponseToNineKeyTeacherCard = false;
            }, false);

            document.addEventListener("mouseup", function () {
                isResponseToNineKeyTeacherCard = true;
            });
        };

        var getID = function (data) {
            if (data && data.length > 0) {
                var ids = data.slice(0, 4);
                var id = "";

                ids.forEach(function (a) {
                    if (a.toString(16).length == 1) {
                        id += ('0' + a.toString(16));
                    }
                    else {
                        id += a.toString(16);
                    }
                });
                return id;
            }
        };


        /**
         * 从基站获取一次信息
         * @param cb
         */
        var receiveFromStation = function (cb) {
            if (stoping) {
                return;
            }

            $rootScope.$on(APP_EVENTS.onWebSocketMessage, function (event, data) {
                try {
                    data = JSON.parse(data);
                    if (data.type == 'logic' && data.action == 'vote_command') {
                        data = data.data.split(',');
                        for (var i=0; i<data.length; i++) {
                            data[i] = parseInt(data[i], 16);
                        }
                        cb && cb(data);
                    }
                }
                catch (err) {
                    console.error(err);
                    cb && cb(undefined);
                }
            });
        };

        /**
         * 有设备被添加的回调
         * @param device
         */
        var addDevice = function (device) {
            if (!device) {
                return;
            }

            devices.push(device);

            if (device.vendorId == VENDORID && device.productId == PRODUCTID) {
                $timeout(()=> {
                    $rootScope.$emit(APP_EVENTS.onStationAdded);
                    console.log('基站插入');


                    //TODO:默认基站插入则自动连接
                    self.connectStation();
                }, 200);

            }
        };

        /**
         * 有设备被拔除的回调
         * @param deviceId
         */
        var removeDevice = function (deviceId) {
            console.log('Device Removed #' + deviceId);
            _.forEach(devices, (device, _index)=> {
                if (device != null
                    && device.deviceId != null
                    && device.deviceId == deviceId) {
                    devices.splice(_index, 1);

                    if (device.vendorId == VENDORID && device.productId == PRODUCTID) {
                        $rootScope.$emit(APP_EVENTS.onStationRemoved);
                        console.log('基站拔出');
                    }
                }
            })
        };


        //////////////////////////////////////////////////
        //以下方法是可以外部调用的方法

        this.setResponseToNineKeyTeacherCard = function (isResponse) {
            isResponseToNineKeyTeacherCard = !!isResponse;
        };


        /**
         * 检查基站是否处于连接状态
         * @returns {boolean}
         */
        this.checkStation = function () {
            if (self.getStationDevice()) {
                return true;
            }
            return false;
        };

        /**
         * 获得基站对象的信息
         * @returns {*}
         */
        this.getStationDevice = function () {
            for (var device of devices) {
                if (device.vendorId == VENDORID && device.productId == PRODUCTID) {
                    return _.cloneDeep(device);
                }
            }
            return null;
        };


        /**
         * 启动 基站的信息接收
         */
        this.startReceive = function () {
            console.log('开始接收基站数据');
            if (!self.checkStation()) {
                console.warn('基站没有连接好');
            }

            function receiveCallback(data) {
                if (data) {
                    let id = getID(data);

                    // 这里超出了angular的上下文，所以这里用$timeout
                    $timeout(function () {
                        UserService.markStudentPresentByCardId(id);
                    });

                    let heartBeat = (heartBeats[id] == null ? -1 : heartBeats[id]);
                    if (data[4] == 0xc1) { // 过滤已经接受了的包

                        // 九键教师卡有流水号
                        if (data[5] > 128) {
                            // 对流水号进行处理，防止相同流水号的信息处理多次
                            // 九键教师卡的流水号就是通过发过来信息的流水号来处理的
                            if (heartBeat < data[6]) {
                                heartBeats[id] = (data[6] == 255 ? -1 : data[6]);
                                isResponseToNineKeyTeacherCard && TeacherCardService.broadcastTeacher(data);
                            }

                            // 对学生卡绑定为的教师的卡进行处理
                        }
                    }
                    else if (data[4] == 0xa6 || data[4] == 0xa8) {
                        // 学生卡的流水号处理是通过时间戳来处理的
                        // 时间间隔是800毫秒
                        if (heartBeat < Date.now() - 800) {
                            heartBeats[id] = Date.now();
                            StudentCardService.broadcastStudent(data);
                        }
                    }
                }
            }

            receiveFromStation(receiveCallback);
        };
        /**
         * 连接基站
         */
        this.connectStation = function () {
            if (!self.checkStation()) {
                console.log('尝试连接基站失败');
                return;
            }

            self.initDeviceMode(function (err) {
                if (err) {
                    console.error(err);
                    return;
                }

                self.startReceive();
            });

        };

        this.initDeviceMode = function (cb) {
            console.log('初始化基站');

            WebsocketService.writeStationId();
            cb && cb();

            // self.writeToStation(0xd1, (err)=> {
            //     if (!err) {
            //         self.resetDeviceMode();
            //         cb && cb();
            //
            //     } else {
            //         console.warn(err);
            //         cb && cb(err);
            //     }
            // })

        };

        this.resetDeviceMode = function () {
            console.log('重置基站模式');

            self.writeToStation(0xe1, (err)=> {
                if (!err) {
                    self.writeToStation(0xfd);

                } else {
                    console.warn(err);
                }
            });
        };

        this.changeToCheckAnswerMode = function () {
            return new Promise((resolve, reject)=> {
                resolve();
                // self.writeToStation(0xfd, (err)=> {
                //     if (err) {
                //         reject(err);
                //         return;
                //     }
                //
                //     self.writeToStation(0xd2, (err)=> {
                //         if (err) {
                //             reject(err);
                //             return;
                //         }
                //
                //         resolve();
                //     });
                // });
            });
        };

        this.changeToNormalMode = function () {
            return new Promise((resolve, reject)=> {
                resolve();
                // self.writeToStation(0xd1, (err)=> {
                //     if (err) {
                //         reject(err);
                //         return;
                //     }
                //
                //     self.writeToStation(0xfd, (err)=> {
                //         if (err) {
                //             reject(err);
                //             return;
                //         }
                //
                //         self.writeToStation(0xe1, (err)=> {
                //             if (err) {
                //                 reject(err);
                //                 return;
                //             }
                //
                //             resolve();
                //         });
                //     });
                // });
            });
        };

        /**
         * 尝试断开基站
         * @param cb    回调,返回是否成功
         */
        this.disconnectStation = function (cb) {
            // CHROME.hid.disconnect(connectionId, function () {
            //     if (CHROME.runtime.lastError) {
            //         console.warn("Unable to disconnect device: " + CHROME.runtime.lastError.message);
            //         cb && cb(false);
            //         return;
            //     }
            //     connectionId = null;
            //     cb && cb(true);
            // });
        };


        /**
         * 向基站写数据
         * @param command   命令号
         * @param cb        回调函数
         */
        this.writeToStation = function (command, cb) {
            var data = new Uint8Array(9);
            data[4] = command;

            if (!connectionId) {
                cb && cb(APP_ALERT.no_device);
                return;
            }
            CHROME.hid.send(connectionId, 0, data.buffer, function () {
                if (CHROME.runtime.lastError) {
                    console.warn("Unable to send version command: " +
                        CHROME.runtime.lastError.message);
                    cb && cb(APP_ALERT.op_device_err);
                    return;

                }
                cb && cb();
            });
        };

        /**
         * 暂停接收基站信号
         * @param time  暂停的时间,为空则完全停止
         */
        this.stopRecieve = function (time) {
            stoping = true;

            if (!time) {
                return;
            }
            $timeout(()=> {
                stoping = false;
            }, time);

        };

        /////////////////////////////////
        this.init = function () {
            initListeners();
        };
    }])
