var loginData = require('donotpush');
var dbURL = 'http://' + loginData.dbUser + ':' + loginData.dbPswd + '@' + loginData.dbURL + ':' + loginData.dbPort;

var express = require("express"),
    app = express(),
    http = require('http'),
    cookie = require('cookie'),
    nano = require('nano')(dbURL),
    fs = require('fs');
    _users = nano.use('_users');


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

app.get('/validate', function(req, res) {
  var options = {host: 'compsci.dalton.org',port: 8080, path: '/zbuttenwieser/validation/index.jsp?username=&password='};
  http.get(options, function(r) {
    console.log("Got response: " + r.statusCode);
    switch (r.statusCode) {
      case 200:
        res.end("OK");
        break;
      case 404:
        res.end("Fail");
        break;
    }
  }).on('error', function(e) {
    res.end(500);
  });
});

app.get('/settings', function(req, res) {
    res.redirect('/');
});

app.get('/planner', function(req, res) {
    res.redirect('/');
});

app.get('/test', function(req, res) {
  res.send("hello");
});

app.post('/signup', function(req, res) {
  // Look to see if user exists
  _users.get('org.couchdb.user:' + req.body.username, function(err, body) {
    if (!err) { // user is present in the database
      res.send(403, {'message': 'The username you attempted to sign up with already exists.'});
    } else if (err['message'] == 'missing' || err['status-code'] == 404) { // if the user isn't registered in the database, proceed with signup process
      signup(req, res);
    } else { // there's a different error that's not meant to be handled
      console.error(err)
      res.send(500, err);
      return;  
    }
  });
});

app.post('/login', login);

app.get('/logout', function(req, res) {
  req.session.username = undefined;
  req.session.password = undefined;
  res.clearCookie("AuthSession");
  res.redirect('/');
});

app.get('/session', function(req, res) {
  res.send({
    "username": req.session.username,
    "password": req.session.password
  });
});

function login(req, res) {

  var options = {host: 'compsci.dalton.org',port: 8080, path: '/zbuttenwieser/validation/index.jsp?username='+req.body.username+'&password='+req.body.password};
  http.get(options, function(r) {
    switch (r.statusCode) {
      case 200: // user exists in Dalton db
        nano.auth(req.body.username, req.body.password, function(err, body, headers) {
          if (headers) { // authorization went through
            req.session.username = req.body.username;
            req.session.password = req.body.password;

            res.type('text/json');
            res.cookie("AuthSession", cookie.parse(headers['set-cookie'][0]).AuthSession);
            res.send({"user": req.body.username, "dbURL": loginData.dbURL});
          }
          else // username doesn't exist, or pswd is wrong
            signup(req, res);
        });
        break;
      case 404:
        res.send(403, {'message': 'The username and password entered do not match.'});
        break;
    }
  }).on('error', function(e) {
    res.end(500);
  });
}

function signup(req, res) {
  // create the user schema
  var user = {
    name: req.body.username,
    password: req.body.password,
    roles: [],
    type: 'user'
  };
  // create the companion db and add the _security doc to it with said user as the sole member.
  // http://wiki.apache.org/couchdb/Security_Features_Overview
  nano.db.create(user.name, function(err, body) { // mo' callbacks mo' problems
    if (!err) { // if nothing went wrong
      var security = {
        'admins': {
          'names': [],
          'roles': []
        },
        'members': {
          'names': [user.name], // only person with read or write access should be the user we're about to create
          'roles': []
        }
      }
      var settings = {
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
      var userDB = nano.use(user.name); // use the newly created database
      userDB.insert(security, "_security", function(err, body) { // add the '_security' doc to the db
        if (!err) {
          userDB.insert(settings, "settings", function(err, body) {
            // insert user into the _users db
            if (!err) {
              _users.insert(user, 'org.couchdb.user:' + user.name, function(err, body) {
                if (!err) {
                  // success! now login the freshly-minted user.
                  login(req, res);
                } else {
                  console.error(err);
                  res.send(500, err);
                  return;
                }
              }); 
            } else {
              console.error(err);
              res.send(500, err);
              return;
            }
          });
        } else {
          console.error(err);
          res.send(500, err);
          return;
        }
      });
    } else {
      console.error(err);
      res.send(500, err);
      return;
    }
  });
}

var server = app.listen(app.get('port'), function() {
  console.info('Listening on port %d', server.address().port);
});
