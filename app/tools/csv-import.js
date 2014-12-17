
var fs=require("fs");
var prompt = require('prompt');
var Converter=require("csvtojson").core.Converter;
var mkpath = require('mkpath');
var touch = require('touch');

prompt.get([{name: 'filename', description: 'Enter the filename (excluding \'.csv\')'}], function (err, result) {

    var csvFile = __dirname + '/data-sets/' + result.filename + '.csv';
    var jsonFile = __dirname + '/data-sets/tmp/' + result.filename + '.json';

    if (! fs.existsSync(__dirname + '/data-sets/tmp')) {
        console.log("Creating temporary directory and file...");
        mkpath.sync(__dirname + '/data-sets/tmp', 0700);
        touch(jsonFile);

        parseCsv(csvFile, jsonFile);


    } else if (fs.existsSync(__dirname + 'data-sets/tmp') && !fs.existsSync(jsonFile)) {
        console.log("Creating empty JSON file");
        touch(jsonFile);

        parseCsv(csvFile, jsonFile);

    }



});


var parseCsv = function (csvFile, jsonFile) {

    var csvRS = fs.createReadStream(csvFile);

    var csvConverter=new Converter({constructResult:true});

    csvConverter.on("end_parsed",function(data){
        fs.writeFile(jsonFile, JSON.stringify(data, null, 4), function(err){
            if (err) {
                console.log(err);
            } else {
                console.log("Converted " + csvFile + " to JSON, and saved to " + jsonFile);
            }
        })

        sendRequests();
    });

    csvRS.pipe(csvConverter);

};

var sendRequests = function () {
    var jsonRS = fs.createReadStream(jsonFile);
}