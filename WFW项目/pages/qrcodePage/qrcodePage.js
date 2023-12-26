// pages/qrcodePage/qrcodePage.js
Page({
  data: {
    qrcode: '',
    district:''
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (params) {
    //console.log(params.district);
    this.data.district = params.district;
    // 页面加载时，发起 /findQRCodeByAreaName 请求
    this.getQRCode();
  },
  getQRCode: function () {
    console.log(this.data.district);
    // 发起 /findQRCodeByAreaName 请求
    wx.request({
      url: 'http://192.168.1.54:5000/findQRCodeByAreaName',
      method: 'POST',
      data: {
        areaName: this.data.district, // 传递需要查找的地区名
      },
      success: (res) => {
        const qrcode = res.data.qrcode;

        // 更新数据，触发页面重新渲染
        this.setData({
          qrcode: qrcode
        });
        console.log(this.data.qrcode);
      },
      fail: (error) => {
        console.error('Failed to get QR code:', error);
      }
    });
  },
  handleLongPress: function () {
    //const imageUrl = this.data.qrcode;
    wx.previewImage({
      current: this.data.qrcode,
      urls: [this.data.qrcode],  // 需要预览的图片链接列表
    });
  }
 
})