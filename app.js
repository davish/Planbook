var express = require("express"),
    app = express(),
    MongoClient = require('mongodb').MongoClient;
var http = require('http'),
    fs = require('fs');
var whitelist = require('whitelist').whitelist;
var db = null;

var settingsDefaults = {
                      'reminders': 
                        {
                          'codeRed':    {frequency: '7', interval: '1'},
                          'codeYellow': {frequency: '4', interval: '2'},
                          'codeGreen':  {frequency: '0', interval: '0'}
                        }
                      }

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

// render login page.
app.get('/login', function(req, res) {
  if (req.session.username)
    res.redirect('/');
  else {
    if (req.param('why') == 'incorrect')
      res.render('signin.html', {error: 'The username and password entered is incorrect.'});
    else if (req.param('why') == 'whitelist')
      res.render('signin.html', {error: 'You do not have permission to use the planbook. If this is a mistake, contact Andrew Milich or Davis Haupt.'});
    else
      res.render('signin.html', {error: ''});
  }
});
// login with req.body.username and req.body.password
app.post('/login', login);

// remove cookie from client, redirect to homepage.
app.get('/logout', function(req, res) {
  req.session.username = undefined;
  res.redirect('/');
});

// get this week's assignments, with req.session.username, req.body.monday.
app.get('/planner', function(req, res) {
  res.type('text/json');
  db.collection("assignments").find({$and: [{'name': req.session.username}, {'monday': req.param('monday')}]}).toArray(function(err, docs) {
    if (docs[0])
      res.send({'assignments': docs[0].data});
    else
      res.send(404); // client deals with the 404.
  });
});
// update this week's assignments, with req.session.username, req.body.monday and req.body.data
app.post('/planner', function(req, res) {
  res.type('text/json');
  var assignments = db.collection("assignments").find(
  {
    $and: 
    [
      {'name': req.session.username},
      {'monday': req.body.monday}
    ]
  }).toArray(function(err, docs) {
    if (!err) {
      if (docs[0]) { // doc exists
        db.collection("assignments").findOneAndUpdate({_id: docs[0]._id}, {
          $set: {'data': req.body.data}
        }, function (err, result) {
          if (!err)
            res.send(200);
          else
            res.send(500, err);
        });
      } else {
        db.collection("assignments").insert({
          'name': req.session.username, 'monday': req.body.monday, 'data': req.body.data}, 
        function(err, result) {
          if (!err)
            res.send(200);
          else
            res.send(500, err);
        });
      }
    } else {
      res.send(500, err);
    }
  });
});

// get req.session.username's settings and return it in JSON.
app.get('/settings', function(req, res) {
  res.type('text/json');
  db.collection("users").find({'name': req.session.username}).toArray(function (err, docs) {
    if (!err) {
      if (docs[0]) {
        s = docs[0].settings;
        var toAdd = 0;
        for (var key in settingsDefaults) {
          if (!s[key]) { // if the default isn't in there
            toAdd++;
            s[key] = settingsDefaults[key]; // add it to settings
          }
        }
        if (toAdd) { // if anything has been added
          db.collection("users").findOneAndUpdate(
            {'name': req.session.username},
            {$set: {settings: s}},
            function(err, result) {
              if (!err)
                res.send({'settings': s, 'name': req.session.username})
              else
                res.send(500, err);
            });
        } else { // if no defaults need to be added
          res.send({'settings': docs[0].settings, 'name': req.session.username});
        }
      }
      else {
        res.send(403) // user doesn't exist; forbidden
      }
    } else {
      res.send(500, err); // err
    }
  });
});
// update req.session.username's settings with req.body.settings.
app.post('/settings', function(req, res) {
  res.type('text/json');
  db.collection("users").findOneAndUpdate(
    {'name': req.session.username}, 
    {$set: {'settings': req.body.settings}}, 
    function(err, result) {
      if (!err) {
        res.send({'settings': result.value.settings});
      } else {
        res.send(500);
      }
    }
  );
});

// get the reminders due today with req.session.username and 'new Date().toISOString().slice(0,10)' and return it in JSON.
app.get('/reminders', function(req, res) {

});
// add 1 or a batch or reminders in the valid JSON format to the db with req.session.username and req.body.reminders.
// if action=add, then add them. if action=remove, then remove them.
app.post('/reminders', function(req, res) {

});

// validate user with req.body.username and req.body.password.
function login(req, res) {
  res.type('text/json');
  if (whitelist.join(' ').indexOf(req.body.username) <= -1) { // if they're not on the whitelist
    res.redirect('/login?why=whitelist');
    return; // stop here.
  }
  var options = {host: 'compsci.dalton.org',port: 8080, path: '/zbuttenwieser/validation/index.jsp?username='+req.body.username+'&password='+req.body.password};
  http.get(options, function(r) {
    switch (r.statusCode) {
      case 200: // user exists in Dalton db
        // check if they exist in our db:
        db.collection("users").find({'name': req.body.username}).toArray(function(err, docs) {
          if (!err) {
            if (docs[0]) {
              // update the lastLogin field, which is used for analytics
              db.collection("users").findOneAndUpdate({'name': req.body.username}, {$set: {'lastLogin': new Date()}}, 
                function(err, result) {
                  req.session.username = req.body.username;
                  // res.send({'settings': docs[0].settings, 'user': req.body.username}); // send back that login went swimmingly
                  res.redirect('/'); // redirect back to the homepage, which is now the Planner.
                }
              );
            } else {
              signup(req, res);
            }
          } else {
            res.send(500, err);
          }
        });
        break;
      case 404: // not found in Dalton
        // res.send(404, {'message': 'The username and password entered do not match.'});
        res.redirect('/login?why=incorrect')
        break;
    }
  }).on('error', function(e) {
    res.end(500);
  });
}
// add user to db
function signup(req, res) {
  res.type('text/json');
  db.collection("users").find({'name': req.body.username}).toArray(function(err, docs) {
    if (!err) {
      if (docs[0] == undefined) {
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
                      'theme': "default",
                      'colorCode': {
                                    codeRed: 'rgb(217, 115, 98)',
                                    codeYellow: 'rgb(240, 214, 128)',
                                    codeGreen: 'rgb(165, 230, 159)',
                                    codeWhite: ''
                                  },
                      'reminders': {
                        'codeRed':    {frequency: '7', interval: '1'},
                        'codeYellow': {frequency: '4', interval: '2'},
                        'codeGreen':  {frequency: '0', interval: '0'}
                      }
                      }
        };
        
        db.collection("users").insert(user, function(err, result) {
          if (!err) {
            login(req, res);
          }
          else
            res.send(500, err);
        });
      } else {
        // res.send(403, {'message': 'The username and password already exist.'});
        res.redirect('/login?why=incorrect')
      }
    } else {
      res.send(500, err);
    }
  });
}

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