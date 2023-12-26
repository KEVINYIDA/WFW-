const groupConfigMgmt = require('./groupConfigMgmt');
const wecomApiHelper = require('./wecomApiHelper');
const logger = require('./logger');

exports.handleEvent = async (ctx) => {
  try {
    const event = ctx.request.body.xml;
    logger.info('[wecomEventHandler][handleEvent] Received event:', event);

    if (event.Event[0] === 'change_external_chat') {
      const chatId = event.ChatId[0];
      const changeType = event.ChangeType[0];
      logger.info(`[wecomEventHandler][handleEvent] Received 'change_external_chat' event`);
      logger.info(`[wecomEventHandler][handleEvent] ChatId: ${chatId}, ChangeType: ${changeType}`);
    
      // 处理客户群创建事件
      if (changeType === 'create') {
        logger.info('[wecomEventHandler][handleEvent] Handling customer group creation event');

        // 获取所有config_id
        const configIds = groupConfigMgmt.getAllConfigIds(); // 假设此函数返回所有config_id的数组
        logger.info(`[wecomEventHandler][handleEvent] Retrieved config IDs: ${configIds}`);

        for (const configId of configIds) {
          try {
            logger.info(`[wecomEventHandler][handleEvent] Fetching group config for configId: ${configId}`);

            // 获取客户群进群方式配置
            const groupConfig = await wecomApiHelper.getGroupConfig(configId);

            logger.info(`[wecomEventHandler][handleEvent] GroupConfig: ${JSON.stringify(groupConfig)}`);
            logger.info(`[wecomEventHandler][handleEvent] ChatId: ${chatId}`);

            if (groupConfig && groupConfig.join_way && Array.isArray(groupConfig.join_way.chat_id_list) && groupConfig.join_way.chat_id_list.includes(chatId)) {
              logger.info(`[wecomEventHandler][handleEvent] Found matching ChatId in configId: ${configId}`);

              // 同步更新本地配置
              groupConfigMgmt.updateLocalConfig(configId, groupConfig.join_way.chat_id_list);
              logger.info(`[wecomEventHandler][handleEvent] Updated local config for configId: ${configId}`);

            } else {
              logger.info(`[wecomEventHandler][handleEvent] ChatId not found or invalid groupConfig for configId: ${configId}`);
            }          
          } catch (error) {
            logger.error(`[wecomEventHandler][handleEvent] Error fetching group config for configId ${configId}:`, error);
          }
        }

        ctx.body = { success: true, message: 'Handled customer group creation event' };
      }

      // 处理客户群成员增加事件
      else if (changeType === 'update') {
        const configId = groupConfigMgmt.findConfigIdByChatId(chatId);
        if (!configId) {
          logger.info(`[wecomEventHandler][handleEvent] ChatId ${chatId} not found in GroupChatConfig.`);
          ctx.body = { success: false, message: 'ChatId not found in GroupChatConfig' };
          return;
        }

        const groupDetails = await wecomApiHelper.getGroupChatDetails(chatId);
        logger.info(`[wecomEventHandler][groupDetails] Group details for ChatId ${chatId}: ${JSON.stringify(groupDetails)}`);

        if (groupDetails.group_chat && groupDetails.group_chat.member_list && groupDetails.group_chat.member_list.length >= 1) {
          const removeResult = groupConfigMgmt.removeChatIdFromList(chatId);
          if (removeResult) {
            // 从GroupChatConfigs.json中获取完整的配置信息
            const fullConfig = groupConfigMgmt.getConfigById(configId);
            if (fullConfig) {
              // 更新企微服务器上的配置
              try {
                await wecomApiHelper.updateGroupConfig(fullConfig);
                logger.info(`[wecomEventHandler][handleEvent] Updated group config on WeCom server for configId: ${configId}`);
              } catch (error) {
                logger.error(`[wecomEventHandler][handleEvent] Error updating group config on WeCom server: ${error.message}`);
              }
            } else {
              logger.error(`[wecomEventHandler][handleEvent] No config found for configId: ${configId}`);
            }
          }
          ctx.body = { success: true, message: removeResult };
          logger.info(`[wecomEventHandler][handleEvent] ChatId removed: ${chatId}`);
        } else {
          ctx.body = { success: false, message: 'Member count is less than 199' };
          logger.info(`[wecomEventHandler][handleEvent] Member count less than 199 for ChatId: ${chatId}`);
        }
      } else {
        ctx.body = { success: false, message: 'Unhandled change type' };
        logger.info(`[wecomEventHandler][handleEvent] Unhandled change type: ${changeType} for ChatId: ${chatId}`);
      }
    } else {
      ctx.body = { success: false, message: 'Invalid event type' };
      logger.info(`[wecomEventHandler][handleEvent] Invalid event type: ${event.Event[0]}`);
    }
  } catch (error) {
    console.error('[wecomEventHandler][handleEvent] Error processing event:', error);
    ctx.body = { success: false, message: error.message };
    logger.error(`[wecomEventHandler][handleEvent] Error processing event: ${error.message}`);
  }
};
