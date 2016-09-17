/**
 * Created by 11433 on 2016/6/18.
 */
angular.module('DTB').controller('TeacherCardCtrl',[
    '$scope',
    '$timeout',
    'ValidationService',
    '$rootScope',
    '$q',
    '$uibModal',
    'Uuid',
    'TeacherCardService',
    'WindowService',
    'StationService',
    'UserService',
    'Clipboard',
    'DataService',
    'ConfirmDialogModel',

    function (
            $scope,
            $timeout,
            ValidationService,
            $rootScope,
            $q,
            $uibModal,
            Uuid,
            TeacherCardService,
            WindowService,
            StationService,
            UserService,
            Clipboard,
            DataService,
            ConfirmDialogModel) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏在显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏在显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            $timeout(function(){
                nw.Window.get().show();
            });
        });
        
        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
            // 同步设置页面、教师卡管理页面，课程管理页面的位置
            WindowService._sameWindowPosition('manageClass','teacherCard');
            WindowService._sameWindowPosition('setting','teacherCard');

            UserService.setTeacherCards(_teacherCards);
            persistData();

            reset();
        });

        $scope.$on(APP_EVENTS.onWindowLeaved, ()=>{
            // 同步设置页面、教师卡管理页面，课程管理页面的位置
            WindowService._sameWindowPosition('manageClass','teacherCard');
            WindowService._sameWindowPosition('setting','teacherCard');
        });
        
        $scope.$on(APP_EVENTS.onTeacherCommanded,(event, data)=>{
            // 对九键教师卡的按键进行响应
            if (data.type === 1) {
                // 如果没有绑定为教师卡的话，则进行绑定
                let command = TeacherCardService.getCommandByOpt(data.opt);

                // 教师卡没有绑定，并且当前界面没有隐藏，我们绑定教师卡
                if (!isCardBindAsTeacher(data.cardId)
                        && WindowService.isShowing()) {
                    bindTeacherCard(data.cardId);
                    return;
                }

                // 当前界面隐藏，并且命令不是triggerWindow的情况下，不进行处理
                if (!WindowService.isShowing()
                        && command !== APP_CARD_COMMANDS.triggerWindow) {
                    return;
                }

                handleTeacherCardCommand(command);
            }
            // 对于非九键教师卡进行绑定
            else if (data.type === 2) {
                if (!isWaitingBind()) {
                    console.warn("not in waiting bind status");
                    return ;
                }

                // 这里已经超出了angular的context的所有得用$timeout
                $timeout(()=>{
                    let ret = bindTeacherCard(data.cardId);
                    if (!ret.success) {
                        alertMsg(ret.msg, 2000);
                    }
                });
            }
        });

        $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
            if (!WindowService.isShowing()
                && command !== APP_CARD_COMMANDS.triggerWindow) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        // 监听这个事件用来绑定教师卡
        $scope.$on(APP_EVENTS.onStudentBind,(event,data)=>{
            // 判断当前是有教师需要绑卡
            if (!isWaitingBind()) {
                console.warn("not in waiting bind status");
                return ;
            }

            // 这里已经超出了angular的context的所有得用$timeout
            $timeout(()=>{
                let ret = bindTeacherCard(data.cardId);
                if (!ret.success) {
                    alertMsg(ret.msg, 2000);
                }
            });
        });

        //基站事件的监听,用于提示消息
         $rootScope.$on(APP_EVENTS.onStationRemoved,checkStationConnection);
        $rootScope.$on(APP_EVENTS.onStationAdded,onStationConnection);

        let _teacherCards = []; // 当前页面所有显示的教师卡

        let _teacherCardsToAdd    = []; // 新增加的教师卡
        let _teacherCardsToDelete = []; // 需要删除的教师卡
        let _teacherCardsToUpdate = []; // 需要更新的教师卡

        let _isWaitingBind = false;

        let _persistTimeoutId = null;

        let _oldTeacherName = "";

        /**
         * @desc 添加一张教师卡
         */
        $scope.addTeacherCard = function () {
            let card = createDefaultTeacherCard();
            addCard(card);

            scrollTableToBottom();
        };

        /**
         * @desc 删除一张教师卡
         */
        $scope.deleteTeacherCard = function (card) {
            let message = `您确认要删除${card.name}老师吗?`;

            ConfirmDialogModel.reset();
            ConfirmDialogModel.setMessage(message);

            $uibModal.open({
                animation:true,
                openedClass: "xy-teacher-card-confirm-dialog",
                templateUrl:'view/widget/ui_bootstrap/confirm_dialog/confirm_dialog.html',
                size:'sm',
                controller:'ConfirmDialogCtrl'
            }).result.then( isDelete => {
                isDelete && removeCard(card);
            });
        };

        $scope.onNameInputFocus = function (card) {
            _oldTeacherName = card.name;
        };

        $scope.updateTeacherCardName = function (card) {
            card.name = card.name || "";

            // 学生姓名为空的情况进行处理
            if(!(card.name !== "" && card.name != null)){
                alertMsg("教师姓名不能为空", 1000);
                 card.name = _oldTeacherName;
            }
            else if (!ValidationService.checkTeacherName(card.name)) {
                alertMsg("教师姓名不能包含以下字符: \\ / : * ? < > |", 1000);
                card.name = _oldTeacherName;
            }

            updateCard(card);
        };

        $scope.updateTeacherCard = function (card) {
            updateCard(card);
        };

        $scope.onTeacherCardIdInputBlur = function (card) {
            // 判断当前是有教师需要绑卡
            if (!isWaitingBind()) {
                return ;
            }

            let ret = bindTeacherCard(card.cardId);
            if (!ret.success) {
                alertMsg(ret.msg, 2000);
                card.cardId = "";
            }
        };

        $scope.onTeacherCardIdInputFocus = function (card) {
            startWaitingBind(card);
        };

        /**
         * @desc 按下enter键的时候保存教师卡
         * @param $event
         * @param index
         */
        $scope.onInputKeyDown = function ($event, index, column) {
            // 用户按下enter键的处理
            if ($event.keyCode === 13) {
                $event.currentTarget.blur();

            } else if ($event.keyCode === 86 && $event.ctrlKey) {
                $event.preventDefault();

                let texts = Clipboard.get("text").split("\n");

                let infos = [];
                let maxColumn = 2;
                for (let i = 0, len = texts.length; i < len; ++i) {
                    let tmpText = texts[i];

                    if (tmpText == "") {
                        break;
                    }

                    let tmpInfo = tmpText.split("\t");
                    if (tmpInfo.length > maxColumn - column + 1) {
                        alertMsg("粘贴的内容不合法", 3000);
                        return;
                    }

                    for (let j = 0; j < tmpInfo.length; ++j) {
                        tmpInfo[j] = tmpInfo[j].trim();
                    }

                    infos.push(tmpInfo);
                }

                // 没有需要绑定的内容，所以不进行处理
                if (infos.length <= 0) {
                    return;
                }

                let validationFuncs = [
                    ValidationService.checkTeacherName,
                    ValidationService.checkTeacherCardId
                ];

                // 检查要粘贴的内容的合法性
                for (let info of infos) {
                    for (let i = column - 1, j = 0, len = column + info.length - 1; i < len; ++i, ++j) {
                        if (!validationFuncs[i](info[j])) {
                            alertMsg("粘贴的内容不合法", 3000);
                            return;
                        }
                    }
                }

                // 检查卡号是否重复或者已经被绑定
                if ( column + infos[0].length - 1 >= maxColumn ) {
                    for (let i = 0; i < infos.length; ++i) {
                        let info = infos[i];
                        let cardId = info[info.length - 1];
                        if (cardId == "") {
                            continue;
                        }

                        if (isCardBindAsStudents(cardId)) {
                            let msg = "卡号" + cardId + "已经被绑定为学生卡";
                            alertMsg(msg, 3000);
                            return;
                        }

                        // 检测卡号是否已经被绑定为教师卡
                        for (let j = 0; j < _teacherCards.length; ++j) {
                            let teacherCard = _teacherCards[j];

                            if (teacherCard.cardId === cardId && index + i !== j) {
                                let msg = "卡号" + cardId + "已经被绑定为" + (j + 1) +"号教师";
                                alertMsg(msg, 3000);
                                return;
                            }
                        }
                    }

                    // 检查卡号是够重复
                    for (let i = 0, len = infos.length; i < len; ++i) {
                        let info1 = infos[i];
                        let cardId1 = info1[info1.length - 1];
                        if (cardId1 == "") {
                            continue;
                        }

                        for (let j = 0; j < len; ++j) {
                            let info2 = infos[j];
                            let cardId2 = info2[info2.length - 1];
                            if (cardId1 === cardId2 && i !== j) {
                                let msg = "卡号" + cardId1 + "重复";
                                alertMsg(msg, 3000);
                                return;
                            }
                        }
                    }
                }

                let keys = [
                    "name",
                    "cardId",
                ];

                let teacherCardsToAdd    = [];
                let teacherCardsToUpdate = [];

                let curtCardLen = _teacherCards.length;
                for (let i = 0, len = infos.length; i < len; ++i) {
                    let info = infos[i];

                    // 需要新添加的学生
                    if (i + index + 1 > curtCardLen) {
                        let tmpCard= createDefaultTeacherCard();
                        for (let j = 0; j < info.length; ++j) {
                            let key = keys[column + j - 1];
                            tmpCard[key] = info[j];
                        }
                        teacherCardsToAdd.push(tmpCard);

                        // 需要更新非学生
                    } else {
                        let tmpCard = angular.copy(_teacherCards[index + i]);
                        for (let j = 0; j < info.length; ++j) {
                            let key = keys[column + j - 1];
                            tmpCard[key] = info[j];
                        }
                        teacherCardsToUpdate.push(tmpCard);
                    }
                }

                for (let card of teacherCardsToUpdate) {
                    updateCard(card);
                }

                for (let card of teacherCardsToAdd) {
                    addCard(card);
                }
            }
        };

        $scope.startWaitingBind = function (card) {
            // 检测基站是否连接
            if (!checkStationConnection()) {
                alertMsg(APP_ALERT.station_unconn, 2000);
                return;
            }

            startWaitingBind(card);
        };

        $scope.rebindTeacherCard = function (card) {
            card.cardId = "";
            startWaitingBind(card);
        };

        /**
         * @desc 获取所有的老师卡
         * @returns {Array}
         */
        $scope.getTeacherCards = function () {
            return _teacherCards;
        };

        $scope.getVersion = function () {
            return APP_CONFIG.version;
        };

        function reset () {
            _teacherCards = [];
            _teacherCardsToAdd    = [];
            _teacherCardsToDelete = [];
            _teacherCardsToUpdate = [];

            _isWaitingBind = false;

            if (_persistTimeoutId != null) {
                $timeout.cancel(_persistTimeoutId);
                _persistTimeoutId = null;
            }
        }

        function init () {
            reset();

            _teacherCards = UserService.getTeacherCards();
            for (let card of _teacherCards) {
                card.available = !!card.cardId ? 2 : 0;
            }

            startPersist();

            disableFixedTableHeader();
            fixedTableHeader();
        }

        function startPersist () {
            _persistTimeoutId = $timeout(()=>{
                persistData();
                startPersist();
            }, 10000);
        }


        function startWaitingBind (teacherCard) {
            cancelWaitingBind();

            _isWaitingBind = true;
            teacherCard.available = 1;
        }

        function cancelWaitingBind () {
            _isWaitingBind = false;

            let cards = _teacherCards;
            for (let card of cards) {
                card.available = !!card.cardId ? 2 : 0;
            }
        }

        function isWaitingBind () {
            return _isWaitingBind;
        }

        function isCardBindAsTeacher (cardId) {
            if (cardId === "") {
                return false;
            }

            let cards = _teacherCards;
            for (let card of cards) {
                if (card._id === cardId) {
                    return true;
                }
            }
            return false;
        }


        function bindTeacherCard (cardId) {
            // 检查教师卡是否合法
            if (!ValidationService.checkTeacherCardId(cardId)) {
                return {
                    success: false,
                    msg: "卡号格式不合法",
                };
            }

            // 判断卡是否已经被绑定为教师
            if (isCardBindAsTeacher(cardId)) {
                let index = getIndexOfCardInCards(cardId);
                let msg = cardId + "已经被绑定为" + (index + 1) + "号老师";

                return {
                    success: false,
                    msg: msg,
                };
            }

            // 判断卡是否已经被绑定为学生
            if (isCardBindAsStudents(cardId)) {
                return {
                    success: false,
                    msg: APP_ALERT.card_binded_student,
                };
            }

            let cards = _teacherCards;
            for (let card of cards) {
                if (card.available === 1) {
                    card.cardId = cardId;
                    card.available = 2;
                    updateCard(card);
                    break;
                }
            }
            cancelWaitingBind();

            return {
                success: true
            };
        }

        function isCardBindAsTeacher (cardId) {
            if (cardId === "") {
                return false;
            }

            for (let i = 0, len = _teacherCards.length; i < len; ++i) {
                let tmpCard = _teacherCards[i];

                if (tmpCard.cardId === cardId && tmpCard.available !== 1) {
                    return true;
                }
            }
            return false;
        }

        function isCardBindAsStudents (cardId) {
            return UserService.isCardBindAsStudent(cardId);
        }

        function addCard (card) {
            addCardToCards(card);
            addCardToCardsToAdd(card);
        }

        function updateCard (card) {
            updateCardInCards(card);

            if (isCardToAdd(card)) {
                updateCardInCardsToAdd(card);
            } else if (isCardToUpdate(card)) {
                updateCardInCardsToUpdate(card);
            } else {
                addCardToCardsToUpdate(card);
            }
        }

        function removeCard (card) {
            removeCardFromCards(card);

            // 删除的卡是之前新增加的卡
            if (isCardToAdd(card)) {
                removeCardFromCardsToAdd(card);

            } else if (isCardToUpdate(card)) {
                removeCardFromCardsToUpdate(card);
                addCardToCardsToDelete(card);
            } else {
                addCardToCardsToDelete(card);
            }
        }

        function isCardToAdd (card) {
            for (let tmpCard of _teacherCardsToAdd) {
                if (card._id === tmpCard._id) {
                    return true;
                }
            }
            return false;
        }

        function getIndexOfCardInCards (cardId) {
            for (let i = 0, len = _teacherCards.length; i < len; ++i) {
                let tmpCard = _teacherCards[i];

                if (tmpCard.cardId === cardId) {
                    return i;
                }
            }
            return -1;
        }

        function addCardToCards (card) {
            _teacherCards.push(card);
        }

        function updateCardInCards (card) {
            for (let i = 0, len = _teacherCards.length; i < len; ++i) {
                let tmpCard = _teacherCards[i];
                if (tmpCard._id === card._id) {
                    _teacherCards[i] = card;
                    break;
                }
            }
        }

        function removeCardFromCards (card) {
            for (let i = 0, len = _teacherCards.length; i < len; ++i) {
                let tmpCard = _teacherCards[i];
                if (tmpCard._id === card._id) {
                    _teacherCards.splice(i, 1);
                    break;
                }
            }
        }

        function addCardToCardsToAdd (card) {
            _teacherCardsToAdd.push(card);
        }

        function updateCardInCardsToAdd (card) {
            for (let i = 0, len = _teacherCardsToAdd.length; i < len; ++i) {
                let tmpCard = _teacherCardsToAdd[i];
                if (tmpCard._id === card._id) {
                    _teacherCardsToAdd[i] = card;
                    break;
                }
            }
        }

        function removeCardFromCardsToAdd (card) {
            for (let i = 0, len = _teacherCardsToAdd.length; i < len; ++i) {
                let tmpCard = _teacherCardsToAdd[i];
                if (tmpCard._id === card._id) {
                    _teacherCardsToAdd.splice(i, 1);
                    break;
                }
            }
        }

        function isCardToUpdate (card) {
            for (let tmpCard of _teacherCardsToUpdate) {
                if (card._id === tmpCard._id) {
                    return true;
                }
            }
            return false;
        }

        function addCardToCardsToUpdate (card) {
            _teacherCardsToUpdate.push(card);
        }

        function updateCardInCardsToUpdate (card) {
            for (let i = 0, len = _teacherCardsToUpdate.length; i < len; ++i) {
                let tmpCard = _teacherCardsToUpdate[i];
                if (tmpCard._id === card._id) {
                    _teacherCardsToUpdate[i] = card;
                    break;
                }
            }
        }

        function removeCardFromCardsToUpdate (card) {
            for (let i = 0, len = _teacherCardsToUpdate.length; i < len; ++i) {
                let tmpCard = _teacherCardsToUpdate[i];
                if (tmpCard._id === card._id) {
                    _teacherCardsToUpdate.splice(i, 1);
                    break;
                }
            }
        }

        function isCardToDelete (card) {
            for (let tmpCard of _teacherCardsToDelete) {
                if (card._id === tmpCard._id) {
                    return true;
                }
            }
            return false;
        }

        function addCardToCardsToDelete (card) {
            _teacherCardsToDelete.push(card);
        }

        function removeCardFromCardsToDelete (card) {
            for (let i = 0, len = _teacherCardsToDelete.length; i < len; ++i) {
                let tmpCard = _teacherCardsToDelete[i];
                if (tmpCard._id === card._id) {
                    _teacherCardsToDelete.splice(i, 1);
                    break;
                }
            }
        }

        function persistData () {
            console.log("teacher card persist");
            let teacher = UserService.getTeacher();

            let promises = [];
            let p = null;

            if (_teacherCardsToAdd.length > 0) {
                p = DataService.addTeacherCards(teacher, _teacherCardsToAdd);
            } else {
                p = $q.resolve();
            }
            promises.push(p);

            if (_teacherCardsToUpdate.length > 0) {
                p = DataService.updateTeacherCards(_teacherCardsToUpdate);
            } else {
                p = $q.resolve();
            }
            promises.push(p);

            if (_teacherCardsToDelete.length > 0) {
                p = DataService.deleteTeacherCards(teacher, _teacherCardsToDelete);
            } else {
                p = $q.resolve();
            }
            promises.push(p);

            _teacherCardsToAdd    = [];
            _teacherCardsToUpdate = [];
            _teacherCardsToDelete = [];

            $q.all(promises).then(()=>{
                console.log("teacher card persist success");
            }).catch(err=>{
                console.error(err);
            });
        }



        /**
         * @desc 创建一个默认的教师卡
         * @returns {{_id: *, name: string, cardId: string, createTime: number, available: number}}
         */
        function createDefaultTeacherCard () {
            return {
                _id: Uuid.v4(),
                name:'新教师',
                cardId:'',
                createTime: Date.now(),
                available:0,
            };
        }


        /**
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-teacher-card-table-wrapper");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-teacher-card-table-wrapper");
            let tableHeader = document.querySelector(".xy-teacher-card-info-header");

            let offset = innerWrapper.scrollTop;
            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-teacher-card-table-wrapper");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table到底
         */
        function scrollTableToBottom () {
            // 之所以用$timeout是因为这个时候界面中还没有添加新的学生
            // 使用异步是用来在学生被添加之后，再去将table滚到最后
            $timeout(function(){
                let innerWrapper = document.querySelector(".xy-teacher-card-table-wrapper");
                innerWrapper.scrollTop = innerWrapper.scrollHeight;
            }, 10);
        }

        /**
         * 检查基站是否连接
         */
        function checkStationConnection(){
            if(!StationService.checkStation()){

                alertMsg(APP_ALERT.station_unconn);
                return false;
            }
            return true;
        }

        /**
         * 基站连接成功的回调
         */
        function onStationConnection(){
            if(StationService.checkStation()){
                alertMsg(APP_ALERT.station_conn);
                StationService.initDeviceMode();
            }
        }

        /**
         * 弹出提示信息
         * @param msg
         * @param interval
         */
        function alertMsg(msg, interval) {
            if(!interval){
                interval=1000;
            }

            $timeout(()=>{
                $scope.alerting=true;
                $scope.alertContent=msg;
            });
            $timeout(()=>{
                $scope.alerting=false;
            },interval);
        }

        function handleTeacherCardCommand (command) {
            switch (command) {
                case APP_CARD_COMMANDS.esc:
                    WindowService.backToWindow();
                    break;

                case APP_CARD_COMMANDS.triggerWindow:
                    WindowService.triggerWindow();
                    break;

                case APP_CARD_COMMANDS.random:
                    openRandomRollPage();
                    break;

                case APP_CARD_COMMANDS.classAnswer:
                    openClassAnswerPage();
                    break;

                case APP_CARD_COMMANDS.rush:
                    openRushAnswerPage();
                    break;

            }
        }

        /**
         * @desc 判断当前的课程是否有学生
         */
        function isCurtCourseHasStudents(){
            let students = UserService.getCurrentCourseStudents();
            return students.length > 0;
        }

        

        function openRandomRollPage () {
            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.randomRoll, false);
        }

        function openClassAnswerPage () {
            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()
                && UserService.isNormal()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.classAnswer, false);
        }

        function openRushAnswerPage () {
            if(!checkStationConnection()){
                //如果没有连接基站
                return;
            }

            if(!UserService.isNormal()){
                //如果当前不是公开课
                return;
            }

            // 非公开课没有学生情况下的处理
            if (!isCurtCourseHasStudents()) {
                return;
            }

            WindowService.backToHome();
            WindowService.enterToWindow(APP_WINDOWS.rushAnswer, false);
        }
    }]
);
