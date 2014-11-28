/* 
  Event Handlers
*/
$('document').ready(function() {
  /* 
    Navigation Buttons
  */
  $('#save').click(function() {
    saveWeek(getAssignmentValues());
  });
  $('#back').click(function() {

    if (!ref.turnInProgress) {
      ref.turnInProgress = true;
      // animation
      saveWeek(getAssignmentValues()); // save the current state
      ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() - 7); // decrement by 1 week
      getWeek(function(o) {
        $('#sidebar').slide($(window).width(), 200);
        $("#planner").slide($(window).width(), 200, function() {
          setAssignmentValues(o);
          ref.turnInProgress = false;
        });
      });
    }
  });
  $('#next').click(function() {
    if (!ref.turnInProgress) {
      ref.turnInProgress = true;
      saveWeek(getAssignmentValues());
      ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + 7);

      getWeek(function(o) {
        $('#sidebar').slide(-$(window).width(), 200);
        $("#planner").slide(-$(window).width(), 200, function() {
          setAssignmentValues(o);
          ref.turnInProgress = false;
        });
      });
    }
  });

  $(document).bind('keydown', 'meta+s', function(e) {
    e.preventDefault();
    saveWeek(getAssignmentValues());
  });

  $(document).bind('keydown', 'meta+right', function(e) {
    e.preventDefault();
    $('#next').click();
  });
  $(document).bind('keydown', 'meta+left', function(e) {
    e.preventDefault();
    $('#back').click();
  });

  // Mobile navigation buttons
  $('#msave').click(function() {
    saveWeek(getAssignmentValues());
  });
  $('#mback').click(function() {
    // animation
    saveWeek(getAssignmentValues()); // save the current state
    ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() - 7); // decrement by 1 week
    getWeek(setAssignmentValues);
    drawDates()  
  });
  $('#mnext').click(function() {
    saveWeek(getAssignmentValues());
    ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + 7);
    getWeek(setAssignmentValues);
    drawDates();
  });

  // add subject
  $('button#add').click(function() {
    // save
    var id = 0;
    for (var i = 0; i < ref.settings.rows.length; i++) {
      if (ref.settings.rows[i][1] >= id) {
        id = parseInt(ref.settings.rows[i][1])+1
      }
    }
    ref.settings.rows.push(["Class", id]);
    console.log(id);
    setSettings(ref.settings, function(data) {
      renderRows(ref.settings.rows);
      $('.subj#'+id).children('.subjectspan').trigger('dblclick');
    });
  });
  taListen();
  subjectListen();
});

function taListen() {
  $("textarea").unbind();
  $("textarea").bind('keydown', 'meta+s', function(e) {
    e.preventDefault();
    saveWeek(getAssignmentValues());
  });
  /*
    Keypress listener, for parsing and using inputs to different textareas.
    Will get quite large as features such as lab requests are added.
  */
  $("textarea").blur(function() {
    saveWeek(getAssignmentValues());
  });
  $("textarea").keydown(function(e) {
    // If it's been more than 30 seconds since you've updated from this device
    var taID = this.id;
    if (new Date().getTime() - ref.lastUpdate.getTime() > 30000) {
      getWeek(function(assignments) {
        // replace the server's version of what you're working on with your version
        var newVersion = getAssignmentValues()[taID]
        assignments[taID] = newVersion;
        setAssignmentValues(assignments); // update the planner with the server's version of events.
        saveWeek(getAssignmentValues());
      });
    }
    if ($('#saveIndicator').children('span')[0].classList[1] == "glyphicon-ok-circle")
      $('#saveIndicator').children('span').attr("class", "glyphicon glyphicon-ban-circle").parent().attr("data-original-title", "Click to save data.");
    if (e.which == 13) {
      saveWeek(getAssignmentValues());
    } else if (e.which == 8) {
      if ($(this).text() == '') {
        $.ajax({
          method: 'POST',
          url: '/reminders',
          data: {
            box: taID,
            monday: ref.monday.toISOString().slice(0, 10)
          },
          statusCode: {
            200: function() {
              getReminders();
            }
          }
        });
      }
    }
  });

  /*
  Setting assignment as done
  */
  $('textarea').parent().mouseenter(function() {
    $(this).children(".tabuttons").show();
  });
  $('textarea').parent().mouseleave(function() {
     $(this).children(".tabuttons").hide();
  });
  $('button.done').unbind();
  $('button.done').click(function() {
    var t = $(this).parent().parent().children("textarea");
    console.log();
    if ($(t).css("text-decoration") == "none") {
      $(t).css("text-decoration", "line-through");
      $(t).parent().children(".tabuttons").children('.done').html('<span class="glyphicon glyphicon-check"></span>');
      $.ajax({
        method: 'POST',
        url: '/reminders',
        data: {
          box: t[0].id,
          monday: ref.monday.toISOString().slice(0, 10)
        },
        statusCode: {
          200: function() {
            getReminders();
          }
        }
      });
    }
    else {
      $(t).css("text-decoration", "none");
      $(t).parent().children(".tabuttons").children('.done').html('<span class="glyphicon glyphicon-unchecked"></span>');
    }
    saveWeek(getAssignmentValues());

  });

  $('.cc').unbind();
  $('.cc').click(function() { // if they click on teh color code
    var code = this.classList[0];
    var ta = $(this).parent().parent().parent().parent().children('textarea');
    ta.css("background-color", ref.settings.colorCode[code]); // set the background

    saveWeek(getAssignmentValues());
  });

  $('.reminderSet').unbind();
  $('.reminderSet').click(function() {
    var box = $(this).parent().parent().children('textarea');
    var daysBefore = '1';
    var prev = false;
    // search for reminder in array
    for (var i = 0; i < ref.reminders.length; i++) {
      if (ref.reminders[i].monday == ref.monday.toISOString().slice(0, 10) && ref.reminders[i].box == box[0].id) {
        daysBefore = ref.reminders[i].startRemindingNum || '1';
        prev = true;
      }
    }

    var max = 14;
    var html = '<span class="reminderCancel">x</span>\
                Start reminding me\
                <input type="number" class="r" name="amountInput" value="'+daysBefore+'" style="width:35px;" disabled/>\
                days before.\
                <input type="range" name="amountRange" min="1" max="'+max+'" value="'+daysBefore+'" oninput="$(this).parent().children(\'input.r\').val(this.value)" />\
                <button class="btn btn-primary btn-xs reminderSubmit">'+(prev ? 'Update' : 'Submit')+'</button>\
                <button class="btn btn-danger  btn-xs reminderRemove">Remove</button>'


    $(box).popover({content: html, html: 'true', placement: 'top'}).popover('show');
    
    $('.reminderSubmit').unbind();
    $('.reminderSubmit').click(function() {
      var b = $(this).parent().parent().parent().children();
      $('.reminderSubmit').unbind();
      b.popover('destroy');
      $.ajax({
        type: 'POST',
        url: '/reminders',
        data: {
          box: box.attr('id'),
          colorCode: box.css('background-color'),
          monday: ref.monday.toISOString().slice(0, 10),
          description: b.val(),
          options: {
            startReminding: parseInt($(this).parent().children('.r').val()),
            interval: 1
          }
        },
        statusCode: {
          200: function() {
            getReminders();
          }
        }
      });
    });
    $('.reminderCancel').unbind();
    $('.reminderCancel').click(function() {
      $('.reminderCancel').unbind();
      var b = $(this).parent().parent().parent().children();
      b.popover('destroy');
    });

    $('.reminderRemove').unbind();
    $('.reminderRemove').click(function() {
      var b = $(this).parent().parent().parent().children();
      b.popover('destroy');
      $.ajax({
        method: 'POST',
        url: '/reminders',
        data: {
          box: box[0].id,
          monday: ref.monday.toISOString().slice(0, 10)
        },
        statusCode: {
          200: function() {
            getReminders();
          }
        }
      });
    });
  });



  /*
    Double tap/Double click for setting assignments as completed.
  */
  var isiOS = false;
  var agent = navigator.userAgent.toLowerCase();
  if(agent.indexOf('iphone') >= 0 || agent.indexOf('ipad') >= 0 || agent.indexOf('android') >= 0) {
    isiOS = true;
  }

  if (isiOS) {
    var action;
    $('textarea').bind('touchend', function(event){
      var now = new Date().getTime();
      var lastTouch = $(this).data('lastTouch') || now + 1 /** the first time this will make delta a negative number */;
      var delta = now - lastTouch;
      clearTimeout(action);
      if (delta<500 && delta>0){
        if ($(this).css("text-decoration") == "none") {
          $(this).css("text-decoration", "line-through");
        }
        else {
          $(this).css("text-decoration", "none");     
        }
      } else {
        $(this).data('lastTouch', now);
        action = setTimeout(function(e){
         // If this runs you can invoke your 'click/touchend' code
         clearTimeout(action);   // clear the timeout
        }, 500, [event]);
      }
      $(this).data('lastTouch', now);
    });
  }
}

function subjectListen() {
  $('.subj').unbind(); // When you add a subject, need to re-add all the listeners

  $('.subj').on('dblclick', '.subjectspan', function () {
    var input = $('<input />', {
      'type': 'text',
      'name': 'unique',
      'value': $(this).html()
    });
    $(this).parent().prepend(input);
    $(this).remove();
    input.focus();
    input.select();

    input.keydown(function(e) {
      if (e.keyCode == 13) {
        e.preventDefault();
        this.blur();
      }
    });
  });

 $('.subj').on('blur', 'input', function () {
    $(this).parent().prepend($('<span />', {'class':'subjectspan'}).html($(this).val()));
    var id = $(this).parent().get(0).id;
    var subj = $(this).val();
    $(this).unbind();  
    $(this).remove();
    if (id != 0) {
      $(this).prop('contenteditable', false); // make it not editable
      for (var i = 0; i < ref.settings.rows.length; i++) {
        if (ref.settings.rows[i][1] == id) {
          ref.settings.rows[i][0] = subj; // actually change the name
          break;
        }
      }
      // Save the new settings
      setSettings(ref.settings, function(data) {
        renderRows(ref.settings.rows);
      });
    }
  });

  $('input').keydown(function(e) {
  if (e.keycode == 13) {
    e.preventDefault();
    this.blur();
  }
  });

  // mouseover logic
  $('.subj').mouseenter(function() {
    $(this).children(".subjbtns").show();
  });
  $('.subj').mouseleave(function() {
     $(this).children(".subjbtns").hide();
  });

  $('button.delete').unbind();
  // delete subject
  $('button.delete').click(function() {
    var id = $(this).parent().parent()[0].id;
    if (confirm("Are you sure you want to delete " + ref.settings.rows[id-1] + "?")){
      for (var i = 0; i < ref.settings.rows.length; i++) {
        if (ref.settings.rows[i][1] == id) {
          ref.settings.rows.splice(i, 1); // splice out the row from settings
          break;
        }
      }
      // save
      setSettings(ref.settings, function(data) {
        renderRows(ref.settings.rows);
      });
    }
  });
  $('button.edit').unbind();
  $('button.edit').click(function() {
      $(this).parent().parent().children('.subjectspan').trigger('dblclick');
  });
}