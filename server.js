var http = require('http')
 var port = process.env.PORT || 8080;
 console.log("conSUL test");
 http.createServer(function(req, res) {
   res.writeHead(200, { 'Content-Type': 'text/plain' });
   res.end('Yessika is awesome!\n');
 }).listen(port);
