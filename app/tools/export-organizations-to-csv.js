// Dependencies
var fs = require('fs'),
    prompt = require('prompt'),
    request = require('request'),
    csv = require("fast-csv"),
    _ = require('underscore-node'),
    mkdirp = require('mkdirp'),
    ProgressBar = require('progress'),
    RateLimiter = require('limiter').RateLimiter,
    sleep = require('thread-sleep');

// Define global variables
var bar,
    limiter = new RateLimiter(1, 10000),
    csvStream = csv.format({headers: true, quote: '\"'}),
    writableStream,
    totalCount;

// Define prompt appearance
prompt.message = '> '.green;
prompt.delimiter = '';

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

        // Make space for request processing in console
        process.stdout.write("\n");

        // Make output directory if it doesn't exist
        mkdirp(__dirname + '/exports/', function (err) {
            if (err) {
                onErr(err);
            } else {
                // Fetch the total number of records for the progress bar
                request({
                    method: 'GET',
                    uri: 'https://' + result.subdomain + '.zendesk.com/api/v2/organizations.json'
                },
                function (err, resp, body) {
                    if (err) {
                        throw new Error(err);
                    } else if (resp.statusCode == 200 || resp.statusCode == 201) {
                        var data = JSON.parse(body);
                        totalCount = data.count;
                    } else {
                        process.stdout.write(resp.headers.status + "\n\n");
                        process.exit(1);
                    }
                }).auth(username, result.password, true);
                // Begin fetching data with start_time of 01-01-2000 00:00:00 GMT
                requestBuilder(username, result.password, 'https://' + result.subdomain + '.zendesk.com/api/v2/incremental/organizations.json?start_time=946684800', result.exportFile);
            }
        });
    }

});

// Default error
var onErr = function(err) {
    process.stdout.write("There was a problem:\n", err, "\n\n");
    process.exit(1);
};

// Build the requests to get the pages of organization data
var requestBuilder = function(username, password, nextPage, csvFile) {

    if (nextPage === null) {
        csvStream.end();
        process.stdout.write("\nThe CSV has been successfully saved to " + __dirname + '/exports/' + csvFile + '.csv\n\n');
    } else {
        getOrgs(username, password, nextPage, csvFile);
    }
};

// Make the request to get a page of organization data
var getOrgs = function(username, password, nextPage, csvFile) {
    limiter.removeTokens(1, function(err, remainingRequests){
        request(
        {
            method: 'GET',
            uri: nextPage
        },
        function (err, resp, body){
            if (err) {
                throw new Error(err);
            } else if (resp.statusCode == 200 || resp.statusCode == 201) {

                // Open CSV write stream if it isn't already open
                if (! writableStream) {
                    writableStream = fs.createWriteStream(__dirname + '/exports/' + csvFile + '.csv');
                    csvStream.pipe(writableStream);
                }

                // Parse the data
                var data = JSON.parse(body);

                // Create the progress bar if there wasn't one
                bar = bar || new ProgressBar('Progress: [:bar] :percent (~:etas remaining)', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: totalCount
                });

                // Push the response data into the organizations array
                var orgFields = [];

                _.each(data.organizations, function(organization) {

                    // Flatten the organization_fields into columns
                    orgFields = _.pairs(organization.organization_fields);
                    _.each(orgFields, function(value){
                        organization['custom_' + value[0]] = value[1];
                    });

                    // Remove the organization_fields sub-object, since we flattened it
                    delete organization.organization_fields;

                    // Write the row to the CSV
                    csvStream.write(organization);

                    // Update progress bar
                    bar.tick(1);
                });

                if (data.count === 1000) {
                    requestBuilder(username, password, data.next_page, csvFile);
                } else {
                    requestBuilder(username, password, null, csvFile);
                }
            } else if (resp.statusCode == 429) {
                // Rate limited... try the same request again after the timeout
                console.log("Rate limited... resuming in " + resp.headers["retry-after"] + " seconds.");
                sleep(resp.headers["retry-after"]*1000);
                getOrgs(username, password, nextPage, csvFile);
            } else {
                // Something else went wrong, exit the program with status response headers
                process.stdout.write(resp.headers.status + "\n\n");
                process.exit(1);
            }
        }).auth(username, password, true);
    });
};