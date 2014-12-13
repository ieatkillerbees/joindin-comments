var async      = require('async');
var gramophone = require('gramophone');
var JoindinApi = require('./lib/joindin');
var express    = require('express');
var util       = require('util');

var app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/:username', function(req, res) {
    var api = new JoindinApi();
    var username = req.params.username;
    async.waterfall(
        [
            function(callback) {
                util.debug("Getting info for username '" + username + "'");
                api.getUser(username, function (data) {
                    if (typeof data == 'undefined') {
                        msg = "No data for " + username;
                        var err = new Error(msg);
                        util.debug(msg);
                        callback(err, 404);
                        return;
                    }
                    var segments = data.uri.split('/');
                    var userid   = segments[segments.length-1];
                    util.debug("Found userid '" + userid + "'for '" + username + "'");
                    callback(null, userid);
                });
            },
            function(user_id, callback) {
                util.debug("Getting talks for username '" + username + "'");
                api.getTalks(user_id, function (talks) {
                    var talk_ids = talks.map(function (talk) {
                        var segments = talk.comments_uri.split('/');
                        return segments[segments.length-2];
                    });
                    if (talk_ids.length == 0) {
                        msg = "No talks found for " + username;
                        util.debug(msg);
                        var err = new Error(msg);
                        callback(err, 404);
                        return;
                    }
                    util.debug("Found " + talk_ids.length + " talks");
                    callback(null, talk_ids)
                });
            },
            function(talk_ids, callback) {
                util.debug("Getting comments for " + username + "'s talks");
                api.getComments(talk_ids, function(comments) {
                    if (comments.length == 0) {
                        msg = "No comments found for " + username;
                        util.debug(msg);
                        var err = new Error(msg);
                        callback(err, 404);
                        return;
                    }
                    callback(null, comments.join());
                })
            },
            function(comments, callback) {
                var results = gramophone.extract(comments, {score: true});
                callback(null, results);
            }
        ],
        function(err, results) {
            if (err) {
                res.status(results);
                res.send(err.message);
                return;
            }
            res.send(JSON.stringify(results));
        }
    );
});

app.listen(process.argv[2]);
