var util = require("util"),
    http = require("http");


util.debug("Starting");

var server = http.createServer(function(request, response) {
    try {
        var url = request.url.split('/');
        var data = {"bundesland":url[1], "bezirk":url[2]};

        var body = JSON.stringify(data);

        response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        response.write(body);
        response.end();
    } catch ( e ) {
        response.writeHead(500, {'content-type': 'text/plain' });
        response.write('ERROR:' + e);
        response.end('\n');
    }
});

server.listen(3000, "127.0.0.1");

