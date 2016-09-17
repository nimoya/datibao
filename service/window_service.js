/**
* @ignore  =====================================================================================
* @fileoverview 处理窗口的位置和缩放
* @author  沈奥林
* @version 0.1.0
* @ignore  created in 2016/6/1
* @ignore  depend
* @ignore  =====================================================================================
*/

const win=nw.Window.get();

const screen = nw.Screen.Init();

angular.module('DTB').service('WindowService',[
    '$timeout',
    '$rootScope',
    'UserService',

    function (
            $timeout,
            $rootScope,
            UserService
        ) {

        var _self=this;

        let screenWidth = screen.screens[0].bounds.width;
        let screenHeight =screen.screens[0].bounds.height;
        let screenLeft = screen.screens[0].bounds.x;
        let screenTop = screen.screens[0].bounds.y;


        /**
         * 窗口列表
         */
        var windowList={
            login:{
                name:APP_WINDOWS.login,
                width:402,
                height:250,
                align: 'center'
            },
            guide: {
                name:APP_WINDOWS.guide,
                width:580,
                height:340,
                align: 'center'
            },
            homePage:{
                name:APP_WINDOWS.homePage,
                width:200,
                height:450,
                align: 'right'
            },
            setting:{
                name:APP_WINDOWS.setting,
                width:1024,
                height:700,
                align: 'center'
            },
            manageClass:{
                name:APP_WINDOWS.manageClass,
                width:1024,
                height:700,
                align: 'center'
            },
            report:{
                name:APP_WINDOWS.report,
                width:1024,
                height:700,
                align: 'center'
            },
            classAnswer:{
                name:APP_WINDOWS.classAnswer,
                width:122,
                height:370,
                align: 'right'
            },
            answerDetail:{
                name:APP_WINDOWS.answerDetail,
                width:300,
                height:660,
                align: 'right'
            },
            trueFalseQuestionAnswerDetail:{
                name:APP_WINDOWS.trueFalseQuestionAnswerDetail,
                width:300,
                height:540,
                align: 'right'
            },
            answerStudent:{
                name:APP_WINDOWS.answerStudent,
                width:300,
                height:460,
                align: 'right'
            },
            rushAnswerResult : {
                name:APP_WINDOWS.rushAnswerResult,
                width:300,
                height:460,
                align: 'right'
            },
            studentStage:{
                name:APP_WINDOWS.studentStage,
                width:122,
                height:340,
                align: 'right'
            },
            randomRoll:{
                name:APP_WINDOWS.randomRoll,
                width:462,
                height:302,
                align: 'center'
            },
            rushAnswer:{
                name:APP_WINDOWS.rushAnswer,
                width:122,
                height:320,
                align: 'right'
            },
            questionDetail:{
                name:APP_WINDOWS.questionDetail,
                width:800,
                height:600,
                align: 'center'
            },
            teacherCard:{
                name:APP_WINDOWS.teacherCard,
                width:1024,
                height:700,
                align: 'center'
            },
            attendance: {
                name:APP_WINDOWS.attendance,
                width:1024,
                height:700,
                align: 'center'
            },
            multipleQuestion: {
                name:APP_WINDOWS.multipleQuestion,
                width:1024,
                height:700,
                align: 'center'
            },
            multipleQuestionResult: {
                name:APP_WINDOWS.multipleQuestionResult,
                width:1024,
                height:700,
                align: 'center'
            },
            foldingWindow: {
                name: APP_WINDOWS.foldingWindow,
                width: 30,
                height: 100,
                align: 'right'
            },
            questionResult:{
                name:APP_WINDOWS.questionResult,
                width:1023,
                height:700,
                align:'center'
            }
        };

        for (let key in windowList) {
            let left = Math.floor(screenLeft + (screenWidth - windowList[key].width)/2);
            let top = Math.floor(screenTop + (screenHeight - windowList[key].height)/2);
            if (windowList[key].align == 'right') {
                left = Math.floor(screenLeft + screenWidth - windowList[key].width);
            }
            windowList[key].left = left;
            windowList[key].top = top;
        }
        

        var showing=true;


        /**
         * 窗口栈,用于关闭返回
         * @type {Array}
         * @private
         */
        var _windowStack=[];

        /**
         * 当前的窗口对象
         * @type {{}}
         */
        _self.currentWindow={};

        /**
         * @private
         * 切换至指定的窗口
         * @param _windowName   窗口名
         * @param _cb
         */
        function _changeToWindow (_windowName,_cb) {
            var windowList=_getWindowList();
            var targetWindow=windowList[_windowName+''];

            if (!targetWindow){
                logger.error('要切换的窗口不存在');
                return;
            }

            
            win.moveTo(10000,targetWindow.top);
            win.resizeTo(targetWindow.width,targetWindow.height);
            _cloneWindow(targetWindow,_self.currentWindow);


            $timeout(function () {
                win.moveTo(targetWindow.left,targetWindow.top);
            },200);

            _cb&&_cb();

        }

        /**
         * 将窗口名推入窗口栈
         * @param _windowName
         * @private
         */
        function _pushToWindowStack(_windowName) {
            logger.info(_windowName+'入栈');
            _windowStack.push(_windowName);
        }

        /**
         * 窗口出栈
         * @returns {*}
         * @private
         */
        function _popFromWindowStatck(){
            let window=_windowStack.pop();
            logger.info(window+'出栈');
            return window;
        }

        function _getTopWindow() {
            return _windowStack[_windowStack.length-1];
        }


        /**
         * @private
         * 获得所有的window
         */
        function _getWindowList () {
            return windowList;
        }

        /**
         *
         * @param windowname
         * @param windowname2
         * @private
         * 将windowname窗口的位置调整成windowname2窗口的位置
         */
        this._sameWindowPosition=function(windowname,windowname2){
            windowList[windowname].left=windowList[windowname2].left;
            windowList[windowname].top=windowList[windowname2].top;
        };

        /**
         * @private
         * 将origin的属性复制给_target
         * @param _origin
         * @param _target
         */
        function _cloneWindow(_origin,_target) {
            _target.name=_origin.name,
                _target.width=_origin.width,
                _target.height=_origin.height,
                _target.left=_origin.left,
                _target.top=_origin.top
        }

        /**
         * @private
         * 将当前窗口的位置作为该窗口的默认位置(再次打开将会用当前位置)
         */
        function _updateWindowLocation() {
            let windowList=_getWindowList();
            let currentWindow=_self.getCurrentWindow();
            if(!currentWindow) {
                return;
            }
            for (let index in windowList){
                if (windowList[index].name==currentWindow.name){
                    let screen    = nw.Screen.screens[0].bounds;
                    let tmpWindow = windowList[index];
                    if (win.x > -tmpWindow.width
                            && win.x < tmpWindow.width + screen.width
                                && win.y > -tmpWindow.height
                                    && win.y < tmpWindow.height + screen.height) {
                        windowList[index].left=win.x;
                        windowList[index].top=win.y;
                    }
                    break;
                }
            }
        }

        /**
         * 绑定窗口事件
         */
        function bindWindowEvents() {
            win.on('closed',()=>{
                console.log('窗口被关闭');
                showing=false;
            });

            win.on("close", function() {
                this.hide();

                // homepage退出时，联网版答题宝把内存中的内容保存到文件中去
                let currentWindow = _self.getCurrentWindow() || {};
                if (APP_CONFIG.version === Constant.NETWORK
                        && currentWindow.name === APP_WINDOWS.homePage) {
                    UserService.saveDataToCache().then(()=>{
                        this.close(true);
                        console.log("save UserService data to cache");
                    }).catch(err=>{
                        this.close(true);
                        console.error(err);
                    });
                    return;
                }

                this.close(true);

            });

            win.on('minimize',()=>{
                console.log('窗口被最小化');
                showing=false;
            });

            win.on('restore',()=>{
                showing=true;
                logger.info('窗口被显示')
            });

            win.on('loaded',()=>{
                showing=true;
                win.setAlwaysOnTop(true);
            });
        }
        /**
         *关闭当前窗口
         */
        function closeWindow (_rememberOldWindowPosition) {
            if (_rememberOldWindowPosition == null) {
                _rememberOldWindowPosition  = true;
            }

            if(_windowStack.length==0){
                logger.error('没有窗口可以关闭');
            }

            _rememberOldWindowPosition && _updateWindowLocation();
            if (_windowStack.length==1){
                //关闭的是最后一个窗口

                //TODO:关闭应用
                $rootScope.$emit(APP_EVENTS.onWindowClosed,_self.getCurrentWindow().name);
                logger.info('关闭了'+_self.getCurrentWindow().name+'然后应用关闭');
                win.hide();
                $timeout(()=>{
                    win.close();
                });

            }else{
                let currentWindowName=_self.getCurrentWindow().name;
                let windowName=_windowStack[_windowStack.length-2];
                _changeToWindow(windowName,()=>{
                    _popFromWindowStatck();
                    $rootScope.$emit(APP_EVENTS.onWindowClosed,currentWindowName);
                    $rootScope.$emit(APP_EVENTS.onWindowBacked,windowName);
                })
            }
        };




        //////////////////////////////////////////////////
        //以下方法是可以外部调用的方法


        /**
         * 返回所有窗口对象的信息拷贝
         * @returns {*}
         */
        this.getWindowList=function () {
            return _.cloneDeep(windowList);
        };

        /**
         * @desc 获取当前的window栈
         * @returns {Array}
         */
        this.getWindowStack = function () {
            return _windowStack || [];
        };

        /**
         * 获得当前的窗口
         * @returns {{}|*}
         */
        this.getCurrentWindow=function () {
            return _self.currentWindow;
        };

        /**
         * 进入新窗口,旧窗口记录保留
         * @param _windowName   窗口名称
         */
        this.enterToWindow=function (_windowName, _rememberOldWindowPosition) {
            if (_rememberOldWindowPosition == null) {
                _rememberOldWindowPosition = true;
            }

            logger.info('进入新窗口'+_windowName);
            let currentWindowName=_self.getCurrentWindow().name;

            _rememberOldWindowPosition && _updateWindowLocation();

            _changeToWindow(_windowName, ()=> {
                _pushToWindowStack(_windowName);
                //广播窗口打开的事件,驱动窗口重新初始化
                $rootScope.$emit(APP_EVENTS.onWindowLeaved,currentWindowName);
                $rootScope.$emit(APP_EVENTS.onWindowOpened,_windowName);
            });

        };

        /**
         * 显示隐藏窗口
         */
        this.triggerWindow=function () {
            if(showing){
                _self.minimizeWindow();
            }else{
                _self.restoreWindow();
            }
            console.log("showing: " + showing);
        };

        /**
         * @desc 判断当前窗口是否显示
         * @returns {boolean}
         */
        this.isShowing = function () {
            return showing;
        };

        /**
         * 用新窗口代替旧窗口,旧窗口出栈
         * @param _windowName
         */
        this.replaceWithWindow=function (_windowName, _rememberOldWindowPosition) {
            if (_rememberOldWindowPosition == null) {
                _rememberOldWindowPosition = true;
            }

            logger.info('替换入新窗口'+_windowName);

            let currentWindowName=_self.getCurrentWindow().name;

            _rememberOldWindowPosition && _updateWindowLocation();

            _changeToWindow(_windowName,()=>{
                _popFromWindowStatck();
                _pushToWindowStack(_windowName);
                //广播窗口打开的事件,驱动窗口重新初始化
                $rootScope.$emit(APP_EVENTS.onWindowClosed,currentWindowName);
                $rootScope.$emit(APP_EVENTS.onWindowOpened,_windowName);

            });
        };


        /**
         * 返回之前的某个窗口
         * @param _windowName
         */
        this.backToWindow = function (_windowName, _rememberOldWindowPosition) {
            if (_rememberOldWindowPosition == null) {
                _rememberOldWindowPosition = true;
            }

            logger.info('返回到窗口'+_windowName);

            if (!_windowName){
                //默认关闭当前页面
                logger.info('默认关闭');
                closeWindow();
                return;
            }
            let topWindow=_getTopWindow();

            _rememberOldWindowPosition && _updateWindowLocation();

            while(topWindow){
                logger.info('循环关闭');

                if(topWindow==_windowName){
                    //从窗口栈中打开
                    _changeToWindow(_windowName,()=>{

                        $rootScope.$emit(APP_EVENTS.onWindowBacked,_windowName);


                    });
                    return;
                }else{
                    $rootScope.$emit(APP_EVENTS.onWindowClosed,topWindow);

                    //如果不是选中的窗口则继续出栈
                    _popFromWindowStatck();
                }
                topWindow=_getTopWindow();
            }

            //栈中没有该窗口，则入栈
            _self.enterToWindow(_windowName);
        };

        /**
         * 返回主页
         */
        this.backToHome=function () {
            _self.backToWindow(APP_WINDOWS.homePage);
        };

        /**
         * 最小化当前窗口
         */
        this.minimizeWindow=function () {
            showing = false;
            win.minimize();
        };

        this.restoreWindow = function () {
            showing = true;
            win.restore();
        };

        this.showWindow=function () {
            win.show();
            showing = true;
        };

        /**
         * @desc 隐藏窗口
         */
        this.hideWindow = function () {
            win.hide();
            showing = false;
        };

        this.isWindowShowing = function () {
            return showing;
        };
        
        /**
         * 折叠当前窗口
         */
        this.foldWindow=function(_rememberOldWindowPosition){
            showing = false;

            if (_rememberOldWindowPosition == null) {
                _rememberOldWindowPosition = true;
            }
            _rememberOldWindowPosition && _updateWindowLocation();
            win.moveTo(10000,_self.currentWindow.top);
            win.resizeTo(windowList.foldingWindow.width,windowList.foldingWindow.height);
            win.moveTo(windowList.foldingWindow.left, windowList.foldingWindow.top);
            $timeout(()=> {
                $rootScope.$emit(APP_EVENTS.onWindowFold, _self.currentWindow.name);
                win.moveTo(windowList.foldingWindow.left, windowList.foldingWindow.top);
            }, 50);
        };

        /**
         * 展开
         */
        this.expandWindow= function () {
            showing = true;
            win.moveTo(10000,_self.currentWindow.top);
            win.resizeTo(_self.currentWindow.width,_self.currentWindow.height);
            $timeout(()=>{
                $rootScope.$emit(APP_EVENTS.onWindowExpand, _self.currentWindow.name);
                win.moveTo(_self.currentWindow.left,_self.currentWindow.top);
            },50)

        };

        /////////////////////////////////
        //立即执行的代码
        bindWindowEvents();
    }]
);
