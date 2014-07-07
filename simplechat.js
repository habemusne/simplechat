////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};
/////////// End Helper ///////

if (Meteor.isClient) {
  // Create collection on client
  Messages = new Meteor.Collection('messages');
  Names = new Meteor.Collection('names');

  // We take car of the name
  Session.setDefault('name', "Anonymous");



  //////////// Chat ///////////////
  Template.chat.messages = function () {
    return Messages.find({}, {sort:{timestamp:-1}, limit:42}).fetch();
  };

  Template.chat.events(okCancelEvents(
      '#messageInput',
      {
        ok: function (value, evt) {
          Messages.insert({
            author: Session.get('name'),
            message: value,
            timestamp: (new Date()).getTime()
          });
          evt.target.value = "";
        }
      }
  ));
  //////////// End Chat ///////////////


  //////////// Name ///////////////
  Template.participants.name = function () {
    return Session.get('name');
  };

  Template.participants.events(okCancelEvents(
    '#nameInput',
    {
      ok: function (value, evt) {
        console.log("ok. #nameinput value = " + value);
        if (value) {
          // Names.insert({});
          Session.set('name', value);
        } 
      }
    }));
    //////////// End Name ///////////////








}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Messages = new Meteor.Collection('messages');
    Names = new Meteor.Collection('names');

    // code to run on server at startup
  });
}
