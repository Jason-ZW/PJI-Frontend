'use strict';

let constant = require('../../../../utils/constant.js');
let util = require('../../../../utils/util.js');

const app = getApp();

Page({
    data: {
        loadProgress: 0,
        loadModal: false,
        StatusBar: app.globalData.StatusBar,
        CustomBar: app.globalData.CustomBar,
        Custom: app.globalData.Custom,

        tabList: ["要素速览", "诊疗日历"],
        currTab: 0,
        scrollLeft: 0,
        // ---------------- timeline ---------------- //
        isIn: 0,
        caseInfo: '',
        timeLineList: [],
        typePicker: ["基本信息", "诊断穿刺", "入院手术", "抗生素治疗开始", "门诊随访", "抗生素治疗终止", "手术", "出院"],
        // ---------------- calendar ---------------- //
        calendarDate: util.getNowFormatMonth(),
        eventTopPosition: "80rpx",
        weekRow: [1, 2, 3, 4, 5, 6, 7],
        weekList: [],
    },

    tabSelect(e) {
        this.setData({
            currTab: e.currentTarget.dataset.id,
            scrollLeft: (e.currentTarget.dataset.id - 1) * 60
        })
    },

    onLoad: function(options) {
        this.setData({
            caseInfo: JSON.parse(options.caseInfo),
            centerId: options.centerId,
            centerName: options.centerName,
            isAdmin: app.globalData.is_admin == '1'
        });
        this.initData()
    },

    initData() {
        this.loadProgress();
        this.requestTimeLine();
        this.requestCalendar(this.data.calendarDate);
        this.completeProgress();
    },

    // ---------------- timeline begin ---------------- //
    requestTimeLine: function() {
        let that = this;
        wx.request({
            url: constant.basePath,
            data: {
                service: 'Case.Timeline',
                openid: app.globalData.openid,
                case_id: that.data.caseInfo.case_id,
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Case.Timeline:" + JSON.stringify(res))
                if (res.data.data.code == constant.response_success) {
                    for (let i = 0, len = res.data.data.list.length; i < len; i++) {
                        let timeLineInfo = res.data.data.list[i];
                        timeLineInfo.time = timeLineInfo.time.split(" ")[0]
                        timeLineInfo.typeName = that.data.typePicker[timeLineInfo.type - 1]
                    }

                    that.setData({
                        isIn: res.data.data.info.is_in,
                        timeLineList: res.data.data.list
                    });
                } else {
                    that.showToast(res.data.msg);
                }
            },
            fail(res) {
                that.showToast(res.data.msg);
            }
        });
    },

    onItemClick(e) {
        let item = e.currentTarget.dataset.item
        if (item.type == 1) { // 基本信息
            wx.navigateTo({
                url: '../base/base?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + item.item_id
            });
        } else if (item.type == 2) { // 穿刺
            wx.navigateTo({
                url: '../chuanci/chuanci?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + item.item_id
            });
        } else if (item.type == 3 || item.type == 7 || item.type == 8) { // 手术
            wx.navigateTo({
                url: '../shoushu/shoushu?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + item.item_id
            });
        } else if (item.type == 4 || item.type == 6) { // 用药
            wx.navigateTo({
                url: '../medicine/medicine?caseId=' + this.data.caseInfo.case_id + "&itemId=" + item.item_id + "&userinfo=" + this.makeUserInfo()
            });
        } else if (item.type == 5) { // 随访
            wx.navigateTo({
                url: '../followup/followup?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + item.item_id
            });
        }
    },

    onPuncture() {
        wx.navigateTo({
            url: '../chuanci/chuanci?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + 0
        });
    },

    onShouShu() {
        wx.navigateTo({
            url: '../shoushu/shoushu?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + 0
        });
    },

    onYongyao() {
        if (this.data.isIn == 0) {
            this.showToast("前序抗生素疗程尚未结束，无法创建新疗程")
            return
        }
        wx.navigateTo({
            url: '../yongyao/yongyao?caseId=' + this.data.caseInfo.case_id + "&itemId=" + 0 + "&userinfo=" + this.makeUserInfo() + "&isfromlist=" + false
        });
    },

    onFollowup() {
        wx.navigateTo({
            url: '../followup/followup?centerId=' + this.data.centerId + "&centerName=" + this.data.centerName + "&caseId=" + this.data.caseInfo.case_id + "&itemId=" + 0
        });
    },

    makeUserInfo() {
        let that = this
        let obj = {
            patient_name: that.data.caseInfo.patient_name,
            case_no: that.data.caseInfo.case_no,
            side_name: that.data.caseInfo.side_name,
            part_name: that.data.caseInfo.part_name,
        }
        return JSON.stringify(obj)
    },

    // ---------------- timeline end ---------------- //

    // ---------------- calendar begin ---------------- //
    requestCalendar: function(month) {
        let that = this;
        wx.request({
            url: constant.basePath,
            data: {
                service: 'Case.Calendar',
                case_id: that.data.caseInfo.case_id,
                month: month,
                openid: app.globalData.openid
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Case.GetDoctorList:" + JSON.stringify(res))
                if (res.data.data.code == constant.response_success) {
                    that.setData({
                        weekList: res.data.data.list
                    })
                } else {
                    that.showToast(res.data.data.msg);
                }

            },
            fail(res) {
                that.hideLoading();
                that.showToast(res.data.msg);
            }
        });
    },
    CalendarDateChange(e) {
        this.setData({
            calendarDate: e.detail.value
        })
        this.requestCalendar(this.data.calendarDate);
    },
    // ---------------- calendar end ---------------- //

    onUnload() {
        var pages = getCurrentPages();
        if (pages.length > 1) {
            //上一个页面实例对象
            var prePage = pages[pages.length - 2];
            //关键在这里
            prePage.initData()
        }
    },

    // ============ 事件 begin ============ //
    loadProgress: function() {
        if (this.data.loadProgress < 96) {
            this.setData({
                loadProgress: this.data.loadProgress + 3
            });
        }
        if (this.data.loadProgress < 100) {
            setTimeout(() => {
                this.loadProgress();
            }, 100);
        } else {
            this.setData({
                loadProgress: 0
            });
        }
    },
    completeProgress: function() {
        this.setData({
            loadProgress: 100
        });
    },
    showToast: function(msg) {
        wx.showToast({
            icon: 'none',
            title: msg,
        });
    },
    showLoading: function() {
        this.setData({
            loadModal: true
        });
    },
    hideLoading: function() {
        setTimeout(() => {
            this.setData({
                loadModal: false
            });
        }, 1500);
    },
    showModal: function(modalName, msg = '') {
        this.setData({
            modalName: modalName,
            errMsg: msg
        });
    },
    hideModal: function(e) {
        this.setData({
            modalName: null
        });
    },
    onRefresh: function(e) {
        this.initData()
    },

    // ============ 事件 end ============ //
});