return new Promise((resolve, reject) => {
    const fs = require('fs');
    var content;
    // First I want to read the file
    fs.readFile(__dirname + '/sampleres.json', function read(err, data) {
        if (err) {
            reject(err);
        }
        resolve(JSON.parse(data));
    });

}).then(data => {
    for (let item in data) {
        if (data.hasOwnProperty(item) && data[item]['cfname'] == 'SpecificScopes') {
            console.log('------------');
        }
    }
})