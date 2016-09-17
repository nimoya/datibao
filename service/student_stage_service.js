/**
* @ignore  =====================================================================================
* @fileoverview student stage 页面的model
* @author 王磊
* @version 0.1.0
* @ignore  created in 2016/6/29
* @ignore  depend 
* @ignore  =====================================================================================
*/

angular.module("DTB").service("StudentStageModel", [
	function () {
		let model = {
			title: "", // student stage页面的标题
			student: null, // student stage页面要显示的学生信息
			style: null, // student stage页面的样式 
			closeCallback: function (cb) { cb && cb(); } // student stage页面关闭按钮的回调函数
		};

		this.setTitle = function (title) {
			model.title = title;
		};

		this.getTitle = function () {
			return model.title;
		};

		this.setStudent = function (student) {
			model.student = student;
		};

		this.getStudent = function () {
			return model.student;
		};

		this.setStyle = function (style) {
			model.style = style;
		};

		this.getStyle = function () {
			return model.style;
		};

		this.setCloseCallback = function (closeCallback) {
			model.closeCallback = closeCallback;
		};

		this.getCloseCallback = function () {
			return model.closeCallback;
		};

		this.reset = function () {
			model = {
				title: "",
				student: null,
				style: null,
				closeCallback: function () {}
			};	
		};
	}]
);