var async      = require('async');
var gramophone = require('gramophone');
var JoindinApi = require('./lib/joindin');

var options = {
    proxy: 'localhost:9292'
};

var api = new JoindinApi(options);

async.waterfall(
    [
        function(callback) {
            api.getUser('lornajane', function (data) {
                var segments = data.uri.split('/');
                var userid   = segments[segments.length-1];
                callback(null, userid);
            });
        },
        function(user_id, callback) {
            api.getTalks(user_id, function (talks) {
                var talk_ids = talks.map(function (talk) {
                    var segments = talk.comments_uri.split('/');
                    return segments[segments.length-2];
                });
                callback(null, talk_ids)
            });
        },
        function(talk_ids, callback) {
            api.getComments(talk_ids, function(comments) {
                callback(null, comments.join());
            })
        },
        function(comments, callback) {
            var results = gramophone.extract(comments, {score: true});
            callback(null, results);
        }
    ],
    function(err, results) {
        console.log(results);
    }
);
