module.exports = {
  /* get the reminders due today with req.session.username and 
  'new Date().toISOString().slice(0,10)' and return it in JSON.*/
  get: function(req, res) {
    res.type('text/json');
    db.collection("reminders").find({
      'name': req.session.username, 
      'reminderDate': new Date(req.param('today')).toISOString().slice(0,10)
    }).toArray(function(err, reminders) {
      if (!err) // gotta get the contents of the reminders, since they're not static.
        res.send(reminders);
      else
        res.send(500, err);
    });
  },
  /* add 1 or a batch or reminders in the valid JSON format to the db with req.session.username and req.body.reminders.
     if action=add, then add them. if action=remove, then remove them.*/
  post: function(req, res) {
    res.type('text/json');
    
    // calculate day to start reminding you
    

    // remove existing reminders for this box so that there's no dublicates.
    db.collection("reminders").removeMany({
      $and: [{name: req.session.username}, {box: req.body.box}, {monday: req.body.monday}]
    }, function(err, result) {
      if (!err) {
        if (req.body.options) { // if there aren't options the client just wants to delete reminders
          var m = new Date(req.body.monday);
          var startReminders = new Date(m.getFullYear(), 
            m.getMonth(), 
            m.getDate() + ((req.body.box.split('').reverse()[0]-1) - req.body.options.startReminding));

          var dueDate = new Date(m.getFullYear(), 
            m.getMonth(), 
            m.getDate() + parseInt(req.body.box.split('').reverse()[0]));
          var dd = dueDate.toISOString().slice(0,10);
          
          var reminders = [];
          for (var d = dueDate; d.getTime() > startReminders.getTime(); d.setDate(d.getDate() - req.body.options.interval)) {
            reminders.push({
              name: req.session.username, 
              box: req.body.box, 
              monday: req.body.monday,
              dueDate: dd,
              reminderDate: d.toISOString().slice(0,10),
              description: req.body.description
            });
          }
          db.collection("reminders").insert(reminders, function(err, result) {
            if (!err)
              res.send(200);
            else
              res.send(500, err);
          });
        } else {
          res.send(200);
        }
      } else {
        res.end(500, err);
      }
    });
  }
};