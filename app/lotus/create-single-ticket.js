// Create a single ticket using node.js

var request = require('request');
var username = 'epritchard@zendesk.com/token';                                   // Replace with your username
var password = 'RVYy6UDNcUYxz3qQ1weQcDZ1pSyDpjeJd80X2IGb';                                   // Replace with your password
var domain = 'z3nubiquity.zendesk.com';                         // Replace with your Zendesk domain
var path = '/api/v2/tickets.json';
var auth = username + ':' + password + '@';


// Ticket information

var requester = {
    name: 'John Malcolm',
    email: 'epritchard83+jmalc@gmail.com',
    subject: 'API Test 2',
    body: 'Boom!'
};

request({
    json: true,
    method: 'POST',
    uri: 'https://' + domain + path,
    auth: {username: username, password: password, sendImmediately: false},
    body: {"ticket":{"requester":{"name":requester.name, "email":requester.email}, "subject":requester.subject, "comment": { "body": requester.body }}}
    },
    function (error, response, body) {
        if (error) {
            return console.error('Failed request: ', error);
        }
        console.log('Successful request! Server response: ', body);
    });