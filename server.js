var util = require("util"),
	http = require("http"),
	url = require("url"),
	queryString = require('querystring');

var maintenanceError = 1,
	serverError = 2;

process.on('uncaughtException', function (err) {
	util.debug(err.stack);
});

util.debug("Starting");

function FuelAustria(method, response, urlParts){
	switch (method) {
		case "BaseData":
			GetFederalStatesAndDistricts(response);
			break;
		case "AllStations":
			GetAllStationsForFederalState(response, urlParts);
			break;
		case "DistrictStations":
			GetStationsForDistrict(response, urlParts);
			break;
		case "GpsStations":
			GetStationsPerGps(response, urlParts);
			break;
		case "Address":
			GetAddressValues(response, urlParts);
			break;
		case "PlzLookup":
			GetFromPlz(response, urlParts);
			break;
		default:
			emptyResponse(response);
			break;
	}
}

//http://127.0.0.1:3000/FuelAustria/BaseData/
function GetFederalStatesAndDistricts(response){

	var options = {
		host: 'www.spritpreisrechner.at',
		port: 80,
		path: '/ts/BezirkDataServlet',
		method: "GET"
	};

	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {

				var federalStates = getFederalState(pageJson);

				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify(federalStates));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//http://127.0.0.1:3000/FuelAustria/AllStations/?federalState=1&fuel=DIE&closedStations=checked
function GetAllStationsForFederalState(response, urlParts){
	//var data = '[' + urlParts.federalState + ', \"BL\", \"' + urlParts.fuel +'\", \"' + urlParts.closedStations + '\"]';
	var data = [urlParts.federalState, 'BL', urlParts.fuel, urlParts.closedStations];
	data = '/ts/BezirkStationServlet?data=' + JSON.stringify(data);

	var options = {
		host: 'www.spritpreisrechner.at',
		port: 80,
		path: data,
		method: "GET"
	};


	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
				//pageJson = checkSpritPrice(pageJson);
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {
				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: true, data: pageJson}));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//http://127.0.0.1:3000/FuelAustria/DistrictStations/?district=101&fuel=DIE&closedStations=checked
function GetStationsForDistrict(response, urlParts){
	//var data = '[' + urlParts.district + ', \"PB\", \"' + urlParts.fuel +'\", \"' + urlParts.closedStations + '\"]';
	var data = [urlParts.district, 'PB', urlParts.fuel, urlParts.closedStations];
	data = '/ts/BezirkStationServlet?data=' + JSON.stringify(data);

	var options = {
		host: 'www.spritpreisrechner.at',
		port: 80,
		path: data,
		method: "GET"
	};


	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
				//pageJson = checkSpritPrice(pageJson);
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {
				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: true, data: pageJson}));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//http://127.0.0.1:3000/FuelAustria/GpsStations/?fuel=DIE&closedStations=checked&longi=15.439504&lati=47.070714
function GetStationsPerGps(response, urlParts) {
	//var data = '[\"' + urlParts.closedStations + '\",\"' + urlParts.fuel +'\",' + urlParts.longi + ',' + urlParts.lati +',' + urlParts.longi + ',' + urlParts.lati +']';
	var data = [urlParts.closedStations, urlParts.fuel, urlParts.longi, urlParts.lati, urlParts.longi, urlParts.lati];
	data = '/ts/GasStationServlet?data=' + JSON.stringify(data);

	var options = {
		host: 'www.spritpreisrechner.at',
		port: 80,
		path: data,
		method: "GET"
	};


	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
				//pageJson = checkSpritPrice(pageJson);
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {
				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: true, data: pageJson}));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//http://127.0.0.1:3000/FuelAustria/Address/?address=Graz
function GetAddressValues(response, urlParts){
	var data = {q: encodeURIComponent(urlParts.address), maxRows: 10, country: 'AT', fuzzy:0.8, featureClass: 'P', username:'imperialcoder' };
	data = '/searchJSON?' + queryString.stringify(data);

	// http://api.geonames.org/searchJSON?q=Söchau&country=AT&maxRows=10&username=demo&lang=de&fuzzy=0.8&featureClass=P

	var options = {
		host: 'api.geonames.org',
		port: 80,
		path: data,
		method: "GET"
	};


	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
				pageJson = pageJson.geonames;
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {
				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: true, data: pageJson}));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//http://127.0.0.1:3000/FuelAustria/PlzLookup/?plz=8362
function GetFromPlz(response, urlParts){
	var data = {postalcode:urlParts.plz, country: 'AT', username:'imperialcoder' };
	data = '/postalCodeLookupJSON?' + queryString.stringify(data);

	// http://api.geonames.org/postalCodeLookupJSON?postalcode=8362&country=AT&username=demo

	var options = {
		host: 'api.geonames.org',
		port: 80,
		path: data,
		method: "GET"
	};


	http.get(options, function(res) {
		var pageData = "";

		res.on('data', function (chunk) {
			pageData += chunk;
		});

		res.on('end', function(){
			var pageJson = undefined;

			try {
				pageJson = JSON.parse(pageData);
				pageJson = pageJson.postalcodes;
			} catch (SyntaxError) {
				util.debug('Invalid JSON:');
				util.debug(pageData);
			}

			if(!pageJson) {
				response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: false, errorCode: maintenanceError, errorText: pageData}));
				response.end('\n');
			} else {
				response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
				response.write(JSON.stringify({success: true, data: pageJson}));
				response.end();
			}
		});
	}).on('error', function(e) {
			util.debug("Got error: " + e.stack);
			response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
			response.write(JSON.stringify({success: false, errorCode: serverError}));
			response.end('\n');
		});
}

//helper
function getFederalState(stateObjects){
	var states = [];
	states.push({id: stateObjects.Burgenland.code, data: stateObjects.Burgenland});
	states.push({id: stateObjects.Kärnten.code, data: stateObjects.Kärnten});
	states.push({id: stateObjects.Niederösterreich.code, data: stateObjects.Niederösterreich});
	states.push({id: stateObjects.Oberösterreich.code, data: stateObjects.Oberösterreich});
	states.push({id: stateObjects.Salzburg.code, data: stateObjects.Salzburg});
	states.push({id: stateObjects.Steiermark.code, data: stateObjects.Steiermark});
	states.push({id: stateObjects.Tirol.code, data: stateObjects.Tirol});
	states.push({id: stateObjects.Vorarlberg.code, data: stateObjects.Vorarlberg});
	states.push({id: stateObjects.Wien.code, data: stateObjects.Wien});
	var result = { success: true };
	result.states = states;
	return result;
}

function emptyResponse(response) {
	response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
	response.write(JSON.stringify({success: true, data: 'Command not recognized'}));
	response.end();
}

//server
var server = http.createServer(function(request, response) {

	var urlParts = url.parse(request.url,true);
	var urlSlashSplit = request.url.split('/');
	var urlSplit = urlSlashSplit.filter(function(e) {
		if(e !==""){
			return true;
		}
	});

	switch(urlSplit[0]) {
		case "FuelAustria":
			FuelAustria(urlSplit[1], response, urlParts.query);
			break;
		default:
			response.writeHead(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" });
			response.write("<h2>Service up and running, see docs for commands</h2>");
			response.end();
			break;
	}
});

util.debug('Listening on Port: ' + (process.env['app_port'] || 3000));
server.listen(process.env['app_port'] || 3000);


