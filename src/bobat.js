var util = require("util"),
	https = require('https');

//https.globalAgent.maxSockets = 2;

module.exports = function () {

    return {

		handle: function(response, urlParts) {

			var options = {
				host: 'asmp.bob.at',
				port: 443,
				path: '/asmp/LoginMasterServlet/axpaaa1?userRequestURL=https%253A%252F%252Frechnung.bob.at%252F&serviceRegistrationURL=&service=obp_bob_asmp&cookie=skip&level=0&ticket=BOBKKW&aaacookie=axpaaa1',
				method: "GET"
			};

			https.get(options, function(res) {
				var pageData = "";

				res.on('data', function (chunk) {
					pageData += chunk;
				});

				res.on('end', function(){
					util.debug('end ' + pageData);
				});
			}).on('error', function(e) {
					util.debug("Got error: " + e.stack);
					response.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
					response.write(JSON.stringify({success: false, errorCode: serverError}));
					response.end('\n');
			});
		}
	};
};