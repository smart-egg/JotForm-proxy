const request = require('request');

module.exports.makeJotFormAPIRequest = function (formId, context) {
    let options = {
        url: `http://eu-api.jotform.com/form/${formId}/questions?apiKey=${process.env.JOT_FORM_API_KEY}`,
        method: 'GET'
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            }
            if (body) {
                body = JSON.parse(body)
                resolve(body.content);
            }
        });
    });

    // return new Promise((resolve, reject) => {
    //     const fs = require('fs');
    //     var content;
    //     // First I want to read the file
    //     fs.readFile(__dirname + '/sampleres.json', function read(err, data) {
    //         if (err) {
    //             reject(err);
    //         }
    //         resolve(JSON.parse(data));
    //     });
    // })
};

module.exports.filterObjects = (data, filterPropValue) => {
    let questionIds = [];
    for (let item in data) {
        if (data.hasOwnProperty(item) && data[item]['cfname'] == filterPropValue) {
            questionIds.push(item);
        }
    }
    return questionIds;
}