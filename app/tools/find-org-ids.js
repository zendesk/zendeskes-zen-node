var prompt = require('prompt');
var request = require('request');
var underscore = require('underscore');
var fs = require('fs');
var touch = require('touch');
var json2csv = require('nice-json2csv');
var Bottleneck = require("bottleneck");

var path = '/api/v2/help_center/oragnizations.json'        // Targets the organizations.json endpoint
var auth, subdomain, organizations = [], page = 1;
touch(__dirname + '/data-sets/tmp/organizations.csv');

var properties = [
    {
        name: 'tokenaccess',
        description: 'Will you be using token access (y/n)',
        pattern: /^[YNyn]{1}$/,
        message: 'You must enter \'y\' or \'n\'',
        required: true
    },
    {
        name: 'username',
        description: 'Enter your username for Zendesk',
        required: true
    },
    {
        name: 'password',
        description: 'Enter your password or API token',
        hidden: true,
        required: true
    },
    {
        name: 'subdomain',
        description: 'Enter your Zendesk subdomain',
        required: true
    }
];

prompt.start();

prompt.get(properties, function (err, result) {
    if (err) {
        return onErr(err);
    } else {
        if (result.tokenaccess.toLowerCase() === 'n') {
            auth = result.username + ':' + encodeURIComponent(result.password) + '@';
        } else {
            auth = result.username + encodeURIComponent('/token') + ':' + result.password + '@';
        }

        subdomain = result.subdomain;

        return getOrgs();
    }

})

function onErr(err) {
    console.log("There was a problem.\n", err);
}

function getOrgs() {

    request.get('https://' + auth + subdomain + '.zendesk.com/api/v2/organizations.json?page=' + page, function (error, response, body) {
        if (!error && response.statusCode == 200) {;
            var result = JSON.parse(body);

            underscore._.map(result["organizations"], function(value) {
                organizations.push({"name":value.name, "id":value.id, "url":value.url});
            })

            console.log(JSON.stringify(organizations));

            if (result["next_page"] != null) {
                page++;
                getOrgs();
            } else {
                console.log("...done");
                var csvData = JSON.parse(organizations);
                return json2csv.convert();
            }

        } else if (response.statusCode == 429) {
            setTimeout(getOrgs(), response["Retry-After"]);

        } else {
            console.log(error);
            console.log(response.statusCode);
        }
    }).pipe(fs.createWriteStream(__dirname + '/data-sets/tmp/organizations.csv'));
}