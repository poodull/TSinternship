
var http = require('http');	
http.createServer(function (request, response) {
    console.log('request starting...');
	
	response.writeHead(200, { 'Content-Type': 'text/html' });
	
	var html = '<p>Yo dawg, I herd you like Javascript so I put Javascript in yo Javascript so you can run scripts in yo scripts.</p>'
	html += '<script type="text/javascript">alert("Yo dawg, I herd you like Javascript so I put Javascript in yo Javascript so you can run scripts in yo scripts.");</script>';
	
	response.end(html, 'utf-8');
	
}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');