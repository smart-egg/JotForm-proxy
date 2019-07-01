const lib = require('./lib');

module.exports = async function (context, req) {
    return lib.makeJotFormAPIRequest(req.query.formID, context)
        .then(rawResponse => {
            let response = lib.filterObjects(rawResponse, req.query.formID, req.query.consentQuestionName);
            context.res = {
                body: response
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