var util = require("util"),
	http = require("http"),
	url = require("url"),
	querystring = require('querystring'),
	fuelAustria = require('./fuelaustria')(),
	bobAT = require('./bobat')();

process.on('uncaughtException', function (err) {
	util.debug('uncaughtException: ' + err.stack);
});

util.debug("Starting");

function postRequest(request, response, callback) {
	var queryData = "";
	if(typeof callback !== 'function') return null;

	request.on('data', function(data) {
		queryData += data;
		if(queryData.length > 1e6) {
			queryData = "";
			response.writeHead(413, {'Content-Type': 'text/plain'});
			request.connection.destroy();
		}
	});

	request.on('end', function() {
		response.post = JSON.parse(queryData);
		callback();
	});
}

function callSubModule(urlSplit, response, urlParts) {
	switch(urlSplit[0]) {
		case "FuelAustria":
			fuelAustria.handle(urlSplit[1], response, urlParts.query);
			break;
		case "bobAT":
			bobAT.handle(response, urlParts.query);
			break;
		default:
			response.writeHead(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" });
			response.write("<h3>Service up and running, see docs for commands</h3>");
			response.end();
			break;
	}
}

//server
var server = http.createServer(function(request, response) {
	try {
		var urlParts = url.parse(request.url,true);
		var urlSlashSplit = request.url.split('/');
		var urlSplit = urlSlashSplit.filter(function(e) {
			if(e !==""){
				return true;
			}
		});

		if(request.method == 'POST') {
			postRequest(request, response, function() {
				callSubModule(urlSplit, response, urlParts);
			});
		} else {
			callSubModule(urlSplit, response, urlParts);
		}
	} catch (e) {
		util.debug("Got error: " + e.stack);
		response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
		response.write(JSON.stringify({success: false, errorCode: serverError}));
		response.end('\n');
	}
	
});

//util.debug('process.env[app_port] ' + process.env['app_port']);
//util.debug('process.env.VCAP_APP_PORT '+ process.env.VCAP_APP_PORT);
//util.debug('process.env ' + JSON.stringify(process.env));
util.debug('Listening on Port: ' + (process.env.VCAP_APP_PORT || 3000));
server.listen(process.env.VCAP_APP_PORT || 3000);
//server.listen(process.env['app_port'] || 3000);
