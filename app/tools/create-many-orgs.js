// Dependencies
var prompt = require('prompt'),
    request = require('request'),
    ProgressBar = require('progress'),
    RateLimiter = require('limiter').RateLimiter;

// Constructors
var limiter = new RateLimiter(1, 200),
    bar;

// Set prompt appearance
prompt.message = '> '.green;
prompt.delimiter = '';

// Define authentication values, and request parameters
var authProperties = [{
    name: 'tokenaccess',
    description: 'Will you be using token access (y/n)?'.green,
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
    name: 'totalOrgs',
    description: 'Enter the number of organizations you wish to create:'.green,
    required: true
}, {
    name: 'startingOrg',
    description: 'Enter the index number to start at:'.green,
    required: false
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

        // Begin posting data
        createOrgs(username, result.password, result.subdomain, parseInt(result.totalOrgs), parseInt(result.startingOrg));
    }

});

function onErr(err) {
    process.stdout.write("There was a problem.\n", err);
}

// Create the organizations
var createOrgs = function (user, pass, subdomain, totalOrgs, startingOrg) {

    var endingOrg = startingOrg + totalOrgs;
    process.stdout.write(totalOrgs + " organizations will be created.\n\n" );

    for (var i = startingOrg; i < endingOrg; i++) {

        var data = {"organization": {"name": "Sample Organization " + i}};
        createOrganization(user, pass, subdomain, data, totalOrgs);

    }

};

var createOrganization = function(user, pass, subdomain, data, totalOrgs) {
    limiter.removeTokens(1, function(err, remainingRequests){
        request(
        {
            method: 'POST',
            uri: 'https://' + subdomain + '.zendesk.com/api/v2/organizations.json',
            body: data,
            json: true
        },
        function(err, resp, body){
            if (err) {
                process.stdout.write("There was a problem.");
                return false;
            } else if (resp.statusCode == 429) {
                setTimeout(createOrganization(user, pass, subdomain, data, totalOrgs), response.headers["retry-after"]);
            } else if (resp.statusCode == 401 || resp.statusCode == 501 || resp.statusCode == 504) {
                throw new Error(resp.headers.status);
            } else if (resp.statusCode == 200 || resp.statusCode == 201) {
                bar = bar || new ProgressBar('Progress: [:bar] :percent (approximately :etas remaining)', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: totalOrgs
                });

                // Update progress bar
                bar.tick(1);
            }
        }).auth(user, pass);
    });
};