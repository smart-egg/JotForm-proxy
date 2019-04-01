const lib = require('./lib');

module.exports = async function (context, req) {
    return lib.makeJotFormAPIRequest(req.query.formId, context)
        .then(rawResponse => {
            let questionIds = lib.filterObjects(rawResponse, req.query.consentQuestionName);
            context.res = {
                body: {
                    status: 'success',
                    message: '',
                    formID: req.query.formId,
                    consentQuestionID: questionIds
                }
            }
            context.done();
        })
        .catch(error => {
            context.res = {
                status: 400,
                body: error
            }
            context.done();
        })
};