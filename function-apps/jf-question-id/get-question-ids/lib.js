const request = require('request');

function formResponse(status, message) {
    return {
        status: status,
        message: message
    }
}

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
                resolve(JSON.parse(body));
            }
        });
    });
};

module.exports.filterObjects = (data, formID, filterPropValue) => {
    let response = {};
    switch (data.responseCode) {
        case 200:
            let questionId = null;
            let content = data.content;
            for (let item in content) {
                if (content.hasOwnProperty(item) && content[item].hasOwnProperty('cfname') && content[item]['cfname'] == filterPropValue) {
                    questionId = item;
                    break;
                }
            }
            response = questionId ? formResponse("success", "") : formResponse("success", `consentQuestionName "${filterPropValue}" not found`);
            response.formID = formID;
            response.consentQuestionID = parseInt(questionId);
            break;
        case 401:
        case 404:
            response = formResponse("error", "Accepted parameters: formID and consentQuestionName.");
            throw response
        default:
            response = formResponse("error", data.message);
            throw response;
    }
    return response;
}