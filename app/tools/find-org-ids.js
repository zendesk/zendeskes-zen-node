// Dependencies
var fs = require('fs-extra');
var prompt = require('prompt');
var request = require('request');
var underscore = require('underscore');
var json2csv = require('nice-json2csv');

// Set global variables
var page = 1;
var organizations = [];
var orgCount = 0;

// Get authentication properties and export filename
var authProperties = [
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
    },
    {
        name: 'exportFile',
        description: 'Enter a filename to export the CSV to',
        required: true
    }
];

prompt.start();

prompt.get(authProperties, function (err, result) {
    if (err) {
        return onErr(err);
    } else {

        // Check to see if exportFile exists, and if not create it
        var csvFile = 'tmp/org-ids/' + result.exportFile + '.csv';

        var credentials;

        // Create credentials from user input and pass on to getOrgs()
        if (result.tokenaccess.toLowerCase() === 'n') {
            credentials = result.username + ':' + encodeURIComponent(result.password) + '@';
        } else {
            credentials = result.username + encodeURIComponent('/token') + ':' + result.password + '@';
        }

        getOrgs(credentials, result.subdomain, csvFile);

    }

});

function onErr(err) {
    console.log("There was a problem.\n", err);
}



function getOrgs(credentials, subdomain, csvFile) {
    console.log("Getting page " + page + "...");

    request.get('https://' + credentials + subdomain + '.zendesk.com/api/v2/organizations.json?page=' + page, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);

            underscore._.each(data.organizations, function(value) {
                organizations.push({"name":value.name, "id":value.id, "url":value.url});
                orgCount++;
            });

            if (data.next_page !== null) {
                page++;
                setTimeout(getOrgs(credentials, subdomain, csvFile), 2000);
            } else {
                console.log("Done fetching pages...\n");
                console.log("RESULTS - Showing " + orgCount + " organizations");
                console.log("=====================================================\n\n");
                console.log(JSON.stringify(organizations));
            }

        } else if (response.statusCode == 429) {
            setTimeout(getOrgs(credentials, subdomain, csvFile), response["Retry-After"]);
            getOrgs(credentials, result.subdomain, csvFile);

        } else {
            console.log(response.statusCode);
            console.log(response.body);
            return error;
        }
    });
}