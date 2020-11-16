const utilities = require('./utilities');
const Cache = require('./cache');
module.exports = 
class Response {
    constructor (res, url = "") {
        this.res = res;
        this.url = this.makeCacheableEndpoint(url);
        this.urlBase = this.makeUrlBase(url);
    }
    makeCacheableEndpoint(url){
        //return "";
        if (url != "") {
            let path = utilities.decomposePath(url);
            if (path.id == undefined)
                return (path.isAPI ? "/api":"") + "/" + path.model + (path.action != undefined ? "/" + path.action : "") + (path.queryString != undefined ? path.queryString : "");
        }
        // not cacheable
        return "";
    }
    makeUrlBase(url){
        if (url != "") {
            let path = utilities.decomposePath(url);
            return (path.isAPI ? "/api":"") + "/" + path.model;
        }
        return "";
    }
    status(number){
        this.res.writeHead(number, {'content-type':'text/plain'});
        this.res.end();
    }
    ok() {
        // ok status
        this.status(200);
        Cache.clear(this.urlBase);
    }
    accepted() {
        // accepted status
        this.status(202);
        Cache.clear(this.urlBase);
    }
    created(jsonObj) {
        this.res.writeHead(201, {'content-type':'application/json'});
        this.res.end(JSON.stringify(jsonObj));
        Cache.clear(this.urlBase);
    }
    JSON(jsonObj) {
        let content = JSON.stringify(jsonObj);
        Cache.add(this.url, content);
        this.res.writeHead(200, {'content-type':'application/json'});
        this.res.end(content);
    }  
    noContent() {
        // no content status
        this.status(204);
        Cache.clear(this.urlBase);
    }
    notFound() {
        // not found status
        this.status(404);
    }
    forbidden() {
        // forbidden status
        this.status(403);
    }
    unAuthorized() {
        // forbidden status
        this.status(401);
    }
    notAloud() {
        // Method not aloud status
        this.status(405);
    }
    conflict() {
      // Conflict status
      this.status(409);  
    }
    unsupported () {
        // Unsupported Media Type status
        this.status(415);
    }
    unprocessable() {
        // Unprocessable Entity status
        this.status(422);
    }
    badRequest() {
        // bad request status
        this.status(400);
    }
    internalError() {
        // internal error status
        this.status(500);
    }
    notImplemented() {
        //Not implemented
        this.status(501);
    }
}