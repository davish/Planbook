var express = require("express"),
    app = express(),
    MongoClient = require('mongodb').MongoClient;
var http = require('http'),
    fs = require('fs');
var db = null;

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

app.get('/', function(req, res) {
  res.render("index.html");
});

// get this week's assignments, with req.session.username, req.session.monday and req.body.assignments
app.get('/planner', function(req, res) {
    
});

// update this week's assignments, with req.session.username, req.session.monday and req.body.assignments
app.get('/settings', function(req, res) {
    
});
app.post('/settings', function(req, res) {

})

app.post('/signup', signup);

app.post('/login', login);

app.get('/logout', function(req, res) {
  req.session.username = undefined;
  res.redirect('/');
});

app.get('/session', function(req, res) {
  res.send({
    "username": req.session.username,
  });
});

function login(req, res) {
  var options = {host: 'compsci.dalton.org',port: 8080, path: '/zbuttenwieser/validation/index.jsp?username='+req.body.username+'&password='+req.body.password};
  res.type('text/json');
  http.get(options, function(r) {
    switch (r.statusCode) {
      case 200: // user exists in Dalton db
        // check if they exist in our db:
        var u = db.users.findOne({'name': req.body.username});
        if (u) {
          req.session.username = req.body.username;
          res.send(200); // send back that login went swimmingly
        }
        else // In Dalton, but first time using the service
            signup(req, res);
        break;
      case 404: // not found in Dalton
        res.send(403, {'message': 'The username and password entered do not match.'});
        break;
    }
  }).on('error', function(e) {
    res.end(500);
  });
}

function signup(req, res) {
  res.type('text/json');
  if (!(db.users.findOne({'name': req.body.username}))) { // if the user doesn't already exist
    var user = { // create the user schema
      name: req.body.username,
      settings: {
                  'rows': [
                            "English", 
                            "History", 
                            "Math", 
                            "Science", 
                            "Language",
                            "Other"
                          ],
                  'theme': "default"
                }
    };
    
    db.collection("users").insert(user, function(err, result) {
      if (!err)
        login(req, res);
      else
        res.send(500, err);
    });
  } else {
    res.send(403, {'message': 'The username and password entered do not match.'});
  }
}

var server = app.listen(app.get('port'), function() {
  console.info('Listening on port %d', server.address().port);
});
