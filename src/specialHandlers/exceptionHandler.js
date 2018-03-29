const logger = require("./../fakeLogger");


exports.handle = function(asked,answer){
    const error = answer.error;
    if(error instanceof Error){
        answer.status(500);
    }else if(error instanceof string){
        answer.status(500, error);
    }else{
        if(!error.stack){//Just to ensure that there is no server information exposed to the user
            answer.status(500, JSON.stringify(error));
        }else{
            answer.status(500);
        }
    }
    //set headers to indicate api gatway so that it can prevent further error or something
    answer.end();
    logger.log.error(error,asked.route);
}