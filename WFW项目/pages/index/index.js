// index.js
// 获取应用实例
const app = getApp()
Page({
  data: {
    formData: {
      name:'',
      district: '东城区',
      item: '',
      address: '',
      nama:'',
      contact:'',
      job: '高管'
    },
    
    checkboxItems: [
      {name: '十大高精尖', value: '0', checked: false},
      {name: '便民服务', value: '1', checked: false},
      {name: '文化创意', value: '2', checked: false},
      {name: '其它', value: '3', checked: false}
    ],
      maxCheckedCount: 2,
      suggestions: [],
      showSuggestions: false,
      district: ["东城区", "西城区", "朝阳区","丰台区","石景山区","海淀区","顺义区","通州区","大兴区","房山区","门头沟区","昌平区","平谷区","密云区","怀柔区","延庆区"],
      districtIndex: 0,
      job: ["高管", "中层","财务人员","政府事务","其他岗位"],
      jobIndex: 0,
  },
  
  checkboxChange(e) {
    const checkedValues = e.detail.value;
    const { checkboxItems, maxCheckedCount } = this.data;
  
    // 如果选择的项目数超过了限制，进行处理
    if (checkedValues.length > maxCheckedCount) {
      // 取消最后选择的项目
      checkedValues.pop();
  
      // 更新数据
      const updatedCheckboxItems = checkboxItems.map(item => ({
        ...item,
        checked: checkedValues.includes(item.value),
      }));
  
      // 获取最终选中的项目名称数组
      const selectedNames = updatedCheckboxItems
        .filter(item => checkedValues.includes(item.value))
        .map(item => item.name);
  
      // 更新视图和数据
      this.setData({
        checkboxItems: updatedCheckboxItems,
        'formData.item': selectedNames.slice(0, maxCheckedCount),
      });
  
      // 提示用户选择超过限制
      wx.showToast({
        title: `最多只能选择${maxCheckedCount}个项目`,
        icon: 'none',
      });
    } else {
      // 如果未超过限制，直接更新数据
      const updatedCheckboxItems = checkboxItems.map(item => ({
        ...item,
        checked: checkedValues.includes(item.value),
      }));
      
      this.setData({
        checkboxItems: updatedCheckboxItems,
        'formData.item': checkedValues.map(value =>
          checkboxItems.find(item => item.value === value).name
        ),
      });
      console.log('选中的项目名称：', checkedValues.map(value =>
        checkboxItems.find(item => item.value === value).name));
      
    }
    
  },

  handleNameChange(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  // 监听年龄输入
  handleAddressChange(e) {
    this.setData({
      'formData.address': e.detail.value
    });
  },
  handleNamaChange(e) {
    this.setData({
      'formData.nama': e.detail.value
    });
  },
  handleContactChange(e) {
    this.setData({
      'formData.contact': e.detail.value
    });
  },
  
  bindDistrictChange: function(e) {
    const selectedIndex = e.detail.value;
    const selectedDistrict = this.data.district[selectedIndex];
    console.log('picker district 发生选择改变，携带值为', e.detail.value);

    this.setData({

      districtIndex: e.detail.value,
      'formData.district': selectedDistrict
    })
  },
  bindJobChange: function(e) {
    const selectedIndex = e.detail.value;
    const selectedJob = this.data.job[selectedIndex];
    console.log('picker job 发生选择改变，携带值为', e.detail.value);

    this.setData({
      jobIndex: e.detail.value,
      'formData.job': selectedJob
    })
  },

  submitForm() {
      if (!this.data.formData.name) {
        wx.showToast({
          title: '企业名称不能为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      if (!this.data.formData.nama) {
        wx.showToast({
          title: '姓名不能为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      if (!this.data.formData.contact) {
        wx.showToast({
          title: '联系方式不能为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }

    wx.request({
      url: 'http://192.168.1.54:3000/save-application', // 替换为你的后端服务器地址
      method: 'POST',
      data: this.data.formData,
      success:(res)=>{
        console.log(res.data);
        wx.showToast({
          title: '表单提交成功',
          icon: 'success',
          duration: 2000
        });
        // wx.setStorageSync('district', this.data.formData.district);
        wx.redirectTo({
          url: '/pages/qrcodePage/qrcodePage?district='+this.data.formData.district
        });
      },
      fail(err) {
        console.error(err);
        wx.showToast({
          title: '表单提交失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

//天眼查API调用函数（待上线）
  // Function to fetch company name suggestions from the server
  fetchCompanySuggestions: function (userInput) {

    wx.request({
      url: 'http://192.168.1.54:4000/tianyancha', // Replace with your server URL
      data: { word: userInput, pageSize: '5', pageNum: '1' },
      success: (res) => {
        // Check if 'result' property exists and has 'items' property
        if (res.data) {
          const suggestions = res.data.data.result.items.slice(0, 5).map(item => item.name);
          //const suggestions = res.data;
          console.log('Company Name:',suggestions);
          // Update the suggestions in the state
          this.setData({
            suggestions: suggestions,
          });
        } else {
          // 假设你的返回值存储在 response 变量中
          // const response = res.data.data.result.items[0].name;
          //const response = res.data;
          console.error('Error 404 res.data不存在');
          this.setData({
            suggestions: [],
          });
        }
      },
      fail: (err) => {
        console.error(err);
        // Handle the case where the API request fails
        // For example, you might clear suggestions or display an error message
        this.setData({
          suggestions: [],
        });
      },
    });
  },


    // Event handler for selecting a suggestion
    onSuggestionSelect: function (e) {
      const selectedCompanyName = e.currentTarget.dataset.companyName;

      // Update the input field with the selected company name
      this.setData({
        'formData.name': selectedCompanyName,
        suggestions: [], // Clear suggestions
      });
    },
    onCompanyNameInput: function (e) {
      const userInput = e.detail.value;

      // Update the user input in the state
      this.setData({
        'formData.name': userInput,
        showSuggestions: true,
      });
      
      // Make API request for suggestions
      this.fetchCompanySuggestions(userInput);
    },
});