var async      = require('async');
var gramophone = require('gramophone');
var JoindinApi = require('./lib/joindin');
var express    = require('express');

var app = express();
app.get('/:username', function(req, res) {
    var api = new JoindinApi();
    var username = req.params.username;
    async.waterfall(
        [
            function(callback) {
                api.getUser(username, function (data) {
                    if (typeof data == 'undefined') {
                        callback('No data');
                        return;
                    }
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
            res.send(JSON.stringify(results));
        }
    );
});

app.listen(process.env.PORT);
