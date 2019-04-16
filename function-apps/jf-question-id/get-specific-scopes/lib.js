const request = require('request');

const ACCEPTED_PARAMETERS = ['consentQuestionName', 'formID'];

function formResponse(statusCode, responseBody) {
    return {
        status: statusCode,
        body: responseBody
    }
}

module.exports.verifyInputs = (queryObj) => {
    let resp = null;
    return new Promise((resolve, reject) => {
        for (index in ACCEPTED_PARAMETERS) {
            if (!queryObj.hasOwnProperty(ACCEPTED_PARAMETERS[index])) {
                resp = {
                    status: "error",
                    message: `Accepted parameters are: ${ACCEPTED_PARAMETERS.join()}`
                }
                reject(formResponse(400, resp));
            }
        }
        resolve();
    })
};

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
                questionId ? resolve(questionId) : body.message ? reject(formResponse(400, { status: "error", message: body.message })) : reject(formResponse(400, { status: "error", message: "Unknown Error" }));
            } else {
                reject(formResponse(400, { status: "error", message: "Unknown Error" }))
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
    let resp = null;

    switch (rawResponse.responseCode) {
        case 200:
            let items = rawResponse.content ? rawResponse.content.items ? rawResponse.content.items : "" : "";
            let options = items.split("\n");
            let result = options.map((it, i) => { return { id: i + 1, text: it } });

            resp = {
                status: "success",
                message: ``,
                formID: queryObj.formID,
                consentQuestionID: queryObj.questionId,
                scopes: result
            }
            response = formResponse(200, resp);
            break;
        case 401:
            resp = {
                status: "error",
                message: `Accepted parameters: formID and consentQuestionName.`
            };
            response = formResponse(400, resp);
            throw response
        case 404:
            resp = {
                status: "error",
                message: `Requested URL is not available.`
            };
            response = formResponse(400, resp);
            throw response
        default:
            resp = {
                status: "error",
                message: rawResponse.message
            }
            response = formResponse(400, resp);
            throw response;
    }

    return response;
};
