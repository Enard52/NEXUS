const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 4181,
  path: '/api/guest',
  method: 'POST'
}, (res) => {
  const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : '';
  
  const req2 = http.request({
    hostname: '127.0.0.1',
    port: 4181,
    path: '/api/data',
    method: 'GET',
    headers: { 'Cookie': cookie }
  }, (res2) => {
    let data = '';
    res2.on('data', chunk => data += chunk);
    res2.on('end', () => console.log(data));
  });
  req2.end();
});
req.end();
