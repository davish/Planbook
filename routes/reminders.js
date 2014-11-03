module.exports = {
  /* get the reminders due today with req.session.username and 
  'new Date().toISOString().slice(0,10)' and return it in JSON.*/
  get: function(req, res) {
    res.type('text/json');
    db.collection("reminders").find({
      'name': req.session.username, 
      'reminderDate': new Date(req.param('today')).toISOString().slice(0,10)
    }).toArray(function(err, reminders) {
      if (!err) { // gotta get the contents of the reminders, since they're not static.
        var weeks = {}; // construct object with the weeks as the key and the reminders in an array as the value
        for (var i = 0; i < reminders.length; i++) {
          // dont' need these two fields
          delete reminders[i]._id;
          delete reminders[i].name;
          // add it to the object
          if (weeks[reminders[i].monday])
            weeks[reminders[i].monday].push(reminders[i]);
          else
            weeks[reminders[i].monday] = [reminders[i]];
        }
        for (var key in weeks) { // loop through, add the contents to the reminder objects.
          if (weeks.hasOwnProperty(key)) {
            db.collection("assignments").find({
              name: req.session.username, monday: key
            }).toArray(function(err, docs) {
              if (docs) { // if the week exists
                var data = JSON.parse(docs[0].data);
                for (var i = 0; i < weeks[key].length; i++)
                  weeks[key][i]['description'] = data[weeks[key][i].box][0];
                res.send(reminders); // taking advantage of the mutability of objects in JS
              }
            });
          }
        }
      }
      else
        res.send(500, err);
    });
  },
  /* add 1 or a batch or reminders in the valid JSON format to the db with req.session.username and req.body.reminders.
     if action=add, then add them. if action=remove, then remove them.*/
  post: function(req, res) {
    res.type('text/json');
    
    // calculate day to start reminding you
    var m = new Date(req.body.monday);
    var startReminders = new Date(m.getFullYear(), 
      m.getMonth(), 
      m.getDate() + ((req.body.box.split('').reverse()[0]-1) - req.body.options.startReminding));

    // remove existing reminders for this box so that there's no dublicates.
    db.collection("reminders").removeMany({
      $and: [{name: req.session.username}, {box: req.body.box}, {monday: req.body.monday}]
    }, function(err, result) {
      if (!err) {
        var reminders = [];

        var dueDate = new Date(m.getFullYear(), 
          m.getMonth(), 
          m.getDate() + parseInt(req.body.box.split('').reverse()[0])-1);


        for (var d = dueDate; d.getTime() > startReminders.getTime(); d.setDate(d.getDate() - req.body.options.interval)) {
          reminders.push({
            name: req.session.username, 
            box: req.body.box, 
            monday: req.body.monday,
            reminderDate: d.toISOString().slice(0,10)
          });
        }
        var r = db.collection("reminders")
        r.insert(reminders, function(err, result) {
          if (!err)
            res.send(200);
          else
            res.send(500, err);
        });
      } else {
        res.end(500, err);
      }
    });
  }
};