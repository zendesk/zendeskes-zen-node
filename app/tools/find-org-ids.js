// Dependencies
var fs = require('fs');
var prompt = require('prompt');
var request = require('request');
var underscore = require('underscore');
var json2csv = require('nice-json2csv');
var ProgressBar = require('progress');

// Set prompt appearance
prompt.message = '> '.green;
prompt.delimiter = '';

// Set global variables
var csvFile = __dirname + '/data-sets/tmp/';
var page = 1;
var defaultRetry = 0;
var retry = defaultRetry;
var orgs = [];
var bar;

// Get authentication properties and export filename
var authProperties = [
    {
        name: 'tokenaccess',
        description: 'Will you be using token access (y/n):'.green,
        pattern: /^[YNyn]{1}$/,
        message: 'You must enter \'y\' or \'n\'',
        required: true
    },
    {
        name: 'username',
        description: 'Enter your username for Zendesk:'.green,
        required: true
    },
    {
        name: 'password',
        description: 'Enter your password or API token:'.green,
        hidden: true,
        required: true
    },
    {
        name: 'subdomain',
        description: 'Enter your Zendesk subdomain:'.green,
        required: true
    },
    {
        name: 'exportFile',
        description: 'Enter a filename to export the CSV to:'.green,
        required: true
    }
];

prompt.start();

prompt.get(authProperties, function (err, result) {
    if (err) {
        return onErr(err);
    } else {

        // Create credentials from user input and pass on to getOrgs()
        var username = '';

        if (result.tokenaccess.toLowerCase() === 'n') {
            username = result.username;
        } else {
            username = result.username + '/token';
        }

        // Complete full CSV File path
        csvFile += result.exportFile + '.csv';

        console.log("\n"); // Make space for request processing in console
        getOrgs(username, result.password, result.subdomain, csvFile);
    }

});

function onErr(err) {
    console.log("There was a problem.\n", err);
}

function getOrgs(username, password, subdomain, csvFile) {

    // Set a timeout to control rate of API requests
    setTimeout(function() {

        // Print the page number that we are requesting
        // console.log("Getting page " + page + "..." );

        request.get('https://' + subdomain + '.zendesk.com/api/v2/organizations.json?page=' + page, function (error, response, body) {
            if (!error && response.statusCode == 200) {

                // Set retry interval back to normal if it was changed from rate limiting
                retry = defaultRetry;

                // Parse the data
                var data = JSON.parse(body);

                // Create the progress bar if page < 2
                if (page === 1) {
                    bar = new ProgressBar('Download Progress [:bar] :percent', {
                        complete: '=',
                        incomplete: ' ',
                        width: 50,
                        total: data.count
                    });
                }

                underscore._.each(data.organizations, function(value) {
                    orgs.push({"name":value.name, "id":value.id, "url":value.url});
                });

                // Update download progress bar
                bar.tick(orgs.length);

                if (data.next_page !== null) {
                    page++;
                    getOrgs(username, password, subdomain, csvFile);
                } else {
                    var csvContent = json2csv.convert(orgs);

                    console.log("Done fetching data.\n");
                    fs.writeFile(csvFile, csvContent, function (err){
                        if (err) throw err;
                        console.log("Saved " + orgs.length + " organizations to " + csvFile);
                    });
                }

            } else if (response.statusCode == 429) {
                // Modify retry interval according to response
                retry = response["Retry-After"];
                getOrgs(username, password, subdomain, csvFile);
            } else {
                console.log(response.statusCode);
                console.log(response.body);
                return error;
            }
        }).auth(username, password, false);

    }, retry);

}