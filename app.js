var http = require('http'),
    https = require('https');
var express = require("express"),
    app = express();
var MongoClient = require('mongodb').MongoClient,
    RedisStore = require('connect-redis')(express.session);
var fs = require('fs');

var nodemailer = require('nodemailer');
var routes = require('./routes/index.js');


global.whitelist = require('whitelist').whitelist;
global.db = null;

app.configure("development", function() {
  app.use(express.cookieParser());

  app.use(express.logger({'format': 'dev'}));
  app.use(express.session({
    cookie: {maxAge: 7 * 24 * 60 * 60 * 1000},
    secret: "keyboard cat"
  }));

  app.set('port', process.env.PORT || process.argv[2] || 5000);
});

app.configure("production", function() {
  app.use(express.cookieParser());

  app.use(express.logger({'stream': fs.createWriteStream('log.txt')}));
  app.use(express.session({
    cookie: {maxAge: 7 * 24 * 60 * 60 * 1000},
    secret: "keyboard cat",
    store: new RedisStore({ host: 'localhost', port: 6379})
  }));

  app.set('port', process.env.PORT || 80);
  app.set('sslPort', 443);
  app.use(requireHTTPS); 

});
app.configure(function() {
  app.engine("html", require("ejs").renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  
  app.use(express.bodyParser());
  
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));
});

function requireHTTPS(req, res, next) {
  if (!req.secure) {
      //FYI this should work for local development as well
      return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}


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
app.get('/snake', function(req, res) {
  if (req.session.username) { // if logged in
    res.render('snake.html');
  } else {
    res.redirect('/');
  }
});
app.get('/scoreboard', routes.leaderboard.get);
app.post('/scoreboard', routes.leaderboard.post);


app.get('/login', routes.login.get);
app.post('/login', routes.login.post);
app.get('/logout', function(req, res) { // remove cookie from client, redirect to homepage.
  req.session.username = undefined;
  req.session.fullname = undefined;
  res.redirect('/');
});

app.get('/planner', routes.planner.get);
app.post('/planner', routes.planner.post);

app.get('/settings', routes.settings.get);
app.post('/settings', routes.settings.post);

app.get('/reminders', routes.reminders.get);
app.post('/reminders', routes.reminders.post);

app.get('/feedback', function(req, res) {
  res.send('<center><a href="/">Back to Planner</a><br><iframe style="width:100%; height: 100%;" src="https://docs.google.com/forms/d/15stup9XejMQ0nAFdn-Ucbumv6s6KN92tssBrlAj3A3c/viewform?embedded=true" width="760" height="500" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>');
});
app.get('/friday', function(req, res) {
  res.set('Content-Type', 'text/plain');
  var d = new Date();
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() - 1));
  var f = require('./routes/fridays.js')[d.toISOString().slice(0, 10)];
  res.send(String(f));
});

app.get('/admin', function(req, res) {
  if (req.session.username == 'c17ak' || req.session.username == 'c17dh' || req.session.username == 'c16ac' || req.session.username == 'c17vs')
    res.render('admin.html');
  else
    res.redirect('/');
});
app.get('/about', function(req, res) {
  res.render('about.html');
});

app.get('/analytics', function(req, res) {
  var since = req.param("since");
  var d = new Date();
  if (!since) {
    var d = new Date(1);
  } else {
    d = new Date(new Date().setDate(new Date().getDate()-since));
  }
  db.collection("users").find({lastAccess: {$gte: d}}).toArray(function(err, data1) {
    db.collection("reminders").find({dateWritten: {$gte: d}}).toArray(function(err, data2) {
      res.type('json');
      res.send({activeUsers: data1.length, remindersSet: data2.length, since: d.toISOString()});
    })
  });
});

app.get('/announcements', routes.announcements.get);
app.post('/announcements', routes.announcements.post);

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'daltonplanbook@gmail.com',
        pass: 'theimpregnablecindylou'
    }
});

MongoClient.connect('mongodb://localhost/planner', function(err, dbase) {
  if (!err) {
    db = dbase;

    var insecure = http.createServer(app)

    insecure.listen(app.get('port'), function() {
      console.info('Listening on port %d', app.get('port'));
    });
    if (app.get('sslPort')) {
      var secure = https.createServer({
        cert: fs.readFileSync('/home/ubuntu/sslcert/server.crt', 'utf8'), 
        key: fs.readFileSync('/home/ubuntu/sslcert/server.key', 'utf8'),
        ca: [
          fs.readFileSync('/home/ubuntu/sslcert/intermediate.pem', 'utf8'),
          fs.readFileSync('/home/ubuntu/sslcert/root.pem', 'utf8')
        ]
      }, app);
      secure.listen(app.get('sslPort'), function() {
        console.info('HTTPS listening on port %d', app.get('sslPort'));
      });
    }
    /*app.enable('mailCheckable');
    var emailLoop = setInterval(function() {
      var now = new Date();
      if ((now.getHours()-5 == 8) && app.enabled('mailCheckable')) {
        app.disable('mailCheckable');
        console.log("It's time to send out emails.")
        db.collection('reminders').find({query: {
            dueDate: {$gte: new Date()},
            startReminding: {$lte: new Date()}
          }, 
          $orderby: {'name': 1}
        }).toArray(function(err, docs) {
          if (!err) {
            currentUser = docs[0].name;
            currentRems = [];
            docs.push({});
            for (var i in docs) {
              if (currentUser != docs[i].name) { // if we're onto a new user

                db.collection("users").find({'name': currentUser}).toArray(function(err, usr) { // get that user's settings
                  if (usr[0] && usr[0].settings.morningEmails) {
                    var classes = {};
                    for (var a = 0; a < usr[0].settings.rows.length; a++) {
                      classes[usr[0].settings.rows[a][1]] = usr[0].settings.rows[a][0];
                    }
                    console.log(currentUser + "@dalton.org");
                    var messageHTML = "Good Morning "+currentUser+"! <br><br> Looks like you've set " + currentRems.length + " reminders for yourself. Here they are: <br> <ul>";
                    for (var j in currentRems) {
                      if (currentRems[j].box) {
                        messageHTML = messageHTML + "<li>" + currentRems[j].description + "<br>"+"Due: "+ new Date(currentRems[j].dueDate).toLocaleDateString() +"\
                        in: "+(currentRems[j].box ? classes[currentRems[j].box.slice(0,1)] : '[]')+"</li>";
                      }
                    }
                    messageHTML = messageHTML + "</ul><br> Thanks for using the Planbook!";

                    var mailOptions = {
                      from: 'Dalton Planbook <daltonplanbook@gmail.com>', // sender address
                      to: currentUser + "@dalton.org", // list of receivers
                      subject: 'Your Reminders for ' + new Date().toLocaleDateString(), // Subject line
                      text: messageHTML, // plaintext body
                      html: messageHTML // html body
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                      if(error) {
                        console.log(error);
                      } else {
                        console.log('Message sent to '+currentUser+"@dalton.org"+': ' + info.response);
                      }
                    });
                    currentRems = [];
                    currentUser = docs[i].name;
                  }
                });

                
              }


              currentRems.push(docs[i]);
            }
          } else {
            console.log(err);
          }
        });
      } 
      else if ((now.getHours()-5 == 15) && app.enabled('mailCheckable')) {
        app.disable('mailCheckable');
        var m = new Date();
        m = new Date(m.getFullYear(), m.getMonth(), m.getDate() - (m.getDay() - 1));
        db.collection("users").find().toArray(function(err, docs) {
          if (!err) {
            for (var i = 0; i < docs.length; i++) {
              var username = docs[i].name;
              console.log(username);
              var rows = docs[i].settings.rows;
              if (docs[i].settings.afternoonEmails) {
                db.collection("assignments").find({name: username, monday: m.toISOString().slice(0, 10)}).toArray(function(err, asst) {
                  if (!err) {
                    if (asst[0]) {
                      var assignment = JSON.parse(asst[0].data);
                      // now, get the assignments for that day from all the classes, and put it into an email.
                      // use the settings object for the user to get the different class names.
                      
                      var messageHTML = "Good Afternoon! <br><br>Here is the homework that you have due tomorrow:<br> <ul>";
                      var numOfWrites = 0;
                      for (var j = 0; j < rows.length; j++) {
                          var indx = now.getDay()+rows[j][1];
                          var d = assignment[indx];
                          if (d && d[0]) {
                            messageHTML = messageHTML + '<li>'+ rows[j][0] + ': ';
                            messageHTML = messageHTML + d[0] + '</li>';
                            numOfWrites++;
                          }
                      }
                      messageHTML = messageHTML + '</ul><br> Thanks for using the Planbook!'
                      if (numOfWrites > 0) {
                        var mailOptions = {
                          from: 'Dalton Planbook <daltonplanbook@gmail.com>', // sender address
                          to: username + "@dalton.org", // list of receivers
                          subject: 'Your Homework for tonight, ' + new Date().toLocaleDateString(), // Subject line
                          text: messageHTML, // plaintext body
                          html: messageHTML // html body
                        }; 
                        transporter.sendMail(mailOptions, function(error, info){
                          if(error) {
                            console.log(error);
                          } else {
                            console.log('Message sent to '+username+"@dalton.org"+': ' + info.response);
                          }
                        });
                      }
                    }

                  } else {
                    console.log(err);
                  }
                });
              }
            }
            console.log("done with the list");
          } else {
            console.log(err);
          }
        })
      }
      else if(now.getHours() - 5 != 8 && now.getHours()-5 == 15) {
        console.log("Not 7AM or 3PM. Won't send an email.")
        app.enable("mailCheckable");
      }
     }, 1000*60*60); // check once per hour*/

  } else {
    console.error(err);
  }
});