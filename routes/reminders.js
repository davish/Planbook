module.exports = {
  /* get the reminders due today with req.session.username and 
  'new Date().toISOString().slice(0,10)' and return it in JSON.*/
  get: function(req, res) {
    res.type('text/json');
    /*db.collection("reminders").find({
      'name': req.session.username, 
      'reminderDate': new Date(req.param('today')).toISOString().slice(0,10)
    }).toArray(function(err, docs) {
      if (!err)
        res.send(docs);
      else
        res.send(500, err);
    });*/
    res.send(404, {'message': 'Coming Soon'});
  },
  /* add 1 or a batch or reminders in the valid JSON format to the db with req.session.username and req.body.reminders.
     if action=add, then add them. if action=remove, then remove them.*/
  post: function(req, res) {
    res.type('text/json');
    /*// Count backwards from the duedate, subtracting the number of days in the interval, so you get a date 
    var dueDate = req.body.dueDate;
    var startReminders = new Date(req.body.dueDate);
    startReminders.setDate(startReminders.getDate()-req.body.options.startReminding);


    var reminders = [];

    for (var d = new Date(dueDate); d.getTime() > startReminders.getTime(); d.setDate(d.getDate() - req.body.options.interval)) {
      reminders.push({name: req.session.username, 
        subject: req.body.subject, 
        dueDate: dueDate, 
        details: req.body.details, 
        reminderDate: d.toISOString().slice(0,10)
      });
    }

    db.collection("reminders").insert(reminders, function(err, result) {
      if (!err)
        res.end(200);
      else
        res.end(500, err);
    });*/
    res.send(404, {'message': 'Coming Soon'});
  }
};