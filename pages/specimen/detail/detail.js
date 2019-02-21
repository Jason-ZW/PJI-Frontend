"use strict";

import {
    $wuxSelect,
} from '../../../miniprogram_npm/wux-weapp/index'

const app = getApp();
var constant = require('../../../utils/constant.js');
var util = require('../../../utils/util.js');

// 空闲
const SPECIMEN_TYPE_FREE = 0
// 存放
const SPECIMEN_TYPE_PUT = 1
// 取出
const SPECIMEN_TYPE_GET = 2
// 无权限
const SPECIMEN_TYPE_NO_RIGHT = 3

Page({
    data: {
        centerId: '',
        boxId: '',
        boxInfo: {},
        specimenGrid: [],
        selectedSpecimen: {},
        letterArr: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", ],
        // 是否感染
        infectTitle: '请选择',
        infectValue: '',
        infectIndex: 0,
        // 手术类型
        typeTitle: '请选择',
        typeValue: '',
        typeIndex: 0,
        // 存放者
        ownerTitle: '请选择',
        ownerValue: '',
        ownerIndex: 0,
        staffList: [],
        staffNameList: [],
        // 弹出框
        specimenInfoVisible: false,
        specimenSaveVisible: false,
    },

    // 查看标本信息
    showSpecimenInfo: function() {
        this.setData({
            specimenInfoVisible: true,
        });
    },
    closeSpecimenInfo() {
        this.setData({
            specimenInfoVisible: false,
        });
    },
    onCloseSpecimenInfo() {
        this.closeSpecimenInfo()
    },
    onClosedSpecimenInfo() {},

    // ================== 筛选 begin ================== //
    onClickInfect() {
        $wuxSelect('#selectInfect').open({
            value: this.data.infectValue,
            options: [
                "请选择",
                "不能确定",
                '非感染',
                '感染',
            ],
            onConfirm: (value, index, options) => {
                if (index !== -1) {
                    this.setData({
                        infectValue: value,
                        infectTitle: options[index],
                        infectIndex: index
                    })
                    this.requestSampleList(this.data.typeIndex, this.data.infectIndex, this.data.staffList[this.data.ownerIndex].staff_id)
                }
            },
        })
    },
    onClickType() {
        $wuxSelect('#selectType').open({
            value: this.data.typeValue,
            options: [
                "请选择",
                '置换术后',
                '占位器',
            ],
            onConfirm: (value, index, options) => {
                if (index !== -1) {
                    this.setData({
                        typeValue: value,
                        typeTitle: options[index],
                        typeIndex: index
                    })
                    this.requestSampleList(this.data.typeIndex, this.data.infectIndex, this.data.staffList[this.data.ownerIndex].staff_id)
                }
            },
        })
    },
    onClickOwner() {
        $wuxSelect('#selectOwner').open({
            value: this.data.ownerValue,
            options: this.data.staffNameList,
            onConfirm: (value, index, options) => {
                if (index !== -1) {
                    this.setData({
                        ownerValue: value,
                        ownerTitle: options[index],
                        ownerIndex: index
                    })
                    this.requestSampleList(this.data.typeIndex, this.data.infectIndex, this.data.staffList[this.data.ownerIndex].staff_id)
                }
            },
        })
    },
    // ================== 筛选 end ================== //

    onLoad: function(options) {
        this.setData({
            boxId: options.boxId,
            centerId: options.centerId
        })
        this.requestCenterStaffList(this.data.centerId)
        this.requestSampleList()
    },

    // 中心人员
    requestCenterStaffList(centerId) {
        var that = this
        wx.request({
            url: constant.basePath,
            data: {
                service: 'Center.SearchCenterMember',
                center_id: centerId,
                keyword: '',
                sort: 1
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Center.SearchCenterMember:" + JSON.stringify(res))
                if (res.data.data.code == constant.response_success) {
                    var staffList = res.data.data.list
                    var staffEmpty = {
                        staff_name: "请选择",
                        staff_id: 0
                    }
                    staffList.unshift(staffEmpty)
                    var staffNameList = []
                    for (var i = 0, len = staffList.length; i < len; i++) {
                        var staff = staffList[i]
                        // staff.auth_time = util.formatTime(staff.auth_time, 'Y-M-D')
                        staffNameList[i] = staff.staff_name
                    }

                    that.setData({
                        staffList: staffList,
                        staffNameList: staffNameList
                    })
                } else {
                    wx.showToast({
                        icon: 'none',
                        title: res.data.data.msg,
                    })
                }
            },
        })
    },

    requestSampleList(msis, type, staffId) {
        wx.showLoading({
            title: '请求数据中...',
        });
        let that = this;

        wx.request({
            url: constant.basePath,
            data: {
                service: 'Sample.GetSampleList',
                openid: app.globalData.openid,
                box_id: that.data.boxId,
                msis: msis,
                type: type,
                staff_id: staffId
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Sample.GetSampleList:" + JSON.stringify(res))
                wx.hideLoading();
                if (res.data.data.code == constant.response_success) {
                    var boxInfo = res.data.data.info;

                    if (boxInfo.utime > 0) {
                        boxInfo.showTime = util.formatTime(boxInfo.utime, 'Y-M-D')
                    } else if (boxInfo.ctime > 0) {
                        boxInfo.showTime = util.formatTime(boxInfo.ctime, 'Y-M-D')
                    }

                    var specimenGrid = that.makeSpecimenGrid(res.data.data.list)
                    that.setData({
                        boxInfo: boxInfo,
                        specimenGrid: specimenGrid
                    })
                } else {
                    wx.showToast({
                        icon: 'none',
                        title: res.data.data.msg,
                    })
                }
            },
            fail(res) {
                wx.hideLoading();
            }
        })
    },

    makeSpecimenGrid(specimenList) {
        var specimenGrid = []
        var row = []
        for (var i = 0, column = 0, length = specimenList.length; i < length; i++) {
            var specimen = specimenList[i]
            specimen.index = (i % 10) + 1
            row[i % 10] = specimen

            if ((i + 1) % 10 == 0) {
                var specimen = {
                    index: 0,
                    text: this.data.letterArr[column]
                }
                row.unshift(specimen)
                specimenGrid[column] = row
                column++
                row = []
            }
        }

        return specimenGrid
    },

    onItemClick(e) {
        var specimen = e.currentTarget.dataset.selecteditem

        if (specimen.color_type == SPECIMEN_TYPE_FREE) { // 空闲
            wx.navigateTo({
                url: '../save/save?specimenInfo=' + JSON.stringify(e.currentTarget.dataset.selecteditem) + "&boxInfo=" + JSON.stringify(this.data.boxInfo) + "&centerId=" + this.data.centerId
            })
        } else if (specimen.color_type == SPECIMEN_TYPE_PUT) { // 已存放 
            this.showDetail(true, specimen.sample_id)
        } else if (specimen.color_type == SPECIMEN_TYPE_GET) { // 已取出
            this.showDetail(false, specimen.sample_id)
        } else if (specimen.color_type == SPECIMEN_TYPE_NO_RIGHT) { // 无权限
            wx.showToast({
                icon: "none",
                title: '您无权限查看',
            })
        }
    },

    showDetail(isPutted, specimenId) {
        this.showSpecimenInfo()
        wx.showLoading({
            title: '请求数据中...',
        });
        let that = this;

        wx.request({
            url: constant.basePath,
            data: {
                service: 'Sample.CheckSample',
                openid: app.globalData.openid,
                sample_id: specimenId
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Sample.CheckSample:" + JSON.stringify(res))
                wx.hideLoading();
                if (res.data.data.code == constant.response_success) {
                    var specimenInfo = res.data.data.info
                    specimenInfo.msis = that.getMsisInfo(specimenInfo.msis)
                    specimenInfo.put_time = util.formatTime(specimenInfo.put_time, 'Y-M-D')
                    specimenInfo.get_time = util.formatTime(specimenInfo.get_time, 'Y-M-D')
                    specimenInfo.isPutted = isPutted
                    that.setData({
                        selectedSpecimen: specimenInfo
                    })
                } else {
                    wx.showToast({
                        icon: 'none',
                        title: res.data.data.msg,
                    })
                }
            },
            fail(res) {
                wx.hideLoading();
            }
        })
    },

    getMsisInfo(msisFlag) {
        var msisValue
        if (msisFlag == 1) {
            msisValue = "不能确定"
        } else if (msisFlag == 2) {
            msisValue = "非感染"
        } else if (msisFlag == 3) {
            msisValue = "感染"
        }

        return msisValue
    },

    onGetClick() {
        this.closeSpecimenInfo()
        wx.showLoading({
            title: '取出标本中...',
        });
        let that = this;

        wx.request({
            url: constant.basePath,
            data: {
                service: 'Sample.GetSample',
                openid: app.globalData.openid,
                sample_ids: that.data.selectedSpecimen.sample_id
            },
            header: {
                'content-type': 'application/json'
            },
            success(res) {
                console.log("Sample.GetSample:" + JSON.stringify(res))
                wx.hideLoading();
                if (res.data.data.code == constant.response_success) {
                    that.setData({
                        typeIndex: 0,
                        typeTitle: '请选择',
                        infectIndex: 0,
                        infectTitle: '请选择',
                        ownerIndex: 0,
                        ownerTitle: '请选择'
                    })
                    that.requestSampleList(that.data.typeIndex, that.data.infectIndex, that.data.staffList[that.data.ownerIndex].staff_id)
                } else {
                    wx.showToast({
                        icon: 'none',
                        title: res.data.data.msg,
                    })
                }
            },
            fail(res) {
                wx.hideLoading();
            }
        })
    },

    onGetAll() {
        
    }
});