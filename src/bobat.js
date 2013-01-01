var util = require("util"),
	https = require('https'),
	queryString = require('querystring'),
    cheerio = require("cheerio");

var maintenanceError = 1,
	serverError = 2,
	wrongNumberOrPassword = 3;

var one_sec = 1000;

module.exports = function () {

	return {

		handle: function(response, urlParts) {
			getBobData(response, urlParts);
		}
	};
};

function getBobData(response, urlParts) {
	var startDate = new Date();

	var options = {
		host: 'asmp.bob.at',
		port: 443,
		path: '/asmp/LoginMasterServlet/axpaaa1?userRequestURL=https%253A%252F%252Frechnung.bob.at%252F&serviceRegistrationURL=&service=obp_bob_asmp&cookie=skip&level=0&ticket=BOBKKW&aaacookie=axpaaa1',
		method: "GET"
	};

	var postOptions = {
		host: 'asmp.bob.at',
		port: 443,
		path: '/asmp/ProcessLoginServlet/axpaaa1/axpbbgw2?aaacookie=axpaaa1&eacookie=axpbbgw2',
		method: 'POST'
	};

	https.get(options, function(res) {
		var pageData = "";
		var cookies = [];
		var dataJson = {
			userRequestURL: 'https%253A%252F%252Frechnung.bob.at%252F',
			service: 'obp_bob_asmp',
			serviceRegistrationURL: '',
			level: 0,
			ticket: 'BOBKKW',
			loginMsisdn: response.post ? response.post.id : '',
			kkw: response.post ? new Buffer(response.post.pwd, 'base64').toString() : '',
			"submit.x": 34,
			"submit.y": 14
		};
		var data = queryString.stringify(dataJson);
        
		res.on('end', function(){

			if(res.headers["set-cookie"]){
				cookies.push(res.headers["set-cookie"][0].split(';')[0]);
				cookies.push(res.headers["set-cookie"][1].split(';')[0]);
			}

			postOptions.headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length,
				'Connection': 'keep-alive',
				'Cookie': cookies.join('; ') 
			};
			

			var req = https.request(postOptions, function(resp){

				resp.on('data', function(chunk){
					pageData += chunk;
				});
				
				resp.on('end', function (){
					
					if(resp.statusCode === 200) {
						checkForWrongData(pageData, response);
					} else if(resp.statusCode === 302) {

						cookies.push(resp.headers["set-cookie"][0].split(';')[0]);
						cookies.push(resp.headers["set-cookie"][1].split(';')[0]);
						cookies.push(resp.headers["set-cookie"][2].split(';')[0]);
						cookies.push(resp.headers["set-cookie"][3].split(';')[0]);
						cookies.push(resp.headers["set-cookie"][4].split(';')[0]);
						
						pageData  = '';

					
						var billOptions = {
							host: 'rechnung.bob.at',
							port: 443,
							method: "GET",
							path: '/',
							headers: {
								'Cookie': cookies.join('; '), 
								'Connection': 'keep-alive'
							}
						};

						https.get(billOptions, function(respo) {

							respo.on('data', function(chunk){
								pageData += chunk;
							});

							respo.on('end', function(){
                                
                                var $ = cheerio.load(pageData);
                                
                                var returnObject = { "clientInfo": {}, "costManager": {} };
                                
                                var clientAddress = $('.client_info .leftSide').text().trim();
                                
                                returnObject.clientInfo[clientAddress.split(':')[0]] = clientAddress.split(':')[1].replace(/(\r\n|\n|\r|\t)/gm,"").trim();
                                
                                
                                $('.client_info .rightSide .row .firstCell').each(function(i, html) {
                                    var splits = $(html).text().trim().split(':');
                                    returnObject.clientInfo[splits[0]] = splits[1].replace(/(\r\n|\n|\r|\t)/gm,"").trim();
                                });
                                
                                $('.cost_manager .contentLayer .table .row').each(function(i, html) {
                                    var cells = $(html).find('.cell');
                                    returnObject.costManager[$(cells[0]).text().trim()] = $(cells[cells.length-1]).text().replace(/(\r\n|\n|\r|\t)/gm,"").trim();
                                });
                                
								returnObject.duration = Math.abs(new Date() - startDate)/one_sec;

								// util.debug('done');
								response.writeHead(respo.statusCode, { "Content-Type": "application/json;charset=utf-8", "Access-Control-Allow-Origin": "*" });
								response.write(JSON.stringify({success: true, data: returnObject}));
								response.end('\n');
							});

							respo.on('error', function(e){
								errorHandler(e.stack, response, serverError);
							});

						}).on('error', function(e) {
							errorHandler(e.stack, response, serverError);
						});
					}
				});
				resp.on('error', function(e){
					errorHandler(e.stack, response, serverError);
				});
			});

			req.write(data);

			req.end();

			req.on('error', function(e) {
				errorHandler(e.stack, response, serverError);
			});

		});
	}).on('error', function(e) {
			errorHandler(e.stack, response, serverError);
	});
}

function checkForWrongData(pageData, response) {
	var $ = cheerio.load(pageData);

	if($('.messageIcon').length > 0) {
		errorHandler('wrongNumberOrPassword', response, wrongNumberOrPassword);
		return;
	}
}

function errorHandler(errorText, response, errorCode) {
	util.debug("Got error: " + errorText);
	response.writeHead(errorCode === 3 ? 401 : 500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
	response.write(JSON.stringify({success: false, errorCode: errorCode }));
	response.end('\n');
	return;
}