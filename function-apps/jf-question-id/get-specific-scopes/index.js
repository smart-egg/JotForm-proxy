const lib = require('./lib');

module.exports = async function (context, req) {
    let queryObj = req.query;
    return lib.verifyInputs(queryObj)
        .then(() => {
            return lib.getQuestionIds(queryObj, req.headers['x-functions-key'], context);
        })
        .then(questionId => {
            queryObj.questionId = questionId;
            return lib.getSpecificScopes(queryObj);
        })
        .then(rawResponse => {
            let response = lib.filterObjects(rawResponse, queryObj);
            context.res = response;
            context.done();
        })
        .catch(error => {
            context.res = error;
            context.done();
        })
};