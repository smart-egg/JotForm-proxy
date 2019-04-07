const request = require('request');

function formResponse(status, message) {
    return {
        status: status,
        message: message
    }
}

module.exports.getQuestionIds = (queryObj, xFunctionsKey, context) => {
    let queryStringObj = {
        code: xFunctionsKey,
        formID: queryObj.formID,
        consentQuestionName: queryObj.consentQuestionName
    }

    // NOTE: May think of moving the url to application settings
    let options = {
        url: `https://jf-question-id-dev.azurewebsites.net/api/get-question-ids`,
        method: 'GET',
        qs: queryStringObj
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else if (body) {
                body = JSON.parse(body);
                let questionId = body.consentQuestionID;
                questionId ? resolve(questionId) : body.message ? reject(formResponse("error", body.message)) : formResponse("error", "Unknown Error");
            } else {
                reject(formResponse("error", "Unknown Error"))
            }
        });
    });
};

module.exports.getSpecificScopes = (queryObj) => {
    let options = {
        url: `http://eu-api.jotform.com/form/${queryObj.formID}/question/${queryObj.questionId}?apiKey=${process.env.JOT_FORM_API_KEY}`,
        method: 'GET'
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else if (body) {
                resolve(JSON.parse(body));
            } else {
                reject("Unknown Error")
            }
        });
    });
};

module.exports.filterObjects = (rawResponse, queryObj) => {

    let response = null;

    switch (rawResponse.responseCode) {
        case 200:
            let items = rawResponse.content ? rawResponse.content.items ? rawResponse.content.items : "" : "";
            let options = items.split("\n");
            let result = options.map((it, i) => { return { id: i + 1, text: it } });

            response = formResponse("success", "");
            response.formID = queryObj.formID;
            response.consentQuestionID = queryObj.questionId;
            response.scopes = result;
            break;
        case 401:
        case 404:
            response = formResponse("error", "Accepted parameters: formID and consentQuestionName.");
            throw response
        default:
            response = formResponse("error", rawResponse.message);
            throw response;
    }

    return response;
};
