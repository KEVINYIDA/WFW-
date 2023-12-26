const axios = require('axios');
const config = require('./config');
const logger = require('./logger');


let accessToken = null;
let lastUpdateTime = null;

const getAccessToken = async () => {
  const now = new Date();
  
  // 检查token是否存在且未过期（假设提前5分钟刷新token）
  if (accessToken && (now - lastUpdateTime < 7150000)) {
    logger.info('Using cached access token');
    return accessToken;
  }

  // 获取新的access_token
  // const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${config.corpid}&corpsecret=${config.corpsecret}`;
  const url = `http://localhost:4000/cgi-bin/gettoken?corpid=${config.corpid}&corpsecret=${config.corpsecret}`;

  try {
    logger.info('Requesting new access token');
    const response = await axios.get(url);
    if (response.data.errcode === 0) {
      accessToken = response.data.access_token;
      lastUpdateTime = new Date();
      logger.info('[tokenManager][getAccessToken] Access token retrieved successfully');
      return accessToken;
    } else {
      logger.error(`[tokenManager][getAccessToken] Failed to get access token: ${response.data.errmsg}`);
      throw new Error(`[tokenManager][getAccessToken] Failed to get access token: ${response.data.errmsg}`);
    }
  } 
  //catch (error) {
  //   logger.error('Error in getAccessToken:', error);
  //   throw error;
  // }
  catch (error) {
    logger.error(`[tokenManager][getAccessToken] Error in getAccessToken: ${error.message}`, {
      status: error.response ? error.response.status : null,
      headers: error.response ? error.response.headers : null,
      data: error.response ? error.response.data : null
    });
  }
  
};

module.exports = { getAccessToken };
