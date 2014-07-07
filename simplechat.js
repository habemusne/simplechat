//// TO CHANGE IN METEOR FRAMEWORK 
var MeteorUser = function () {
  var userId = Meteor.userId();
  if (!userId) {
    return null;
  }
  var user = Meteor.users.findOne(userId);
  /* if (user !== undefined &&
      user.profile !== undefined &&
      user.profile.guest) {
    return null;
  } */
  return user;  
};



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
  // Subscribe
  Meteor.subscribe("chatroom");

  // Create collection on client
  Messages = new Meteor.Collection('messages');

  Meteor.startup(function() {
      Meteor.loginVisitor(); // Guest Account
      //Meteor.insecureUserLogin('Anonymous'); // Test Account
      // We take car of the name
      Session.setDefault('name', 'Guest');
  });

 
  //////////// Chat ///////////////
  Template.chat.messages = function () {
    return Messages.find({}, {sort:{timestamp:-1}, limit:42}).fetch().reverse();
  };

  Template.chat.authorname = function(opts) {/*
    var user =  Meteor.users.findOne(opts.author);
    if (user) {
      return Meteor.users.findOne(opts.author).profile.name;
    }
    else {
      return opts.author;
    }*/
    return opts.data; // TODO need to fix that
  }

  Template.chat.events(okCancelEvents(
      '#messageInput',
      {
        ok: function (value, evt) {
          Messages.insert({
            author: Meteor.userId(),
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
     //Meteor.users.findOne(userId)
    var user = Meteor.users.findOne(Meteor.userId());
    if (user){
      Session.set('name', user.profile.name);
    }
    return Session.get('name');
  };

  Template.participants.participants = function() {
    return Meteor.users.find({}).fetch(); // For now, we want _every_ users
  }

  Template.participants.events(okCancelEvents(
    '#nameInput',
    {
      ok: function (value, evt) {
        if (value) {
          var user = Meteor.users.findOne(Meteor.userId());
          if (user){
            Meteor.users.update({_id:Meteor.userId()}, {$set:{"profile.name": value}})
          }
          Session.set('name', value);
        } 
      }
    }));
    //////////// End Name ///////////////








}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Messages = new Meteor.Collection('messages');
    // code to run on server at startup
  });

  Meteor.publish("chatroom", function () {
    return [
      Messages.find({}),
      Meteor.users.find({})
    ]
  });

}
