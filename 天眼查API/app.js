const Koa = require('koa');
const koaBody = require('koa-bodyparser');
const fs = require('fs');
const axios = require('axios');

const app = new Koa();
const PORT_TIANYANCHA = process.env.PORT_TIANYANCHA || 4000;
const PORT_POST = process.env.PORT_POST || 3000;

// Middleware to parse JSON requests
app.use(koaBody());

// Koa server for handling Tianyancha API requests
app.use(async (ctx, next) => {
  if (ctx.path === '/tianyancha' && ctx.method === 'GET') {
    const { word, pageSize, pageNum } = ctx.query;
    const token = '48166f4b-3d01-4712-b599-73da85b79786'; // Replace with your Tianyancha API key

    try {
      const response = await axios.get(
        `http://open.api.tianyancha.com/services/open/search/2.0?word=${encodeURIComponent(word)}&pageSize=${encodeURIComponent(pageSize)}&pageNum=${encodeURIComponent(pageNum)}`,
        {
          headers: {
            'Authorization': token,
          },
        }
      );

      ctx.body = { status: 'success', data: response.data };
    } catch (error) {
      console.error(error);
      ctx.body = { status: 'error', message: 'Failed to fetch data from Tianyancha API' };
    }
  } else {
    await next();
  }
});

// Koa server for handling POST requests
app.use(async (ctx) => {
  if (ctx.method === 'POST') {
    // Get POST data
    const postData = ctx.request.body;

    // Log data to the console
    console.log('Received form data:', postData);

    // Perform saving operation, save postData to the database or other location

    // Return response
    ctx.status = 200;
    ctx.body = 'Application form has been successfully saved!';

    // Build CSV format data
    const csvData = Object.keys(postData)
      .map((key) => postData[key])
      .join(',');

    // Write to CSV file
    fs.appendFile('formData.csv', `${csvData}\n`, (err) => {
      if (err) {
        console.error('Error writing to CSV file:', err);
        ctx.response.status = 500;
        ctx.body = 'Error writing to CSV file';
      } else {
        ctx.response.status = 200;
        ctx.body = 'Data saved to CSV file';
      }
    });
  } else {
    ctx.response.status = 405;
    ctx.body = 'Method Not Allowed';
  }
});

app.listen(PORT_POST, () => {
  console.log(`Server for POST requests is running on http://localhost:${PORT_POST}`);
});

app.listen(PORT_TIANYANCHA, () => {
  console.log(`Server for Tianyancha API is running on http://localhost:${PORT_TIANYANCHA}`);
});
