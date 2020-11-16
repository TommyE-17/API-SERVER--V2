const utilities = require('./utilities');
const Response = require("./response");
const Endpoints = require('./endpoints');

// this function extract the JSON data from the body of the request
// and and pass it to controller Method
// if an error occurs it will send an error response
function processJSONBody(req, res, controller, methodName) {
    let response = new Response(res);
    let body = [];
    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        try {
            // we assume that the data is in JSON format
            if (req.headers['content-type'] === "application/json") {
                controller[methodName](JSON.parse(body));
            }
            else 
                response.unsupported();
        } catch(error){
            console.log(error);
            response.unprocessable();
        }
    });
}

exports.dispatch_TOKEN_EndPoint = function(req, res){
    let response = new Response(res);
    let url = utilities.removeQueryString(req.url);
    if (url =='/token'){
        try{
            // dynamically import the targeted controller
            // if the controller does not exist the catch section will be called
            const Controller = require('./controllers/AccountsController');
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (req.method === 'POST')
                processJSONBody(req, res, controller, 'login');
            else {
                response.notFound();
            }
            // request consumed
            return true;

        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
            // request consumed
            return true;
        }
    }
    // request not consumed
    // must be handled by another middleware
    return false;
}

// {method, ControllerName, Action}
const RouteRegister = require('./routeRegister');
const TokenManager = require('./tokenManager');
exports.dispatch_Registered_EndPoint = function(req, res){
    const RouteRegister = require('./routeRegister');
    let response = new Response(res);
    let route = RouteRegister.find(req);
    if (route != null) {
        try{
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + utilities.capitalizeFirstLetter(route.modelName) + "Controller");// <<<-----
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (!controller.requestAuthorized()){
                console.log('unauthorized access!');
                response.unAuthorized();
                // request consumed
                return true;
            }
            
            if (route.method === 'POST' || route.method === 'PUT')
                processJSONBody(req, res, controller, route.actionName);
            else {
                controller[route.actionName](route.id);
            }
            // request consumed
            return true;
        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
                // request consumed
                return true;
        }
    }
    // not an registered endpoint
    // request not consumed
    // must be handled by another middleware
    return false;
}

//////////////////////////////////////////////////////////////////////
// dispatch_API_EndPoint middleware
// parse the req.url that must have the following format:
// /api/{ressource name} or
// /api/{ressource name}/{id}
// then select the targeted controller
// using the http verb (req.method) and optionnal id
// call the right controller function
// warning: this function does not handle sub resource
// of like the following : api/resource/id/subresource/id?....
//
// Important note about controllers:
// You must respect pluralize convention: 
// For ressource name RessourName you have to name the controller
// RessourceNamesController that must inherit from Controller class
/////////////////////////////////////////////////////////////////////
exports.dispatch_API_EndPoint = function(req, res){
    
    if (req.url == "/api"){
        Endpoints.list(res);
        // request consumed
        return true;
    }
    
    let path = utilities.decomposePath(req.url);
    let controllerName = makeControllerName(path.model);
    let id = path.id;
    let accessToken = req.headers.access_token;

    if (path.id != undefined) {
        if (isNaN(path.id)) {
            // request not consumed
            return false;
        }
    }


    if (controllerName != undefined) {
        let response = new Response(res);
        try{
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + controllerName);
            // instanciate the controller       
            let controller =  new Controller(req, res);
            

            if (!controller.requestAuthorized()){
                console.log('unauthorized access!');
                response.unAuthorized();
                // request consumed
                return true;
            }
            if (req.method === 'GET') {
                controller.get(id);
                // request consumed
                return true;
            }
            if (req.method === 'POST' && TokenManager.find(accessToken) != null){
                processJSONBody(req, res, controller, "post");
                // request consumed
                return true;
            }
            if (req.method === 'PUT' && TokenManager.find(accessToken) != null){
                processJSONBody(req, res, controller, "put");
                // request consumed
                return true;
            }
            if (req.method === 'PATCH'){
                processJSONBody(req, res, controller, "patch");
                // request consumed
                return true;
            }
            if (req.method === 'DELETE' && TokenManager.find(accessToken) != null) {
                if (!isNaN(id))
                    controller.remove(id);
                else 
                    response.badRequest();
                // request consumed
                return true;
            }
            else{
                console.log("ERREUR")
            }
        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
           // console.log(error);
            response.notFound();
                // request consumed
                return true;
        }
    }
    // not an API endpoint
    // request not consumed
    // must be handled by another middleware
    return false;
}