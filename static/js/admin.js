var ref = {
  'monday': getMonday(new Date()),
  'lastUpdate': new Date()
};

/* 
  Event Handlers
*/
$('document').ready(function() {
  /* 
    Navigation Buttons
  */
  $('#save').click(function() {
    console.log("save!");
    // saveWeek(getAssignmentValues());
  });
  $('#back').click(function() {
    console.log("back!");
    // if (!ref.turnInProgress) {
    //   ref.turnInProgress = true;
    //   // animation
    //   saveWeek(getAssignmentValues()); // save the current state
    //   ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() - 7); // decrement by 1 week
    //   getWeek(function(o) {
    //     $('#sidebar').slide($(window).width(), 200);
    //     $("#planner").slide($(window).width(), 200, function() {
    //       setAssignmentValues(o);
    //       ref.turnInProgress = false;
    //     });
    //   });
    // }
  });
  $('#next').click(function() {
    console.log("next!");
  //   if (!ref.turnInProgress) {
  //     ref.turnInProgress = true;
  //     saveWeek(getAssignmentValues());
  //     ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + 7);

  //     getWeek(function(o) {
  //       $('#sidebar').slide(-$(window).width(), 200);
  //       $("#planner").slide(-$(window).width(), 200, function() {
  //         setAssignmentValues(o);
  //         ref.turnInProgress = false;
  //       });
  //     });
  //   }
  // });
}