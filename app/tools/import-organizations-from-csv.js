// Dependencies
var fs = require('fs');
var csv = require('fast-csv');
var _ = require('underscore');

// Create read stream
var stream = fs.createReadStream(__dirname + "/organizations.csv");

// Create request function
var log = _.bind(console.log, console);

var csvStream = csv()
    .on("data", function(data){
         _.delay(log, 1000, data);
    })
    .on("end", function(){
         _.delay(log, 1000, "done");
    });

stream.pipe(csvStream);