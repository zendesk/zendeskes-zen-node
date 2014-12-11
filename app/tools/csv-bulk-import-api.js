var fs = require('fs');
var parse = require('csv-parse');
var prompt = require('prompt');

// Start prompt functionality
prompt.start();

prompt.get([{name: 'filename', description: 'Enter the filename (excluding \'.csv\')'}], function (err, result){

    var parser = parse({delimiter: ','}, function(err, data){
        console.log(data);
    });

    var filepath = __dirname + '/data-sets/' + result.filename + '.csv';

    fs.createReadStream(filepath).pipe(parser);

});