/* 
  Event Handlers
*/
$('document').ready(function() {

  /*
    Window Close Confirmation
  */
  

  /* 
    Navigation Buttons
  */
  $('a#save').click(function() {
    saveWeek(getAssignmentValues());
  });
  $('a#back').click(function() {
    // animation
    saveWeek(getAssignmentValues()); // save the current state
    ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() - 7); // decrement by 1 week
    $('#sidebar').slide($(window).width(), 200);
    $("#planner").slide($(window).width(), 200, function() {
      getWeek(setAssignmentValues);
      drawDates();
    });
    
    if (ref.monday.toISOString().slice(0, 10) == getMonday(new Date()).toISOString().slice(0, 10))
      $('#sidebar').css("padding-top", "1px");
    else
      $('#sidebar').css("padding-top", "0px");
    
  });
  $('a#next').click(function() {
    saveWeek(getAssignmentValues());
    ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + 7);

    $('#sidebar').slide(-$(window).width(), 200);
    $("#planner").slide(-$(window).width(), 200, function() {
      getWeek(setAssignmentValues);
      drawDates();
    });
    
    if (ref.monday.toISOString().slice(0, 10) == getMonday(new Date()).toISOString().slice(0, 10))
      $('#sidebar').css("padding-top", "1px");
    else
      $('#sidebar').css("padding-top", "0px");
    
  });

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
    ref.settings.rows.push("Class");
    // save
    setSettings(ref.settings, function(data) {
      renderRows(ref.settings.rows);
      $('.subj#'+String(ref.settings.rows.length)).children('.subjectspan').trigger('dblclick');
    });
  });

  /*
    Form buttons for AJAX
  */
  $("form#login").submit(function(e) {
    e.preventDefault();
    login($('#loginUsername').val().toLowerCase(), $('#loginPassword').val(), function(data) {
      $('.stuff').show();
      $('.navbar').show();
      $('.mAll').show();

      $('.loginModal').modal('hide');
      $('li#username').children('a').text(data.user);
      $('.loggedIn').show();
      $('.loggedOut').hide();
      $('#403').hide();
      $('textarea').each(function(index, element) {
        element.removeAttribute('disabled');
      });
    }, function(data) {
      $('li#username').children('a').text('');
      $('#403').text('The username and password entered does not match.');
      $('#403').show();
    });
  });

  $("form#signup").submit(function(e) {
    e.preventDefault();
    if ($('#signupPasswordVerify').val() == $('#signupPassword').val()) {    
      signup($('#signupUsername').val().toLowerCase(), $('#signupPassword').val(), function(data) {
        $('.stuff').show();
        $('.navbar').show();
        $('.mAll').show();

        $('.signupModal').modal('hide');
        $('li#username').children('a').text(data.user);
        $('.loggedIn').show();
        $('.loggedOut').hide();
        $('#403').hide();
        $('textarea').each(function(index, element) {
          element.removeAttribute('disabled');
        });
      }, function(data) {
        $('li#username').children('a').text('');
        $('#403-1').text('This user already exists');
        $('#403-1').show();
      });
    } else {
      $('#403-1').text('The password you entered must match.');
      $('#403-1').show();
    }
  });

  $('#goToLogin').click(function() {
    $('.choiceModal').modal('hide');
    $('.loginModal').modal('show');
  });

  $('#goToSignup').click(function() {
    $('.choiceModal').modal('hide');
    $('.signupModal').modal('show');
  });

  $('.signupModal').on('hidden.bs.modal', function() {
    if ($('li#username').children('a').text() == "")
      $('.choiceModal').modal('show');
  });

  $('.loginModal').on('hidden.bs.modal', function() {
    if ($('li#username').children('a').text() == "")
      $('.choiceModal').modal('show');
  });
  taListen();
  subjectListen();
});

function taListen() {
  $("textarea").unbind();
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
    if (e.which == 13) {
      saveWeek(getAssignmentValues());
    }
  });

  /*
  Setting assignment as done
  */
  $('textarea').parent().mouseenter(function() {
    $(this).children("span.tabuttons").show();
  });
  $('textarea').parent().mouseleave(function() {
     $(this).children("span.tabuttons").hide();
  });
  $('button.done').unbind();
  $('button.done').click(function() {
    var t = $(this).parent().parent().children("textarea");
    if ($(t).css("text-decoration") == "none")
        $(t).css("text-decoration", "line-through");
    else 
      $(t).css("text-decoration", "none");

  });

  $('.cc').unbind();
  $('.cc').click(function() {
    var code = this.classList[0];
    var ta = $(this).parent().parent().parent().parent().parent().children('textarea')
    ta.css("background-color", ref.settings.colorCode[code]);
  });

  /*
    Double tap/Double click for setting assignments as completed.
  */
  var isiOS = false;
  var agent = navigator.userAgent.toLowerCase();
  if(agent.indexOf('iphone') >= 0 || agent.indexOf('ipad') >= 0 || agent.indexOf('android') >= 0) {
    isiOS = true;
  }

  if (!isiOS){/*
    $('textarea').dblclick(function() { // toggle between strikethrough and no styling on textareas
      if ($(this).css("text-decoration") == "none")
        $(this).css("text-decoration", "line-through");
      else {
        $(this).css("text-decoration", "none");
      }
    });*/
  } else {
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
      ref.settings.rows[id-1] = subj; // actually change the name
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
      ref.settings.rows.splice(id-1, 1); // splice out the row from settings
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