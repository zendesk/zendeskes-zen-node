// Get Help Center Categories

var request = require('request');                       // Require the Request package: https://www.npmjs.com/package/request
var username = '###';                                   // Replace with your username
var password = '###';                                   // Replace with your password
var domain = '###.zendesk.com'                          // Replace with your Zendesk domain
var path = '/api/v2/help_center/categories.json'        // Targets the categories.json endpoint
var auth = username + ':' + password + '@';             // Builds basic authorization string

request.get('https://' + auth + domain + path, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
})