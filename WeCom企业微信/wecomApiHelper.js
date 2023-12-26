const axios = require('axios');
const { getAccessToken } = require('./tokenManager');
const logger = require('./logger');

exports.getGroupChatDetails = async (chatId) => {
  const accessToken = await getAccessToken(); // 获取有效的access_token
  //const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get?access_token=${accessToken}`;
  const url = `http://localhost:4000/cgi-bin/externalcontact/groupchat/get?access_token=${accessToken}`;

  try {
    logger.info(`[wecomApiHelper][getGroupChatDetails] Requesting group chat details for ChatId: ${chatId}`);
    const response = await axios.post(url, { chat_id: chatId });
    logger.info(`[wecomApiHelper][getGroupChatDetails] Received response for ChatId ${chatId}:`, response.data);
    return response.data;
  } catch (error) {
    logger.error(`[wecomApiHelper][getGroupChatDetails] Error fetching group chat details for ChatId ${chatId}:`, error);
    throw error;
  }
};

exports.getGroupConfig = async (configId) => {
  const accessToken = await getAccessToken(); // 获取有效的access_token
  //const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get_join_way?access_token=${accessToken}`;
  const url = `http://localhost:4000/cgi-bin/externalcontact/groupchat/get_join_way?access_token=${accessToken}`;

  try {

    logger.info(`[wecomApiHelper][getGroupConfig] Requesting join config for ConfigId: ${configId}`);

    const response = await axios.post(url, { config_id: configId });
    
    // 打印完整的Axios响应对象
    logger.info(`[wecomApiHelper][getGroupConfig] Full Axios response: Status: ${response.status}, Headers: ${JSON.stringify(response.headers)}, Data: ${JSON.stringify(response.data)}`);

    // logger.info(`Received join config for ConfigId ${configId}:`, response.data);
    logger.info(`[wecomApiHelper][getGroupConfig] Received join config for ConfigId ${configId}: ${JSON.stringify(response.data)}`);

    // console.log(`Full Axios response:`, response);
    // console.log(`Received join config for ConfigId ${configId}:`, response.data);

    return response.data;

  } catch (error) {
    logger.error(`[wecomApiHelper][getGroupConfig] Error fetching join config for ConfigId ${configId}`, {
      message: error.message, // 错误消息
      status: error.response ? error.response.status : null, // HTTP状态码
      headers: error.response ? error.response.headers : null, // 响应头
      data: error.response ? error.response.data : null // 响应数据
    });

  }  
};

exports.updateGroupConfig = async (configData) => {
  const accessToken = await getAccessToken(); // 获取有效的access_token
  // const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/update_join_way?access_token=${accessToken}`;
  const url = `http://localhost:4000/cgi-bin/externalcontact/groupchat/update_join_way?access_token=${accessToken}`;

  try {
    logger.info(`[wecomApiHelper][updateGroupConfig] Updating group config with data: ${JSON.stringify(configData)}`);
    const response = await axios.post(url, configData);
    logger.info(`[wecomApiHelper][updateGroupConfig] Received response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logger.error(`[wecomApiHelper][updateGroupConfig] Error updating group config: ${error.message}`, {
      status: error.response ? error.response.status : null,
      headers: error.response ? error.response.headers : null,
      data: error.response ? error.response.data : null
    });
    throw error;
  }
};

