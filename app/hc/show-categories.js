// Get Help Center Categories

var request = require('request');
var username = '###';                                   // Replace with your username
var password = '###';                                   // Replace with your password
var domain = '###.zendesk.com';                         // Replace with your Zendesk domain
var path = '/api/v2/help_center/categories.json';
var auth = username + ':' + password + '@';

request.get('https://' + domain + path, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}).auth(username,password, false);