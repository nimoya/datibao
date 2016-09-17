/**
* @ignore  =====================================================================================
* @fileoverview 学生卡的服务
* @author  沈奥林
* @version 1.0
* @ignore  created in 2016/6/18
* @ignore  depend 
* @ignore  =====================================================================================
*/

angular.module('DTB').service('StudentCardService',[
    '$rootScope',
    '$q',
    '$timeout',
    'UserService',
    'WindowService',
    'StudentTable',

    function (
            $rootScope,
            $q,
            $timeout,
            UserService,
            WindowService,
            StudentTable) {

        let isWaitingBind=false;

        /**
         * 设置是否可接收绑卡
         */
        var setWaitingBind=function (value) {
            isWaitingBind=value;
        };

        this.setWaitingBind = setWaitingBind;

        var getID= function (data) {
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
         * 获得是否在接受绑卡
         * @returns {boolean}
         */
        var getWaitingStatus=function () {
            return isWaitingBind;
        };

        this.getWaitingStatus = getWaitingStatus;


        this.startBindCard=function () {
            setWaitingBind(true);
        };

        /**
         * @desc 取消绑定等待
         */
        this.cancelWaitingBind = function () {
            setWaitingBind(false);
        };

        /**
         * 根据卡号绑定学生
         * @param cardId    卡的id
         * @param index     学生序号
         * @param courseVal 课程号
         * @param cb        回调,参数是错误信息
         */
        // this.bindStudentCard=function (cardId,courseVal,cb) {
        //     if(!getWaitingStatus()){
        //         cb&&cb(APP_ALERT.no_receiver);
        //         return;
        //     }
        //
        //     //注意,这里的course对象是拷贝
        //     let course=UserService.getCourseByValue(courseVal);
        //     if(!course){
        //         cb&&cb(APP_ALERT.get_course_err);
        //         return;
        //     }
        //     for(let index in course.students){
        //         //卡片已经绑定,则报异常
        //         let student=course.students[index];
        //         if(student.cardId==cardId&&student.available!=1){
        //             cb&&cb(APP_ALERT.card_binded,index);
        //             return;
        //         }
        //     }
        //
        //     //寻找处于待绑定的卡进行绑定操作
        //     for(let index in course.students){
        //         let student=UserService.getStudent(index,courseVal);
        //
        //         if(student.available==1){
        //
        //             student.cardId=cardId;
        //             student.available=2;
        //             setWaitingBind(false);
        //             cb&&cb();
        //             return;
        //         }
        //     }
        //     cb&&cb(APP_ALERT.no_receiver);
        // };

        this.bindStudentCard=function () {
            if(!getWaitingStatus()){
                return;
            }

            setWaitingBind(false);

            // cb&&cb(APP_ALERT.no_receiver);
        };



        this.isCardBindAsStudent = function (cardId) {
            return new $q((resolve, reject)=>{
                StudentTable.getStudentsByCardId(cardId).then((students)=>{
                    resolve(students.length > 0);
                }).catch(reject);
            });
        };

        /**
         * 清除学生的待绑卡状态
         */
        this.refreshStudents=function () {
            setWaitingBind(false);
            let courses=UserService.getCourses();
            for(let course of courses){
                for(let index in course.students){
                    let student=UserService.getStudent(index,course.value);
                    if(student.available==1){
                        //学生状态恢复已绑卡或未绑卡
                        student.available=student.cardId?2:0;
                    }
                }
            }
        };

        // /**
        //  * @decs 通过学号来标记学生已经到场了
        //  * @param data
        //  */
        // this.markStudentBePresentBySignal = function (data) {
        //     if (data[4] != 0) {
        //         return;
        //     }
        //
        //     let cardId = getID(data);
        //
        //     // 标记某个学生现在已经在场了，对于还没有绑定的卡而已
        //     // 因为记录中没有卡号，所以不会起作用
        //     // 又因为这里已经超出了angular的上下文，所以需要用$timeout
        //     $timeout(function(){
        //         UserService.markStudentBePresentByCardId(cardId);
        //     });
        // };

        function getOptions (data) {
            let options = [];

            if ((data[5] & 1) > 0) {
                options.push("A");
            }

            if ((data[5] & 2) > 0) {
                options.push("B");
            }

            if ((data[5] & 8) > 0) {
                options.push("C");
            }

            if ((data[5] & 16) > 0) {
                options.push("D");
            }

            if ((data[6] & 1) > 0) {
                options.push("E");
            }

            if ((data[6] & 2) > 0) {
                options.push("F");
            }

            if ((data[6] & 4) > 0) {
                options.push("G");
            }

            if ((data[5] & 4) > 0) {
                // $表示对号
                options.push("$");
            }

            if ((data[5] & 32) > 0) {
                // $表示错号
                options.push("^");
            }

            return options;
        }

        // 获取选择题所有可选择的选项
        this.getSelectOptions = function () {
            return [
                "A", "B", "C", "D", "E", "F", "G"
            ];
        };

        /**
         * @desc 获取判断题的选项
         * @returns {string[]}
         */
        this.getTrueFalseOptions = function () {
            return [
                "$", "^"
            ];
        };

        function getQuestionNumber (data) {
            return data[7];
        }
        /**
         * 将硬件传来的信息进行广播
         * @param data
         */
        this.broadcastStudent=function (data) {
            var command = data[4];
            let cardId = getID(data);
            
            switch (command) {
                case 0xf0:
                    break;
                case 0xf1:
                    break;
                case 0xf2:
                    break;
                case 0xf3:
                    break;
                case 0xfa:
                    break;
                case 0xfb:
                    break;
                case 0xfc:
                    break;
                case 0xfd:
                    break;
                case 0xe0:
                    break;
                case 0xe1:
                    break;
                case 0xe2:
                    break;
                case 0xe3:
                    break;
                case 0xe4:
                    break;
                case 0xe5:
                    break;
                case 0xe6:
                    break;
                case 0x01:
                    break;
                case 0xc0:
                    //心跳包

                    break;
                case 0xc1:
                    break;
                case 0xa6:
                case 0xa8:
                    //答题和绑定
                {
                    let info={
                        cardId: cardId,
                        opt    : getOptions(data),
                        number: getQuestionNumber(data)
                    };
                    let currentWindow=WindowService.getCurrentWindow();
                    if(currentWindow){
                        if (command == 0xa6) {
                            // 学生卡绑定为教师卡
                            if (UserService.isCardBindAsTeacher(cardId)) {
                                $rootScope.$emit(APP_EVENTS.onQuestionAnswerSet,{
                                    data:info,
                                    target:currentWindow.name
                                });
                            } else {
                                $rootScope.$emit(APP_EVENTS.onStudentAnswered,{
                                    data:info,
                                    target:currentWindow.name
                                });
                            }
                        }
                        else {
                            $rootScope.$emit(APP_EVENTS.onStudentBind,{
                                data:info,
                                target:currentWindow.name
                            });
                        }
                    }

                }
                    break;
                case 0xc2:
                    break;
                case 0xc3:
                    break;
                case 0xc4:
                    break;
                case 0xc5:
                    break;
                case 0xc6:
                    break;
                case 0xef:
                    break;
                case 0xd0:
                    break;
                case 0xd1:
                    break;
                case 0xd2:
                    break;
            }
        };
    }]
);