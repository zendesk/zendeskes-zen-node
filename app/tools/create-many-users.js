// Dependencies
var prompt = require('prompt'),
    request = require('request'),
    ProgressBar = require('progress'),
    RateLimiter = require('limiter').RateLimiter;

// Constructors
var limiter = new RateLimiter(1, 500),
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
    name: 'totalUsers',
    description: 'Enter the number of users you wish to create:'.green,
    required: true
}, {
    name: 'startingUser',
    description: 'Enter the index number to start at:'.green,
    required: false
}, {
    name: 'includeEmails',
    description: 'Base email address to use (leave blank if you don\'t want to set one):'.green,
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
        createUsers(username, result.password, result.subdomain, parseInt(result.totalUsers), parseInt(result.startingUser), result.includeEmails);
    }

});

function onErr(err) {
    process.stdout.write("There was a problem.\n", err);
}

// Create the users
var createUsers = function (user, pass, subdomain, totalUsers, startingUser, emailFormat) {

    var endingUser = startingUser + totalUsers;
    process.stdout.write(totalUsers + " users will be created.\n\n" );

    if (emailFormat) {
        var emailParts = emailFormat.split('@');
        for (var e = startingUser; e < endingUser; e++) {
            var dataE = {"user": {"name": "Sample User " + e, "email": emailParts[0] + "+su" + e + "@" + emailParts[1], "verified": true}};
            createUser(user, pass, subdomain, dataE, totalUsers);
        }

    } else {
        for (var i = startingUser; i < endingUser; i++) {

            var data = {"user": {"name": "Sample User " + i, "verified": true}};
            createUser(user, pass, subdomain, data, totalUsers);
        }
    }

};

var createUser = function(user, pass, subdomain, data, totalUsers) {
    limiter.removeTokens(1, function(err, remainingRequests){
        request(
        {
            method: 'POST',
            uri: 'https://' + subdomain + '.zendesk.com/api/v2/users.json',
            body: data,
            json: true
        },
        function(err, resp, body){
            if (err) {
                process.stdout.write("There was a problem.");
                return false;
            }  else if (resp.statusCode == 200 || resp.statusCode == 201) {
                bar = bar || new ProgressBar('Progress: [:bar] :percent (approximately :etas remaining)', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: totalUsers
                });

                // Update progress bar
                bar.tick(1);

            } else if (resp.statusCode == 429) {
                setTimeout(createUser(user, pass, subdomain, data, totalUsers), response.headers["retry-after"]);
            } else {
                // Something else went wrong, exit the program with status response headers
                process.stdout.write(resp.headers.status + "\n\n");
                process.exit(1);
            }
        }).auth(user, pass);
    });
};