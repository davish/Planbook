module.exports = {
  /* get the reminders due today with req.session.username and 
  'new Date().toISOString().slice(0,10)' and return it in JSON.*/
  get: function(req, res) {
    res.type('text/json');
    db.collection("reminders").find({
      name: req.session.username,
      dueDate: {$gte: new Date(req.param('today'))},
      startReminding: {$lt: new Date(req.param('today'))}
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
    // remove existing reminders for this box so that there's no dublicates.
    db.collection("reminders").removeMany({
      $and: [{name: req.session.username}, {box: req.body.box}, {monday: req.body.monday}]
    }, function(err, result) {
      if (!err) {
        if (req.body.options) { // if there aren't options the client just wants to delete reminders
          var m = new Date(req.body.monday);

          var dueDate = new Date(m.getFullYear(), 
            m.getMonth(), 
            m.getDate() + parseInt(req.body.box.split('').reverse()[0]));

          var startReminders = new Date(dueDate.getFullYear(), 
            dueDate.getMonth(), 
            dueDate.getDate() - (parseInt(req.body.options.startReminding)+1));

          var reminders = {
            startRemindingNum: req.body.options.startReminding,
            startReminding: startReminders,
            dueDate: dueDate,

            monday: req.body.monday,
            box: req.body.box,
            description: req.body.description,
            colorCode: req.body.colorCode,

            name: req.session.username
          };
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