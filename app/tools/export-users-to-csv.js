// Dependencies
var fs = require('fs'),
    prompt = require('prompt'),
    request = require('request'),
    csv = require("fast-csv"),
    underscore = require('underscore'),
    ProgressBar = require('progress'),
    RateLimiter = require('limiter').RateLimiter;

// Define global variables
var bar,
    limiter = new RateLimiter(1, 200),
    csvStream = csv.format({headers: true, quote: '\"'}),
    writableStream;

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

        // Open CSV write stream
        writableStream = fs.createWriteStream(__dirname + '/data-sets/output/' + result.exportFile + '.csv');
        csvStream.pipe(writableStream);

        // Make space for request processing in console
        process.stdout.write("\n");

        // Begin fetching data
        requestBuilder(username, result.password, 'https://' + result.subdomain + '.zendesk.com/api/v2/users.json');
    }

});

// Default error
var onErr = function(err) {
    process.stdout.write("There was a problem.\n", err);
};

// Build the requests to get the pages of user data
var requestBuilder = function(username, password, nextPage) {

    if (nextPage === null) {
        csvStream.end();
        process.stdout.write("\nThe CSV has been successfully saved to " + __dirname + '/data-sets/output/\n\n\n');
    } else {
        getUsers(username, password, nextPage);
    }
};

// Make the request to get a page of user data
var getUsers = function(username, password, nextPage) {
    limiter.removeTokens(1, function(err, remainingRequests){
        request(
        {
            method: 'GET',
            uri: nextPage
        },
        function (err, resp, body){
            if (err) {
                throw new Error(err);
            } else if (resp.statusCode == 429) {
                setTimeout(getUsers(username, password, nextPage), response.headers["retry-after"]);
            } else if (resp.statusCode == 401 || resp.statusCode == 501 || resp.statusCode == 504) {
                throw new Error(resp.headers.status);
            } else if (resp.statusCode == 200 || resp.statusCode == 201) {

                // Parse the data
                var data = JSON.parse(body);

                // Create the progress bar if there wasn't one
                bar = bar || new ProgressBar('Progress: [:bar] :percent (approximately :etas remaining)', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: data.count
                });

                // Push the response data into the users array
                var userFields = [],
                    fieldKey, fieldValue;

                underscore._.each(data.users, function(user) {

                    // Flattend the user_fields into columns
                    userFields = underscore._.pairs(user.user_fields);
                    underscore._.each(userFields, function(value){
                        user[value[0]] = value[1];
                    });

                    // Remove the user_fields sub-object, since we flattended it
                    delete user.user_fields;

                    // Write the row to the CSV
                    csvStream.write(user);

                    // Update progress bar
                    bar.tick(1);
                });


                requestBuilder(username, password, data.next_page);
            }
        }).auth(username, password, true);
    });
};
