module.exports = {
  Database: function () {
    return new DataContainer();
  }
};

var lastUserId = 0;
var lastConversationId = 0;
var lastMessageId = 0;

var User = function(googleUserId, name) {
  ++lastUserId;

  var self = this;
  self.id = lastUserId;
  self.googleUserId = googleUserId;
  self.name = name;
  self.dateCreated = new Date();
  self.lastUpdated = new Date(); 
};

var Conversation = function(initiatingUserId) {
  ++lastConversationId;

  var self = this;
  self.id = lastConversationId;
  self.dateCreated = new Date();
  self.lastUpdated = new Date();
  self.status = "ACTIVE";
  self.initiatingUserId = initiatingUserId;
  self.respondingUserId = null;
};

var Message = function(text, authoringUserId, conversationId) {
  ++lastMessageId;

  var self = this;
  self.id = lastMessageId;
  self.dateCreated = new Date();
  self.lastUpdated = new Date();
  self.authoringUserId = authoringUserId;
  self.conversationId = conversationId;
  self.status = 'UNREAD';

  self.markAsRead = function() {
    self.status = 'READ';
  };

  self.isUnread = function() {
    return self.status === 'UNREAD';
  };
};

var DataContainer = function() {
  var self = this;
  self.users = [];
  self.conversations = [];
  self.messages = [];

  self.getOrStoreUser = function(googleUserId, name) {
    self.users.forEach(function(user) {
      if(user.googleUserId === googleUserId) return user;
    });
    var newUser = new User(googleUserId, name);
    self.users.push(newUser);
    return user;
  };

  self.getUnmatchedConversation = function(userId) {
    self.conversations.forEach(function(conversation) {
      if(conversation.respondingUserId === null && conversation.initiatingUserId !== user) {
        return conversation;
      }
    });
    return null;
  };

  // List is ordered oldest to newest
  self.getAllMessagesByConversationId = function(conversationId) {
    let foundMessages = [];
    self.messages.forEach(function(message){
      if(message.conversationId === conversationId) {
        foundMessages.push(message);
      }
    });
    return foundMessages;
  };

  self.getAllMessagesByMessageId = function(messageId) {

  };

  self.endConversation = function(messageId) {

  };

  self.replyToMessage = function(replyingUserId, replyText, messageIdToReplyTo) {

  };

  self.getUserByUserId = function(userId) {
    self.users.forEach(function(user){
      if(user.id === userId) return user;
    });
    return null;
  };

  self.getConversationsByUserId = function(userId) {
    let conversations = [];
    self.conversations.forEach(function(conversation) {
      if(conversation.initiatingUserId === userId || conversation.respondingUserId === userId) {
        conversations.push(conversation);
      }
    });
    return conversations;
  };

  self.getUnreadMessages = function(userId) {
    let unreadMessages = [];
    let allConversations = self.getConversationsByUserId(userId);
    allConversations.forEach(function(conversation) {
      let allMessages = self.getAllMessagesByConversationId(conversation.id);
      allMessages.forEach(function(message) {
        if(message.isUnread()) unreadMessages.push(message);
      });
    });
    return unreadMessages;
  };
};