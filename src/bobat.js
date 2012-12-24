var util = require("util"),
	https = require('https'),
	jsdom = require('jsdom'),
	queryString = require('querystring');

var maintenanceError = 1,
	serverError = 2,
	wrongNumberOrPassword = 3;

var one_sec = 1000;

module.exports = function () {

	return {

		handle: function(response, urlParts) {
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
					loginMsisdn: '',
					kkw: '',
					"submit.x": 34,
					"submit.y": 14
				};
				var data = queryString.stringify(dataJson);
				// var data = 'userRequestURL=https%253A%252F%252Frechnung.bob.at%252F&service=obp_bob_asmp&serviceRegistrationURL=&level=0&ticket=BOBKKW&loginMsisdn=&kkw=&submit.x=34&submit.y=14';
				//var followerCookies = '__utma=63090096.1053053835.1353005626.1353442759.1353608754.3; __utmb=63090096.6.10.1353608754; __utmc=63090096; __utmz=63090096.1353442759.2.2.utmcsr=rechnung.bob.at|utmccn=(referral)|utmcmd=referral|utmcct=/';
				
				res.on('end', function(){

					if(res.headers["set-cookie"]){
						cookies.push(res.headers["set-cookie"][0].split(';')[0]);
						cookies.push(res.headers["set-cookie"][1].split(';')[0]);
					}

					postOptions.headers = {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': data.length,
						'Connection': 'keep-alive',
						'Cookie': cookies.join('; ') //+ '; __utma=63090096.1053053835.1353005626.1353005626.1353442759.2; __utmb=63090096.10.10.1353442759; __utmz=63090096.1353442759.2.2.utmcsr=rechnung.bob.at|utmccn=(referral)|utmcmd=referral|utmcct=/'
					};

					//util.debug(res.statusCode + ', ' + res.headers.location);
					

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
										'Cookie': cookies.join('; '), //+ '; __utma=63090096.1053053835.1353005626.1353005626.1353442759.2; __utmb=63090096.10.10.1353442759; __utmz=63090096.1353442759.2.2.utmcsr=rechnung.bob.at|utmccn=(referral)|utmcmd=referral|utmcct=/'
										'Connection': 'keep-alive'
									}
								};

								https.get(billOptions, function(respo) {

									respo.on('data', function(chunk){
										pageData += chunk;
									});

									respo.on('end', function(){
										//util.debug(pageData);
										//util.debug(respo.statusCode + ', ' + respo.headers.location);

										jsdom.env(pageData, function (errors, window) {
											if(errors){
												errorHandler(JSON.stringify(errors), response, serverError);
												return;
											}

											var returnObject = { clientInfo: {}, "costManager": { "order": {}, "remaining": {} } };

											// client_info
											var clientAddress = window.document.getElementsByClassName('client_info')[0].getElementsByClassName('contentLayer')[0].getElementsByClassName('leftSide')[0].textContent.trim();
											returnObject.clientInfo[clientAddress.split(':')[0]] = clientAddress.split(':')[1].replace(/(\r\n|\n|\r|\t)/gm,"").trim();
											var clientInfoRightSide = window.document.getElementsByClassName('client_info')[0].getElementsByClassName('contentLayer')[0].getElementsByClassName('rightSide')[0].getElementsByClassName('row');
											var clientNbr = clientInfoRightSide[0].textContent.trim().split(':');
											var clientPhoneNbr = clientInfoRightSide[1].textContent.trim().split(':');
											returnObject.clientInfo[clientNbr[0]] = clientNbr[1].replace(/(\r\n|\n|\r|\t)/gm,"").trim();
											returnObject.clientInfo[clientPhoneNbr[0]] = clientPhoneNbr[1].replace(/(\r\n|\n|\r|\t)/gm,"").trim();
											
											// cost_manager
											var bestellungsRows = window.document.getElementsByClassName('cost_manager')[0].getElementsByClassName('contentLayer')[0].getElementsByClassName('table')[0].getElementsByClassName('row');
											var restEinheitenRows = window.document.getElementsByClassName('cost_manager')[0].getElementsByClassName('contentLayer')[0].getElementsByClassName('table')[1].getElementsByClassName('row');
											var i = 0,
												cells;


											for(i; i<bestellungsRows.length; i++) {
												cells = bestellungsRows[i].getElementsByClassName('cell');
												
												returnObject.costManager.order[cells[0].textContent.trim()] = cells[1].textContent.trim().replace(/(\r\n|\n|\r|\t)/gm,"");
											}
											i = 0;
											for (i; i < restEinheitenRows.length; i++) {
												cells = restEinheitenRows[i].getElementsByClassName('cell');

												returnObject.costManager.remaining[cells[0].textContent.trim()] = cells[2].textContent.trim().replace(/(\r\n|\n|\r|\t)/gm,"");
											}
											window.close();

											returnObject.duration = Math.abs(new Date() - startDate)/one_sec;

											// util.debug('done');
											response.writeHead(respo.statusCode, { "Content-Type": "application/json;charset=utf-8", "Access-Control-Allow-Origin": "*" });
											response.write(JSON.stringify({success: true, data: returnObject}));
											response.end('\n');
										});
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
						console.error(e.stackxsdy);
					});

				});
			}).on('error', function(e) {
					errorHandler(e.stack, response, serverError);
			});
		}
	};
};

function checkForWrongData(pageData, response) {
	jsdom.env(pageData,	function (errors, window){			
		if(errors){
			errorHandler(JSON.stringify(errors), response, serverError);
			return;
		}

		if(window.document.getElementsByClassName('messageIcon').length > 0) {
			errorHandler('wrongNumberOrPassword', response, wrongNumberOrPassword);
			return;
		}
	});
}

function errorHandler(errorText, response, errorCode) {
	util.debug("Got error: " + errorText);
	response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
	response.write(JSON.stringify({success: false, errorCode: errorCode }));
	response.end('\n');
	return;
}