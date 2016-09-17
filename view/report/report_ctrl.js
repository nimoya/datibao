/**
 * @fileOverview 报告的控制器
 * @author 邓俊生   16/6/2
 * @version 0.1
 */
angular.module("DTB").controller('ReportCtrl',[
    '$scope',
    '$q',
    '$timeout',
    '$uibModal',
    'WindowService',
    'TeacherCardService',
    'UserService',
    'StationService',
    'RecordService',
    'Timer',
    'DataService',
    'NetworkService',
    'QuestionResultModel',
    'ReportPromptDialogModel',

    function (
        $scope,
        $q,
        $timeout,
        $uibModal,
        WindowService,
        TeacherCardService,
        UserService,
        StationService,
        RecordService,
        Timer,
        DataService,
        NetworkService,
        QuestionResultModel,
        ReportPromptDialogModel
    ) {

        $scope.$on(APP_EVENTS.onWindowOpened,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();
            init();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowBacked,()=>{
            // 这里之所以先将窗口隐藏再显示的原因
            // 是用来解决，页面加载的时候出现部分透明
            // 的情况，通过先隐藏再显示的方式能够重新渲染界面解决问题
            nw.Window.get().hide();

            $timeout(function(){
                nw.Window.get().show();
            });
        });

        $scope.$on(APP_EVENTS.onWindowClosed,()=>{
           reset();
        });

        $scope.$on(APP_EVENTS.onTeacherCommanded, (event, data) => {
            // 对九键教师卡的按键进行响应的处理
            // 对九键教师卡的按钮进行响应
            if( data.type == 1 ){
                let command = TeacherCardService.getCommandByOpt(data.opt);

                // 该卡没有绑定或当前窗口隐藏情况下并且命令不是triggerWindow的情况下不做处理
                if (!UserService.isCardBindAsTeacher(data.cardId)
                    || (!WindowService.isShowing()
                    && command !== APP_CARD_COMMANDS.triggerWindow )) {
                    return;
                }

                handleTeacherCardCommand(command);
            }
        });

        $scope.$on(APP_EVENTS.onRCDCommanded, (event, command)=>{
            if (!WindowService.isShowing()
                && command !== APP_CARD_COMMANDS.triggerWindow) {
                return;
            }

            handleTeacherCardCommand(command);
        });

        const STUDENTS_TO_DISPLAY_INCREMENT = 20;

        const EXCELLENT   = "excellent";
        const GOOD        = "good";
        const QUALIFIED   = "qualified";
        const UNQUALIFIED = "unqualified";

        // 用来生成错题报告的中间变量
        let _errorQuestionRecordData = {};

        $scope.numberOfStudentsToDisplay = 0;

        $scope.date = new Date();
        $scope.dateEnd=new Date();
        $scope.students  = [];
        $scope.questions = [];
        $scope.curtCourse = {};

        // date picker 的配置信息
        $scope.dateOptions = {
            formatYear: 'yy',
            maxDate: new Date(),
            startingDay: 1,
            maxMode: "day",
            minMode: "day",
            showWeeks: false,

        };

        $scope.format = "yyyy-MM-dd";
        $scope.altInputFormats = ['M!/d!/yyyy'];
        $scope.dataPickerOpen = false;
        $scope.dataEndPickerOpen=false;
        // 监听日期的变化，来更新当前的显示的数据
        $scope.$watch("date", function (newDate, oldDate) {
            if (newDate == null) {//日期没有变化
                $scope.date = oldDate;
                return;
            }

            if (oldDate ==  null
                || (newDate.getFullYear() === oldDate.getFullYear()
                && newDate.getMonth() === oldDate.getMonth()
                && newDate.getDate() === oldDate.getDate())) {
                return;
            }
            if(Date.parse($scope.date)>Date.parse($scope.dateEnd)){
                $scope.dateEnd=$scope.date;
            }

            // 更新数据
            updateData().then(()=>{
                let students = $scope.students || [];
                initStudentNumberToDisplay(students.length);
            }).catch(err=>{
                console.error(err);
            });
        }, true);

        $scope.$watch("dateEnd", function (newDate, oldDate) {
            if (newDate == null) {//日期没有变化
                $scope.dateEnd = oldDate;
                return;
            }

            if (oldDate ==  null
                || (newDate.getFullYear() === oldDate.getFullYear()
                && newDate.getMonth() === oldDate.getMonth()
                && newDate.getDate() === oldDate.getDate())) {
                return;
            }
            if(Date.parse($scope.date)>Date.parse($scope.dateEnd)){
                $scope.date=$scope.dateEnd;
            }
            updateData();//更新数据
        }, true);

        $scope.openDatePicker = function() {
            $scope.dataPickerOpen = true;
        };

        $scope.openDateEndPicker = function() {
            $scope.dataEndPickerOpen = true;
        };

        $scope.getNumOfExcellentStudents = function () {
            return getNumOfStudentsByType(EXCELLENT);
        };

        $scope.getNumOfGoodStudents = function () {
            return getNumOfStudentsByType(GOOD);
        };

        $scope.getNumOfQualifiedStudents = function () {
            return getNumOfStudentsByType(QUALIFIED);
        };

        $scope.getNumOfUnqualifiedStudents = function () {
            return getNumOfStudentsByType(UNQUALIFIED);
        };

        $scope.getStudentRecordIndexArr = function (student) {
            let arr = [];
            for (let i = 0, len = student.records.length; i < len; ++i) {
                arr.push(i);
            }
            return arr;
        };

        $scope.getStudentRecordByIndex = function (student, index) {
            return student.records[index];
        };

        $scope.generateErrorQuestionReport = function (input) {
            let filePath = input.value;
            // 将input的value设置为null，主要是防止input相同的文件名，不触发onchange事件
            input.value = null;
            let data    = angular.copy(_errorQuestionRecordData || {});
            let records = data.records || [];

            let imagePromises = [];
            for (let i = 0, len = records.length; i < len; ++i) {
                records[i].index = i + 1;
                let p = DataService.fetchImage(records[i].image);

                imagePromises.push(p);
            }

            $q.all(imagePromises).then((images)=>{
                let binaryImages = {};
                for (let i = 0, len = images.length; i < len; ++i) {
                    binaryImages[records[i].image] = images[i];
                }

                return binaryImages;
            }).then(imagesMap => {

                let fs = require('fs');
                let path = require('path');
                let Docxtemplater = require('docxtemplater');
                let ImageModule = require('docxtemplater-image-module');

                let imageModule = new ImageModule({
                    centered: false,
                    getImage: function(imagePath, tagName) {
                        return imagesMap[imagePath];
                    },
                    getSize: function(img, imagePath, tagName) {
                        return [550,300];
                    }
                });

                let templateDirPath = path.dirname(process.execPath);
                let content = fs.readFileSync(path.join(templateDirPath, "docx_template/error_question_report.docx"), "binary");

                let doc = new Docxtemplater(content)
                    .attachModule(imageModule)
                    .setData(data);
                doc.render();

                let buf = doc.getZip().generate({type:"nodebuffer"});

                fs.writeFileSync(filePath, buf)
            }).catch(err=>{
                console.error(err);
            });
            ;

            _errorQuestionRecordData = {};
        };


        /**
         * @desc 画出report
         */
        $scope.drawReport=function($event, student){
            //需要先找出该student的所有错题
            let errorQuestionRecords = [];

            let records = student.records;

            for (let i = 0, len = records.length; i < len; ++i) {
                let record=records[i];
                if (record == null) {
                    continue;
                }
                if(record.isRight==0){
                    let errorQuestionRecord = {
                        studentName: student.name,
                        correctAnswer: "",
                        analysis: "无"
                    };
                    if (record.answer === "$") {
                        errorQuestionRecord.studentAnswer = "√";
                    } else if (record.answer === "^") {
                        errorQuestionRecord.studentAnswer = "×";
                    } else {
                        errorQuestionRecord.studentAnswer = record.answer;
                    }

                    //接下来需要找到对应的错题
                    let questions = $scope.questions || [];

                    for(let j=0; j< questions.length; j++){
                        let question = questions[j];
                        if(question._id == record.question){
                            errorQuestionRecord.correctRate=(parseFloat(question.rate) * 100).toFixed(1) + "%";
                            errorQuestionRecord.image = question.file || "img/default_question.png";

                            if (question.answer) {
                                if (question.answer === "$") {
                                    errorQuestionRecord.correctAnswer = "√";
                                } else if (question.answer === "^") {
                                    errorQuestionRecord.correctAnswer = "×";
                                } else {
                                    errorQuestionRecord.correctAnswer = question.answer;
                                }
                            }

                            if (question.analysis) {
                                errorQuestionRecord.analysis = question.analysis;
                            }

                            break;
                        }
                    }

                    errorQuestionRecords.push(errorQuestionRecord);
                }
            }

            if (errorQuestionRecords.length <= 0) {
                ReportPromptDialogModel.reset();
                ReportPromptDialogModel.setMessage("该时间段内，" + student.name + "没有错题");
                $uibModal.open({
                    animation:true,
                    openedClass: "xy-report-prompt",
                    templateUrl:'view/report/prompt_dialog/prompt_dialog.html',
                    size:'sm',
                    controller:'ReportPromptDialog'
                });
            } else {
                _errorQuestionRecordData = {
                    courseName: $scope.curtCourse.name,
                    startDate:Timer.translateDateString(parseInt($scope.date.getTime())),
                    endDate:Timer.translateDateString(parseInt($scope.dateEnd.getTime())),
                    studentName: student.name,
                    records: errorQuestionRecords
                };
                let input = $event.currentTarget.parentNode.querySelector("input[type=file]");
                input.nwsaveas=student.name+'同学的错题报告';
                triggerInputFileClickEvent(input);
            }
        };


        function triggerInputFileClickEvent (input) {
            $timeout(function(input){
                let event = new MouseEvent("click", {
                    bubbles: false,
                    cancelable: true
                });
                input.dispatchEvent(event);
            }, 0 ,false, input);
        }

        /**
         * @desc 判断当前是否有课程
         * @returns {boolean}
         */
        $scope.hasQuestions = function () {
            return $scope.questions.length > 0;
        };

        $scope.onTableScroll = function (data) {
            let scrollTop    = data.scrollTop;
            let scrollHeight = data.scrollHeight;
            let offsetHeight = data.offsetHeight;

            let students = $scope.students || [];

            if (scrollHeight - offsetHeight - scrollTop < 100) {
                if ($scope.numberOfStudentsToDisplay + STUDENTS_TO_DISPLAY_INCREMENT > students.length) {
                    $scope.numberOfStudentsToDisplay = students.length;
                } else {
                    $scope.numberOfStudentsToDisplay += STUDENTS_TO_DISPLAY_INCREMENT;
                }
            }
        };

        /**
         * @desc 获取指定类型学生的数目
         * @param type
         * @returns {number}
         */
        function getNumOfStudentsByType (type) {
            let num = 0;
            for (let stu of $scope.students) {
                if (type === stu.type) {
                    ++num;
                }
            }
            return num;
        }


        function reset () {
            $scope.date = new Date();
            $scope.dateEnd=new Date();
            $scope.students = [];

            $scope.curtCourse = {};

            $scope.dataPickerOpen = false;
            $scope.dataEndPickerOpen=false;

            $scope.numberOfStudentsToDisplay = 0;

            scrollTableToTop();
        }

        /**
         * @desc 获取某个课程的学生
         * @param course
         * @returns {$q|*}
         */
        function fetchStudentsByCourse (course) {
            return new $q((resolve, reject)=>{
                try {
                    let students = UserService.getStudentsByCourseId(course._id);
                    resolve(students);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @desc 获取某个班级在某个日期前（包括当天）创建的学生
         * @param course
         * @param date
         * @returns {$q|*}
         */
        function fetchStudentsByCourseAndBeforeDate(course, date) {
            return new Promise((resolve, reject)=>{
                try {
                    let students = UserService.getStudentsByCourseIdAndBeforeDate(course._id, date);
                    resolve(students);
                } catch (err) {
                    reject(err);
                }
            });
        }

        function openQuestionResult() {
            WindowService.enterToWindow('questionResult');
        }

        /**
         * @desc 更新整个界面的数据
         */
        function updateData () {
            return new $q((resolve, reject)=>{
                $scope.loadingShow=true;

                let course = $scope.curtCourse = UserService.getCurrentCourse();

                DataService.fetchReports(course, $scope.date,$scope.dateEnd).then((data)=>{
                    let questions = $scope.questions = data.questions || [];

                    initChart(questions);

                    let students = data.students || [];
                    // 下面的代码是用来
                    for (let stu of students) {
                        let numCorrectRecords = 0;
                        let numParticipateRecords=0;
                        let records = stu.records;
                        for (let i = 0, len = records.length; i < len; ++i) {
                            let record = records[i];
                            // 该学生对于某个问题没有回答记录（主要原因是因为这个学生是后加的）
                            if (record == null) {
                                continue;
                            }

                            if(record.answer){
                                numParticipateRecords++;
                            }

                            if (parseInt(record.isRight) === 1) {
                                ++numCorrectRecords;
                            }
                        }

                        let participateRate=0;
                        if (questions.length > 0) {
                            participateRate = numParticipateRecords / questions.length;
                        }

                        let correctRate = 0;
                        if (numParticipateRecords > 0) {
                            correctRate = numCorrectRecords / numParticipateRecords;
                        }

                        stu.correctRate = correctRate;
                        stu.participateRate=participateRate;

                        if (correctRate > 0.85) {
                            stu.type = EXCELLENT;
                        } else if (correctRate > 0.7) {
                            stu.type = GOOD;
                        } else if (correctRate > 0.6) {
                            stu.type = QUALIFIED;
                        } else {
                            stu.type = UNQUALIFIED;
                        }
                    }

                    students.sort(function(stu1, stu2){
                        return stu2.correctRate - stu1.correctRate;
                    });

                    $scope.students  = students;
                    $scope.loadingShow=false;

                    resolve();
                }).catch(reject);
            });
        }

        /**
         * @desc 初始化echart
         */
        function initChart (questions){
            questions = angular.copy(questions || []);
            questions.sort((q1, q2)=>{
                return q1.createTime.localeCompare(q2.createTime);
            });

            if(questions.length>0) {
                let title = [];
                let pRateValue = [];
                let rateValue=[];

                let prevDate = new Date(0);
                let curtDate = null;
                let index = 0;
                for (let i = 0; i < questions.length; i++) {
                    let myQuestion = questions[i];
                    curtDate = new Date(parseInt(myQuestion.createTime));
                    if (curtDate.getFullYear() === prevDate.getFullYear()
                            && curtDate.getMonth() === prevDate.getMonth()
                                && curtDate.getDate() === prevDate.getDate()) {
                        index++;
                    } else {
                        index = 1;
                    }

                    let year     = curtDate.getFullYear();
                    let yearStr  = year + "";
                    
                    let month    = curtDate.getMonth();
                    let monthStr = (month + 1) + "";
                    if (monthStr < 9) {
                        monthStr = "0" + monthStr;
                    }
                    let date    = curtDate.getDate();
                    let dateStr = date + "";
                    if (date < 10) {
                        dateStr = "0" + dateStr;
                    }

                    title.push(yearStr + "-" + monthStr + "-" + dateStr + " 第" + index + "题");
                    pRateValue.push((parseFloat(myQuestion.pRate) * 100).toFixed(1));

                    rateValue.push((parseFloat(myQuestion.rate) * 100).toFixed(1));

                    prevDate = curtDate;
                }

                // 基于准备好的dom，初始化echarts实例
                var myChart = echarts.init(document.getElementById('chart-container'));
                // 指定图表的配置项和数据
                var endLen;
                if(questions.length<7){
                    endLen=100;
                }
                else if(questions.length<20){
                    endLen=60;
                }
                else if(questions.length<30){
                    endLen=50;
                }
                else if(questions.length<40){
                    endLen=30;
                }
                else if(questions.length<60){
                    endLen=20;
                }
                else{
                    endLen=10;
                }
                var option = {
                    title: {
                        text: ''
                    },
                    tooltip: {
                        formatter: "{a}<br />{b}: {c}%"
                    },
                    legend: {
                        data: ['正确率','参与率']
                    },
                    grid: { // 控制图的大小，调整下面这些值就可以，
                        left:45,
                        right:10,
                        y2: 70// y2可以控制 X轴跟Zoom控件之间的间隔，避免以为倾斜后造成 label重叠到zoom上
                    },
                    dataZoom: [
                        {   // 这个dataZoom组件，默认控制x轴。
                            type: 'slider', // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                            end:endLen,
                            start: 0     // 左边在 10% 的位置。
                            // end: 60         // 右边在 60% 的位置。
                        }
                    ],

                    xAxis: {
                        type : 'category',
                        data: title,
                        triggerEvent: true
                    },

                    yAxis: {
                        max:100,
                        axisLabel: {
                            show: true,
                            interval: 'auto',
                            formatter: function (value, index) {
                                return (parseFloat(value)).toFixed(0) + "%";
                                }

                        }
                    },

                    series: [
                        {
                            name: '正确率',
                            type: 'bar',
                            barMaxWidth:30,
                            data: rateValue,
                            itemStyle: {
                                normal: {
                                    color: function (params) {

                                        // build a color map as your need.
                                        var colorList = [
                                            '#46e895','#14e1da','#fed267','#ff896f'
                                        ];
                                        let colorIndex=0;
                                        if(params.data>=85) {
                                            colorIndex = 0;
                                        }
                                        else if(params.data>=70){
                                            colorIndex = 1;
                                        }
                                        else if(params.data>=60){
                                            colorIndex=2;
                                        }
                                        else{
                                            colorIndex=3;
                                        }
                                        return colorList[colorIndex]
                                    }
                                }
                            }
                        },
                        {
                            name:'参与率',
                            type:'line',
                            data:pRateValue,
                        }
                    ]
                };

                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(option);

                myChart.on('click', function (params) {
                    if (params.componentType === 'series') {
                        if (params.seriesType === 'bar'||params.seriesType=='line') {
                            //可以通过dataindex知道用户想了解哪道题目的具体情况
                            let questionIndex = params.dataIndex;
                            let dateTime=Timer.translateDateString(parseInt($scope.questions[questionIndex].createTime));
                            let number=1;
                            let i=questionIndex;
                            while(i>0&&Timer.translateDateString(parseInt($scope.questions[i-1].createTime))==
                            dateTime){
                                i--;
                                number++;
                            }
                            QuestionResultModel.reset();
                            QuestionResultModel.setCourse($scope.curtCourse);
                            QuestionResultModel.setTheNumber(number);
                            QuestionResultModel.setTheQuestionIndex(questionIndex);
                            QuestionResultModel.setTheQuestion($scope.questions[questionIndex]);
                            QuestionResultModel.setTheStudents($scope.students);
                            openQuestionResult();
                        }
                    } else if (params.componentType === 'xAxis') {
                        let regExp   = /(\d+)\-(\d+)\-(\d+)[^\d]*(\d+)/;
                        let matchRet = regExp.exec(params.value);
                        if (matchRet && matchRet.length > 0) {
                            let year = parseInt(matchRet[1]);
                            let month = parseInt(matchRet[2]) -1;
                            let day  = parseInt(matchRet[3]);
                            let index = parseInt(matchRet[4]) - 1 ;

                            let questions = angular.copy($scope.questions || []);
                                questions.sort((q1, q2)=>{
                                    return q1.createTime.localeCompare(q2.createTime);
                                });

                            let questionIndex = -1;
                            let tmpIndex = 0;
                            for (let i = 0, len = questions.length; i < len; ++i) {
                                let question = questions[i];
                                let qDate = new Date(parseInt(question.createTime));
                                if (qDate.getFullYear() === year
                                        && qDate.getMonth() === month
                                            && qDate.getDate() === day) {
                                    if (tmpIndex === index) {
                                        questionIndex = i;
                                        break;
                                    } else {
                                        tmpIndex++;
                                    }
                                }
                            }

                            QuestionResultModel.reset();
                            QuestionResultModel.setCourse($scope.curtCourse);
                            QuestionResultModel.setTheNumber(index + 1);
                            QuestionResultModel.setTheQuestionIndex(questionIndex);
                            QuestionResultModel.setTheQuestion(questions[questionIndex]);
                            QuestionResultModel.setTheStudents($scope.students);
                            openQuestionResult();
                        }
                    }

                });
            }
        }


        /**
         * @desc 初始化方法
         */
        function init(){
            reset();

            // 先清除，然后在设置固定table header
            disableFixedTableHeader();
            fixedTableHeader();

            updateData().then(()=>{
                let students = $scope.students || [];
                initStudentNumberToDisplay(students.length);
            }).catch(err=>{
                console.error(err);
            });
        }

        function initStudentNumberToDisplay (studentsCount) {
            $scope.numberOfStudentsToDisplay = STUDENTS_TO_DISPLAY_INCREMENT;

            if (studentsCount < STUDENTS_TO_DISPLAY_INCREMENT) {
                $scope.numberOfStudentsToDisplay = studentsCount;
            }
        }

        /**
         * @desc 固定table header
         */
        function fixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-report .report-form");
            innerWrapper.addEventListener("scroll", scrollTableHeader, false);
        }

        /**
         * @desc 滚动table到头
         */
        function scrollTableToTop () {
            let innerWrapper = document.querySelector(".xy-report .report-form");
            innerWrapper.scrollTop = 0;
        }

        /**
         * @desc 滚动table header
         */
        function scrollTableHeader () {
            let innerWrapper = document.querySelector(".xy-report .report-form");
            let tableHeader = document.querySelector(".xy-report-form-header");

            let offset = innerWrapper.scrollTop;

            offset = offset === 0 ? 0 : offset - 1;

            tableHeader.style.transform = "translateY(" + offset + "px)";
        }

        /**
         * @desc 接触table header的滚动
         */
        function disableFixedTableHeader () {
            let innerWrapper = document.querySelector(".xy-report .report-form");
            innerWrapper.removeEventListener("scroll", scrollTableHeader, false);
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
            let course = UserService.getCurrentCourse();
            let students = UserService.getStudentsByCourseId(course._id);

            return students.length > 0;
        }

        /**
         * 检查基站是否连接
         */
        function checkStationConnection(){
            if(!StationService.checkStation()){
                return false;
            }
            return true;
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