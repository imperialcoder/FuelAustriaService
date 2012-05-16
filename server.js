var util = require("util"),
    http = require("http"),
    url = require("url");

var _response = undefined,
    maintenanceError = 1,
    serverError = 2;

process.on('uncaughtException', function (err) {
    console.error(err.stack);

    _response.writeHead(500, {'content-type': 'text/plain' });
    _response.write('ERROR:' + err.stack);
    _response.end('\n');
    _response = undefined;
});


util.debug("Starting");

//http://127.0.0.1:3000/BaseData/
function GetFederalStatesAndDistricts(){

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
                console.log('Invalid JSON:');
                console.log(pageData);
            }

            if(!pageJson) {
                _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify({success: false, errorId: maintenanceError}));
                _response.end('\n');
                _response = undefined;
            } else {

                var federalStates = getFederalState(pageJson);

                _response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify(federalStates));
                _response.end();
                _response = undefined;
            }
        });
    }).on('error', function(e) {
            console.log("Got error: " + e.stack);
            _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            _response.write(JSON.stringify({success: false, errorId: serverError}));
            _response.end('\n');
            _response = undefined;
    });
}

//http://127.0.0.1:3000/AllStations/?federalState=1&fuel=DIE&closedStations=checked
function GetAllStationsForFederalState(urlParts){
    var data = '[' + urlParts.federalState + ', \"BL\", \"' + urlParts.fuel +'\", \"' + urlParts.closedStations + '\"]';
    data = '/ts/BezirkStationServlet?data=' + encodeURIComponent(data);

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
            } catch (SyntaxError) {
                console.log('Invalid JSON:');
                console.log(pageData);
            }

            if(!pageJson) {
                _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify({success: false, errorId: maintenanceError}));
                _response.end('\n');
                _response = undefined;
            } else {
                _response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify(pageJson));
                _response.end();
                _response = undefined;
            }
        });
    }).on('error', function(e) {
            console.log("Got error: " + e.stack);
            _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            _response.write(JSON.stringify({success: false, errorId: serverError}));
            _response.end('\n');
            _response = undefined;
        });
}

//http://127.0.0.1:3000/DistrictStations/?district=101&fuel=DIE&closedStations=checked
function GetStationsForDistrict(urlParts){
    var data = '[' + urlParts.district + ', \"PB\", \"' + urlParts.fuel +'\", \"' + urlParts.closedStations + '\"]';
    data = '/ts/BezirkStationServlet?data=' + encodeURIComponent(data);

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
            } catch (SyntaxError) {
                console.log('Invalid JSON:');
                console.log(pageData);
            }

            if(!pageJson) {
                _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify({success: false, errorId: maintenanceError}));
                _response.end('\n');
                _response = undefined;
            } else {
                _response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                _response.write(JSON.stringify(pageJson));
                _response.end();
                _response = undefined;
            }
        });
    }).on('error', function(e) {
            console.log("Got error: " + e.stack);
            _response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            _response.write(JSON.stringify({success: false, errorId: serverError}));
            _response.end('\n');
            _response = undefined;
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

function emptyResponse() {
    _response.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    _response.write('Command not recognized');
    _response.end();
    _response = undefined;
}

//server
var server = http.createServer(function(request, response) {

    _response = response;

    var urlParts = url.parse(request.url,true);

//    var urlArr = request.url.split("/"),
//        method = urlArr[1];

    switch (urlParts.pathname) {
        case "/BaseData/":
            GetFederalStatesAndDistricts();
            break;
        case "/AllStations/":
            GetAllStationsForFederalState(urlParts.query);
            break;
        case "/DistrictStations/":
            GetStationsForDistrict(urlParts.query);
            break;
        default:
            emptyResponse();
            break;
    }

//        var req = http.request(options, function(res) {
//            console.log('STATUS: ' + res.statusCode);
//            console.log('HEADERS: ' + JSON.stringify(res.headers));
//            res.setEncoding('utf8');
//            res.on('data', function (chunk) {
//                console.log('BODY: ' + chunk);
//                body = chunk;
//            });
//        });
//
//        req.on('error', function(e) {
//            console.log('problem with request: ' + e.message);
//        });
//
//        // write data to request body
//        req.write('data\n');
//        req.write('data\n');
//        req.end();
});

server.listen(3000, "127.0.0.1");

