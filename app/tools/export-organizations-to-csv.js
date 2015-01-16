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
var csvFile = __dirname + '/data-sets/tmp/',
    page = 1,
    defRetry = 2000,
    retryInterval = defRetry,
    bar,
    orgs = [];

// Define authentication values and export filename
var authProperties = [{
    name: 'tokenaccess',
    description: 'Will you be using token access (y/n):'.green,
    pattern: /^[YNyn]{1}$/,
    message: 'You must enter \'y\' or \'n\'',
    required: true
}, {
    name: 'username',
    description: 'Enter your username for Zendesk:'.green,
    required: true
}, {
    name: 'password',
    description: 'Enter your password or API token:'.green,
    hidden: true,
    required: true
}, {
    name: 'subdomain',
    description: 'Enter your Zendesk subdomain:'.green,
    required: true
}, {
    name: 'exportFile',
    description: 'Enter a filename to export the CSV to:'.green,
    required: true
}];

prompt.start();

// Get authentication values and export filename
prompt.get(authProperties, function(err, result) {
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

        // Make space for request processing in console
        process.stdout.write("\n");

        // Begin fetching data
        getOrgs(username, result.password, result.subdomain, csvFile);
    }

});

function onErr(err) {
    process.stdout.write("There was a problem.\n", err);
}


// Data fetching function
function getOrgs(username, password, subdomain, csvFile) {

    // Set a timeout to control rate of API requests
    setTimeout(function() {

        // Make the request
        request.get('https://' + subdomain + '.zendesk.com/api/v2/organizations.json?page=' + page, function(error, response, body) {

            // If there are no errors, begin processing response
            if (!error && response.statusCode == 200) {

                // Set retry interval back to normal if it was changed from rate limiting
                retryInterval = defRetry;

                // Parse the data
                var data = JSON.parse(body);

                // Create or update progress bar
                bar = bar || new ProgressBar('Downloading organizations: [:bar] :percent (approximately :etas remaining)', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: data.count
                });

                // Update progress bar
                bar.tick(data.organizations.length);

                // Push the response data into the organization array
                underscore._.each(data.organizations, function(value) {

                    // Expand tag and domain objects
                    var tags = '',
                        domains = '';

                    for (var a=0; a < value.tags.length; a++) {
                        if (a < value.tags.length - 1) {
                        tags += value.tags[a] + ', ';
                        } else {
                            tags += value.tags[a];
                        }
                    }

                    for (var b=0; b < value.domain_names.length; b++) {
                        if (b < value.domain_names.length - 1) {
                            domains += value.domain_names[b] + ', ';
                        } else {
                            domains += value.domain_names[b];
                        }
                    }

                    orgs.push({
                        "id": value.id,
                        "name": value.name,
                        "created": value.created_at,
                        "updated": value.updated_at,
                        "external id": value.external_id,
                        "shared tickets": value.shared_tickets,
                        "shared comments": value.shared_comments,
                        "domains": domains,
                        "details": value.details,
                        "notes": value.notes,
                        "default group": value.group_id,
                        "tags": tags,
                        "url": value.url
                    });


                });

                // If there is another page, request it, otherwise we're done fetching data and can save it to CSV
                if (data.next_page !== null) {
                    page++;
                    getOrgs(username, password, subdomain, csvFile);
                } else {
                    var csvContent = json2csv.convert(orgs);

                    process.stdout.write("Download complete.\n");
                    fs.writeFile(csvFile, csvContent, function(err) {
                        if (err) throw err;

                        // Print the number of organizations pulled from the download
                        process.stdout.write("Saved " + orgs.length + " organizations to " + csvFile);
                    });
                }

            } else if (response.statusCode == 429) {

                // Modify retry interval according to response
                retryInterval = response["Retry-After"];
                getOrgs(username, password, subdomain, csvFile);

            } else {

                // If there was a problem with the request, print the status and response body
                process.stdout.write(response.statusCode);
                process.stdout.write(response.body);
                return error;

            }

        }).auth(username, password, false);
    }, retryInterval);

}
