"use strict";
App({
    onLaunch: function() {
        // wx.getSetting({
        //     success: res => {
        //         if (res.authSetting['scope.userInfo']) {
        //             wx.getUserInfo({
        //                 success: res => {
        //                     this.globalData.userInfo = res.userInfo;
        //                     if (this.userInfoReadyCallback) {
        //                         this.userInfoReadyCallback(res)
        //                     }
        //                 }
        //             });
        //         }
        //     }
        // });
    },
    globalData: {
        is_admin: '', // 管理员flag 0否，1是
        openid: '',
        avatarUrl: ''
    }
});