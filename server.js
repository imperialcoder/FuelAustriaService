var util = require("util"),
    http = require("http"),
    url = require("url");

var maintenanceError = 1,
    serverError = 2;

process.on('uncaughtException', function (err) {
    util.debug(err.stack);
});

util.debug("Starting");

//http://127.0.0.1:3000/BaseData/
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
                response.write(JSON.stringify({success: false, erroCode: maintenanceError}));
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

//http://127.0.0.1:3000/AllStations/?federalState=1&fuel=DIE&closedStations=checked
function GetAllStationsForFederalState(response, urlParts){
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
                util.debug('Invalid JSON:');
                util.debug(pageData);
            }

            if(!pageJson) {
                response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                response.write(JSON.stringify({success: false, errorCode: maintenanceError}));
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

//http://127.0.0.1:3000/DistrictStations/?district=101&fuel=DIE&closedStations=checked
function GetStationsForDistrict(response, urlParts){
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
                util.debug('Invalid JSON:');
                util.debug(pageData);
            }

            if(!pageJson) {
                response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
                response.write(JSON.stringify({success: false, errorCode: maintenanceError}));
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

    switch (urlParts.pathname) {
        case "/BaseData/":
            GetFederalStatesAndDistricts(response);
            break;
        case "/AllStations/":
            GetAllStationsForFederalState(response, urlParts.query);
            break;
        case "/DistrictStations/":
            GetStationsForDistrict(response, urlParts.query);
            break;
        default:
            emptyResponse(response);
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

util.debug('Listening on Port: ' + (process.env.PORT || 30000));
server.listen(process.env.PORT || 30000);

