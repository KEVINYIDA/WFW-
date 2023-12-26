const fs = require('fs');
const logger = require('./logger');

// 读取GroupChatConfigs.json文件
function readGroupChatConfigs() {
  try {
    const data = fs.readFileSync('GroupChatConfigs.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('[groupConfigMgmt][readGroupChatConfigs] Error reading GroupChatConfigs.json', { message: error.message, function: 'readGroupChatConfigs' });
    return {};
  }
}

// 写入GroupChatConfigs.json文件
function writeGroupChatConfigs(configs) {
  try {
    const replacer = (key, value) => {
      if (Array.isArray(value)) {
        // 如果数组的元素是字符串，尝试解析为 JSON，否则返回原始值
        return value.map(item => {
          try {
            return JSON.parse(item);
          } catch {
            return item;
          }
        });
      }
      return value;
    };

    const jsonData = JSON.stringify(configs, replacer, 2);
    // console.log('Writing JSON Data:', jsonData);

    fs.writeFileSync('GroupChatConfigs.json', jsonData, 'utf8');
    //console.log('GroupChatConfigs.json written successfully.');
    logger.info('[groupConfigMgmt][writeGroupChatConfigs] GroupChatConfigs.json written successfully', { function: 'writeGroupChatConfigs' });

  } catch (error) {
    //console.error('Error writing GroupChatConfigs.json:', error.message);
    logger.error('[groupConfigMgmt][writeGroupChatConfigs] Error writing GroupChatConfigs.json', { message: error.message, function: 'writeGroupChatConfigs' });

  }
}


module.exports = {
  // 1. 根据【区】(area.name) 的名称找到【区】对应的【二维码】(qrcode)
  findQRCodeByAreaName(areaName) {
    const configs = readGroupChatConfigs();
    logger.info(`[groupConfigMgmt][findQRCodeByAreaName] Configs: ${JSON.stringify(configs)}`, { function: 'findQRCodeByAreaName' });
    //const area = configs[areaName];
    const area = configs.city.areas.find(area => area.name === areaName);
    if (!area || !area.qr_code) {
      logger.info(`[groupConfigMgmt][findQRCodeByAreaName] QR Code not found for area '${areaName}'`, { function: 'findQRCodeByAreaName' });
      return null;
    }
    logger.info(`[groupConfigMgmt][findQRCodeByAreaName]QR Code for area '${areaName}': ${area.qr_code}`, { function: 'findQRCodeByAreaName' });
    return area.qr_code;
  },

  // 2. 根据【群id】(ChatId) 找到【群配置id】(config_id)
  findConfigIdByChatId(chatId) {
    const configs = readGroupChatConfigs();
    for (const cityName in configs) {
      const city = configs[cityName];
      for (const area of city.areas || []) {
        const chatIdList = area.externalcontactGroupConfig.chat_id_list;
        // const chatIdListAll = area.chat_id_list_all || [];
        logger.info(`[groupConfigMgmt][findConfigIdByChatId] Checking area: ${area.name}`, { function: 'findConfigIdByChatId' });
        logger.info(`[groupConfigMgmt][findConfigIdByChatId] ChatId List: ${chatIdList}`, { function: 'findConfigIdByChatId' });
          if (chatIdList.includes(chatId)) {
            logger.info(`[groupConfigMgmt][findConfigIdByChatId] Found matching ChatId: ${chatId}, ConfigId: ${area.externalcontactGroupConfig.config_id}`, { function: 'findConfigIdByChatId' });
            return area.externalcontactGroupConfig.config_id;
        }
      }
    }
    logger.info(`[groupConfigMgmt][findConfigIdByChatId] No matching ConfigId found for ChatId: ${chatId}`, { function: 'findConfigIdByChatId' });
    return null;
  },

// 获取指定config_id的完整配置信息
getConfigById(configId) {
  logger.info(`[groupConfigMgmt][getConfigById] Searching for config with configId: ${configId}`);
  const configs = readGroupChatConfigs();

  for (const areaName in configs.city.areas) {
    const area = configs.city.areas[areaName];
    if (area.externalcontactGroupConfig && area.externalcontactGroupConfig.config_id === configId) {
      logger.info(`[groupConfigMgmt][getConfigById] Found config for configId: ${configId} in area: ${areaName}`);
      return area.externalcontactGroupConfig;
    }
  }

  logger.warn(`[groupConfigMgmt][getConfigById] No config found for configId: ${configId}`);
  return null;
},


  // 3. 提供【群id】(ChatId) 从包含这个【群id】(ChatId) 的【群id列表】(chat_id_list) 中删除，并增加到所在【区】（areas.name)的chat_id_list_all里
  removeChatIdFromList(chatId) {
    const configs = readGroupChatConfigs();
    let chatIdFound = false;
  
    for (const areaName in configs.city.areas) {
      const area = configs.city.areas[areaName];
      logger.info(`[groupConfigMgmt][removeChatIdFromList] Checking area: ${areaName}`);
  
      if (area.externalcontactGroupConfig && area.externalcontactGroupConfig.chat_id_list) {
        const chatIdList = area.externalcontactGroupConfig.chat_id_list;
        const chatIdListAll = area.chat_id_list_all || [];
        logger.info(`[groupConfigMgmt][removeChatIdFromList] ChatId List: ${chatIdList}`);
        logger.info(`[groupConfigMgmt][removeChatIdFromList] ChatId List All: ${chatIdListAll}`);
  
        const index = chatIdList.indexOf(chatId);
  
        if (index !== -1) {
          // 从chat_id_list中移除chatId
          chatIdList.splice(index, 1);
          logger.info(`[groupConfigMgmt][removeChatIdFromList] Removed ChatId: ${chatId}`);
          chatIdFound = true;
  
          // 将chatId添加到chat_id_list_all中
          if (!chatIdListAll.includes(chatId)) {
            chatIdListAll.push(chatId);
            logger.info(`[groupConfigMgmt][removeChatIdFromList] Added ChatId to ChatId List All: ${chatId}`);
          }
          writeGroupChatConfigs(configs);
          break; // 停止遍历，因为已找到并更新了chatId
        } else {
          logger.info(`[groupConfigMgmt][removeChatIdFromList] No matching ChatId found for removal: ${chatId}`);
        }
      } else {
        logger.info(`[groupConfigMgmt][removeChatIdFromList] No chat_id_list found for area: ${areaName}`);
      }
    }
  
    if (!chatIdFound) {
      logger.info(`[groupConfigMgmt][removeChatIdFromList] No matching ChatId found for removal: ${chatId}`);
      return 'No matching ChatId found for removal';
    }
    return true; // 成功移动chatId
  },
  
  // 4. 根据提供的【群配置id】(config_id) 更新【群id列表】(chat_id_list)，进行替换操作，使用 updateLocalConfig 来替代
  // updateChatIdListByConfigId(configId, newChatIdList) {
  //   const configs = readGroupChatConfigs();
  //   for (const areaName of Object.keys(configs.city.areas)) {
  //     const area = configs.city.areas[areaName];
  //     logger.info(`Checking area: ${areaName}`, { function: 'updateChatIdListByConfigId' });

  //     if (area.externalcontactGroupConfig && area.externalcontactGroupConfig.config_id === configId) {
  //       const parsedNewChatIdList = typeof newChatIdList === 'string' ? JSON.parse(newChatIdList) : newChatIdList;
  //       logger.info(`Found matching ConfigId for update: ${configId}`, { function: 'updateChatIdListByConfigId' });
  //       logger.info(`Original ChatId List: ${area.externalcontactGroupConfig.chat_id_list}`, { function: 'updateChatIdListByConfigId' });
  //       logger.info(`New ChatId List: ${parsedNewChatIdList}`, { function: 'updateChatIdListByConfigId' });

  //       area.externalcontactGroupConfig.chat_id_list = parsedNewChatIdList;
  //       logger.info(`Updated ChatId List for ConfigId ${configId}: ${parsedNewChatIdList}`, { function: 'updateChatIdListByConfigId' });

  //       writeGroupChatConfigs(configs);
  //       return;
  //     } else {
  //       logger.info(`No matching ConfigId found for update: ${configId}`, { function: 'updateChatIdListByConfigId' });
  //     }
  //   }
  // },   

  // // 5. 根据提供的【群配置id】(config_id) 更新【群全部id列表】(chat_id_list_all），将【群配置id】(config_id)与现有【群全部id列表】(chat_id_list_all）的数据进行合并操作
  // mergeChatIdListAllByConfigId(configId, newChatIdListAll) {
  //   const configs = readGroupChatConfigs();
  //   for (const areaName of Object.keys(configs.city.areas)) {
  //     const area = configs.city.areas[areaName];
  //     logger.info(`Checking area: ${areaName}`, { function: 'mergeChatIdListAllByConfigId' });

  //     if (area.externalcontactGroupConfig && area.externalcontactGroupConfig.config_id === configId) {
  //       const parsedNewChatIdListAll = typeof newChatIdListAll === 'string' ? JSON.parse(newChatIdListAll) : newChatIdListAll;
  //       logger.info(`Found matching ConfigId for merge: ${configId}`, { function: 'mergeChatIdListAllByConfigId' });
  //       // 使用 Set 来确保不会有重复的 ChatId
  //       const mergedChatIdListAll = [...new Set([...area.chat_id_list_all, ...parsedNewChatIdListAll])];
  //       area.chat_id_list_all = mergedChatIdListAll;
  //       logger.info(`Merged ChatId List All for ConfigId ${configId}: ${mergedChatIdListAll}`, { function: 'mergeChatIdListAllByConfigId' });

  //       writeGroupChatConfigs(configs);
  //       return;
  //     } else {
  //       logger.info(`No matching ConfigId found for merge: ${configId}`, { function: 'mergeChatIdListAllByConfigId' });
  //     }
  //   }
  // },
// 获取所有config_id
getAllConfigIds() {
  const configs = readGroupChatConfigs();
  const configIds = [];
  logger.info('[groupConfigMgmt][getAllConfigIds] Retrieving all config IDs', { function: 'getAllConfigIds' });

  for (const areaName in configs.city.areas) {
    const area = configs.city.areas[areaName];
    if (area.externalcontactGroupConfig) {
      configIds.push(area.externalcontactGroupConfig.config_id);
    }
  }
  logger.info(`[groupConfigMgmt][getAllConfigIds] Found config IDs: ${configIds}`, { function: 'getAllConfigIds' });

  return configIds;
},

// 更新本地配置
  updateLocalConfig(configId, newChatIdList) {
  const configs = readGroupChatConfigs();

  for (const areaName in configs.city.areas) {
    const area = configs.city.areas[areaName];
    if (area.externalcontactGroupConfig && area.externalcontactGroupConfig.config_id === configId) {
      // 更新chat_id_list
      const parsedNewChatIdList = typeof newChatIdList === 'string' ? JSON.parse(newChatIdList) : newChatIdList;
      area.externalcontactGroupConfig.chat_id_list = parsedNewChatIdList;
      // area.externalcontactGroupConfig.chat_id_list = newChatIdList; 这段代码有错误

      // 更新chat_id_list_all
      // 使用 Set 来确保不会有重复的 ChatId
      const mergedChatIdListAll = [...new Set([...area.chat_id_list_all, ...parsedNewChatIdList])];
      area.chat_id_list_all = mergedChatIdListAll;

      logger.info(`[groupConfigMgmt][updateLocalConfig] Merged ChatId List All for ConfigId ${configId}: ${mergedChatIdListAll}`, { function: 'updateLocalConfig' });
      writeGroupChatConfigs(configs);

      logger.info(`[groupConfigMgmt][updateLocalConfig] Updated local config for ${configId}`, { function: 'updateLocalConfig' });
      return;
    }
  }

  logger.info(`[groupConfigMgmt][updateLocalConfig] ConfigId ${configId} not found for update`, { function: 'updateLocalConfig' });
}

};
