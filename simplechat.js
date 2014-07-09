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

UI.registerHelper('breaklines', function(text){ // Should call a fonction to sanitaze the html...
  var html = "";
  if(text) { 
    html = text.replace(/(\r\n|\n|\r)/gm, '<br>');
  }
  return Spacebars.SafeString(html);
});


// Not the right way to do it ?!!!
UI.registerHelper('authorCss', function(author){
  var cssClass = "bubbledLeft";
  if(author === Meteor.userId()) { 
    cssClass = "bubbledRight";
  }
  return cssClass;
});

/////////// End Helper ///////

if (Meteor.isClient) {
  // Subscribe
  Meteor.subscribe("chatroom");

  // Create collection on client
  Messages = new Meteor.Collection('messages');
  Channels = new Meteor.Collection('channels');

  Meteor.startup(function() {
      Meteor.loginVisitor(); // Guest Account
      //Meteor.insecureUserLogin('Anonymous'); // Test Account
      // We take car of the name
      Session.setDefault('name', 'Guest');
      Session.setDefault('channel', 'agoodname');

  });

 
  //////////// Chat ///////////////
  Template.chat.messages = function () {
    var messages = Messages.find({}, {sort:{timestamp:-1}, limit:42}).fetch().reverse();
    
    for (var i = messages.length - 1; i >= 0; i--) {
      var user =  Meteor.users.findOne(messages[i].author);
      if (user) {
        messages[i].name = user.profile.name;
      }
      else {
        messages[i].name = "Unknown";
      }
    };

    var conversations = [];
    var newConversation = messages[0];
    for (var i = 0; i <= messages.length - 2; i++) {
      var timedelta = messages[i+1].timestamp - messages[i].timestamp; 
      var sameauthor = (messages[i+1].author === messages[i].author);
      if (timedelta <= 30000 && sameauthor) {
        newConversation.message = newConversation.message + " \n" + messages[i+1].message;
      }
      else {
        conversations.push(newConversation);
        newConversation = messages[i+1];
      }
    };
    conversations.push(newConversation);
    return conversations;
  };


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


    //////////// Homepage ///////////////




    //////////// END Homepage ///////////
    Template.homepage.events(okCancelEvents(
      '#channelInput',
      {
        ok: function (value, evt) {
          if (value) {
            Session.set('channel', value);
          }
        }
      }));

    Template.homepage.channel = function () {
      return Session.get('channel');
    };


    //////////// Routing ///////////////

  Router.configure({
    layoutTemplate: 'layout'
  });
  
  Router.map(function () {
    this.route('channel', {
      path: '/c',
      template: 'channel',
      layoutTemplate: 'layout'
    });
  
    this.route('home', {
      path: '/',
      template: 'homepage',
      layoutTemplate: 'layout'
    });
  });

    //////////// END Routing ///////////


}




if (Meteor.isServer) {
  Meteor.startup(function () {
    Messages = new Meteor.Collection('messages');
    Channels = new Meteor.Collection('channels');

    // code to run on server at startup

  });


  Meteor.publish("chatroom", function () {
    var uniqNames = function () {
      var messages = Messages.find({}, {sort:{timestamp:-1}, limit:42}).fetch();
      var listNamesId = _.pluck(messages, 'author');
      var uniqNamesId = _.uniq(listNamesId);
      return uniqNamesId;
    };


    // console.log(Meteor.users.find({$or: [{_id: {$in: uniqNames() }},{"status.online": true}]}).fetch());
    return [
      Messages.find({}, {sort:{timestamp:-1}, limit:42}), // Attention DRY !
      Meteor.users.find({$or: [{_id: {$in: uniqNames()}},{ "status.online" : true}]})
    ]
  });

  /* Ici mettre un moyen de clean les olds user qui ne sont plus affiché */

}
