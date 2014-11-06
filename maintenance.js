var express = require("express"),
  app = express();


app.configure(function() {  
  app.set('port', (process.env.PORT || process.argv[2] || 5000));
});

app.get('/', function(req, res) {
  res.send("<h1>Dalton.org's infrastructure is undergoing maintenance.</h1><h3>We thank you for your patience and hope to resume service shortly.</h3>");
});

var server = app.listen(app.get('port'), function() {
  console.info('Listening on port %d', server.address().port);
});