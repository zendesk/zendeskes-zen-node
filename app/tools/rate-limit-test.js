var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(10, 'minute');
var sleep = require('thread-sleep');
var queueLevel = 0;

var processQueue = function() {
        limiter.removeTokens(1, function(err, remainingRequests){
        queueLevel++;

        if (queueLevel < 10) {
            console.log("Processed token " + queueLevel);
            processQueue();
        } else {
            console.log("Rate limited on token " + queueLevel);
            sleep(5000);
            processQueue();
        }
    });
};

processQueue();