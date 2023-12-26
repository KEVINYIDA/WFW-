const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const xmlParser = require('koa-xml-body');
const Router = require('@koa/router');
const groupConfigMgmt = require('./groupConfigMgmt');
const wecomEventHandler = require('./wecomEventHandler');
const { getAccessToken } = require('./tokenManager');
const wecomApiHelper = require('./wecomApiHelper');
const logger = require('./logger'); // 引入日志配置


const app = new Koa();
const router = new Router();

// 自定义中间件来根据Content-Type选择解析器
app.use(async (ctx, next) => {
    if (ctx.is('xml')) {
        await xmlParser()(ctx, next);
    } else {
        await bodyParser()(ctx, next);
    }
});

// 现有API接口路由
router.post('/findQRCodeByAreaName', async (ctx) => {
    logger.info('[app.js][findQRCodeByAreaName] Handling /findQRCodeByAreaName request');
    const { areaName } = ctx.request.body;
    const qrcode = groupConfigMgmt.findQRCodeByAreaName(areaName);
    ctx.body = { qrcode };
    logger.info('[app.js][findQRCodeByAreaName] Processed /findQRCodeByAreaName request');
});

router.post('/findConfigIdByChatId', async (ctx) => {
    logger.info('[app.js][findConfigIdByChatId] Handling /findConfigIdByChatId request');
    const { chatId } = ctx.request.body;
    const configId = groupConfigMgmt.findConfigIdByChatId(chatId);
    ctx.body = { configId };
    logger.info('[app.js][findConfigIdByChatId] Processed /findConfigIdByChatId request');
});

router.post('/removeChatIdFromList', async (ctx) => {
    logger.info('[app.js][removeChatIdFromList] Handling /removeChatIdFromList request');
    const { chatId } = ctx.request.body;
    groupConfigMgmt.removeChatIdFromList(chatId);
    ctx.body = { success: true };
    logger.info('[app.js][removeChatIdFromList] Processed /removeChatIdFromList request');
});

// router.post('/updateChatIdListByConfigId', async (ctx) => {
//     console.log('Handling /updateChatIdListByConfigId request');
//     const { configId, newChatIdList } = ctx.request.body;
//     groupConfigMgmt.updateChatIdListByConfigId(configId, newChatIdList);
//     ctx.body = { success: true };
//     console.log('Processed /updateChatIdListByConfigId request');
// });

// router.post('/mergeChatIdListAllByConfigId', async (ctx) => {
//     console.log('Handling /mergeChatIdListAllByConfigId request');
//     const { configId, newChatIdListAll } = ctx.request.body;
//     groupConfigMgmt.mergeChatIdListAllByConfigId(configId, newChatIdListAll);
//     ctx.body = { success: true };
//     console.log('Processed /mergeChatIdListAllByConfigId request');
// });



// 获取所有config_id的接口
router.get('/getAllConfigIds', async (ctx) => {
    const configIds = groupConfigMgmt.getAllConfigIds();
    ctx.body = { configIds };
});

// 获取access_token的接口
router.get('/gettoken', async (ctx) => {
    const accessToken = await getAccessToken();
    ctx.body = { accessToken };
});


// 更新本地配置的接口
router.post('/updateLocalConfig', async (ctx) => {
    const { configId, newChatIdList } = ctx.request.body;
    groupConfigMgmt.updateLocalConfig(configId, newChatIdList);
    ctx.body = { success: true, message: `Config updated for ${configId}` };
});

// 企业微信事件处理路由
router.post('/wecom-callback', async (ctx) => {
    logger.info('[app.js][wecom-callback] Received wecom callback event');
    await wecomEventHandler.handleEvent(ctx);
    logger.info('[app.js][wecom-callback] Processed wecom callback event');
});

app.use(router.routes()).use(router.allowedMethods());

// 启动服务
const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info('[app.js][listen] Server is running on port ' + port);
});
