var http    = require('http');
var url     = require('url');
var extend  = require('extend');

var JoindinApi = function JoindinApi(options) {
    this.options = {
        'proxy_host' : 'localhost:9292',
        'api_host'   : 'api.joind.in',
        'api_version': 'v2.1'
    };
    extend(this.options, options);
};

JoindinApi.prototype.getProxyUri = function getProxyUri(real_uri) {
    var parts = url.parse(real_uri);
    return parts.protocol + '//' + this.options.proxy + '/' + parts.host + parts.path;
};

JoindinApi.prototype.getBaseUri = function getBaseUri() {
    return 'http://'+this.options.api_host+'/'+this.options.api_version;
};

JoindinApi.prototype.handleHttpResponse = function(res) {
    var data = '';
    res.on('data', function (chunk) {
        data += chunk;
    })
};

JoindinApi.prototype.getTalks = function getTalks(user_id, callback) {
    var uri = this.getProxyUri(this.getBaseUri() + '/users/' + user_id + '/talks');
    http.get(uri, function(res) {
        var data = '';
        res.on('data', function (chunk) { data += chunk; });
        res.on('end', function() {
            var parsed = JSON.parse(data);
            callback(parsed.talks);
        });
    });
};

JoindinApi.prototype.getUser = function getUser(username, callback) {
    var uri = this.getProxyUri(this.getBaseUri() + '/users?username=' + username);
    http.get(uri, function (res) {
        var data = '';
        res.on('data', function (chunk) { data += chunk; });
        res.on('end', function () {
            var parsed = JSON.parse(data);
            callback(parsed.users[0]);
        });
    });
};

JoindinApi.prototype.getComments = function getComments(talk_ids, callback) {
    var comments = [];
    var callbacks = talk_ids.length;
    for(var i=0; i<talk_ids.length; i++) {
        var uri = this.getProxyUri(this.getBaseUri() + '/talks/' + talk_ids[i] + '/comments');
        http.get(uri, function (res) {
            var data = '';
            res.on('data', function (chunk) {data += chunk; });
            res.on('end', function () {
                var parsed = JSON.parse(data);
                var comment_strings = parsed.comments.map(function(comment_obj) {
                    return comment_obj.comment.trim().replace(/\'/g, '').replace(/\s+/g, ' ');
                });
                Array.prototype.push.apply(comments, comment_strings);
                if(--callbacks == 0) {
                    callback(comments);
                }
            })
        })
    }
};

module.exports = JoindinApi;
