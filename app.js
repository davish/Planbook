var express = require("express"),
    app = express(),
    MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var routes = require('./routes/index.js');
global.whitelist = require('whitelist').whitelist;
global.db = null;

app.configure("development", function() {
  app.use(express.logger({'format': 'dev'}));
});

app.configure("production", function() {
  app.use(express.logger({'stream': fs.createWriteStream('log.txt')}));
});

app.configure(function() {  
  app.engine("html", require("ejs").renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.set('port', (process.env.PORT || process.argv[2] || 5000));
  
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  
  app.use(express.session({ secret: 'keyboard cat' }));
  
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));

});
// render the planner or the homepage depending on if you're logged in or not.
app.get('/', function(req, res) {
  if (req.session.username) // if logged in
    res.render("planner.html"); // render planner
  else {
    var agent = req.headers['user-agent'].toLowerCase();
    // if 'iphone', 'ipad', or 'android' can't be found in the user agent
    if (agent.indexOf('mobile') <= 0 || agent.indexOf('ipad') >= 0) // if 'mobile' isn't there or 'ipad' is there
      res.render("homepage.html");
    else
      res.render("signin.html", {"error": ""});
  }
});


app.get('/login', routes.login.get);
app.post('/login', routes.login.post);
app.get('/logout', function(req, res) { // remove cookie from client, redirect to homepage.
  req.session.username = undefined;
  res.redirect('/');
});

app.get('/planner', routes.planner.get);
app.post('/planner', routes.planner.post);

app.get('/settings', routes.settings.get);
app.post('/settings', routes.settings.post);

// app.get('/reminders', routes.reminders.get);
// app.post('/reminders', routes.reminders.post);

MongoClient.connect('mongodb://localhost/planner', function(err, dbase) {
  if (!err) {
    db = dbase;
    var server = app.listen(app.get('port'), function() {
      console.info('Listening on port %d', server.address().port);
    });
  } else {
    console.error(err);
  }
});
