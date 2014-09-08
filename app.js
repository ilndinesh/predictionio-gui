var express = require('express'),
    app = express(),
    prediction = require('predictionio-client'),
    hogan = require('hogan.js'),
    fs = require('fs'),
    path = require('path'),
    http = require('http');

prediction.config.APP_KEY = 'qBqtB8g1Ugtb2QfnORMCX4BqfH4gkXOBQe6cDKXIZ0BKMZThU3g5XCjh4kSc9zGq';
prediction.config.APP_URL = 'http://localhost:8000';

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname+'/views');
app.set('view engine', 'html');
app.set('layout', 'layout');
app.enable('view cache');
app.engine('html', require('hogan-express'));
app.use(require('body-parser')());
app.use(require('method-override')());
app.use(express.static(path.join(__dirname, 'web')));

app.get('/', function (req, res) {
    res.render('index', {});
});
app.post('/user', function (req, res) {
    var user = req.body.user;
    prediction.user.createUser(user, function (x, data) {
        res.send({ message: 'The user "'+user+" has been created."});
    });
});
app.post('/item', function (req, res) {
    var item = req.body.item;
    prediction.item.getItem(item, function (x, data) {
        res.send(data);
    });
});
app.post('/show', function (req, res) {
    var user = req.body.user;
    var show = req.body.show;
    prediction.item.createItem(show, 'show', function () {
        prediction.action.like(user, show, function() {
            res.send({ message: 'You liked "'+show+'".'});
        });
    });
});

var recommend = function (req, res, engine) {
    var user = req.body.user;
    prediction.engine.recommendedItems(engine, user, 5, function (x, data) {
        // console.log(data);
        var items = {};
        if(data.pio_iids) {
        for(var i = 0; i < data.pio_iids.length; i++) {
                prediction.item.getItem(data.pio_iids[i], function (x1, itemData) {
                    if(itemData.message) {
                    } else {
                        items[itemData.pio_iid] = itemData.pio_iid + ' - ' + itemData.title;
                    }
                });
        }
        setTimeout(function() {
                var resData = [];
                var index = 0;
                for(var item in items) {
                    if(items.hasOwnProperty(item)) {
                        resData[index++] = items[item];
                    }
                }
                res.send(resData); 
        }, 2000);
        } else {
            res.send([]);
        }
    });
};
app.post('/recommend', function (req, res) {
    recommend(req, res, 'itemrec');
});
app.post('/recommend1', function (req, res) {
    recommend(req, res, 'vm-rec');
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
