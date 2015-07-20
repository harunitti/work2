var express = require('express');
var http    = require('http');
var app     = express();
var fs      = require('fs');
var path    = require('path')
var Promise = require("bluebird");
var sizeOf = require('image-size');

app.use(express.static(__dirname + '/public'));

app.get('/get_image_list', function(req, res) {
    // TODO:Moduleにする
    function get_image_list(dir) {
        return new Promise(function (resolve) {
            fs.readdir(dir, function (err, files) {
                if (err) throw err;
                var list = [];
                files.filter(function (file) {
                    var ext = path.extname(file);
                    if (ext == '.png' || ext == '.jpg' || ext == '.jpeg') {
                        return file;
                    }
                }).forEach(function (file) {
                    var dimensions = sizeOf(dir + '/' + file);
                    list.push({name: file, width: dimensions.width, height: dimensions.height});
                });
                resolve(list);
            });
      });
    }
    var tasks = [
      get_image_list('public/images/photo'),
      get_image_list('public/images/icon')
    ];
    Promise.all(tasks).then(function(results) {
        res.json(results);
    });
});

var port = process.env.PORT || 5000;
var server = http.createServer(app).listen(port);