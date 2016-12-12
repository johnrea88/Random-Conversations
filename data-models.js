'use strict';

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
  self.status = 'ACTIVE';
  self.initiatingUserId = initiatingUserId;
  self.respondingUserId = null;

  self.endConversation = function() {
    self.status = 'ENDED';
  };

  self.isActive = function() {
    return self.status === 'ACTIVE';
  };

  self.isBetweenUsers = function(userId1, userId2) {
    return (self.initiatingUserId === userId1 && self.respondingUserId === userId2) ||
      (self.initiatingUserId === userId2 && self.respondingUserId === userId1);
  }
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
  self.text = text;

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

  self.getUserByGoogleUserId = function(googleUserId) {
    for(let i = 0; i < self.users.length; i++) {
      let user = self.users[i];
      if(user.googleUserId === googleUserId) return user;
    }
    return null;
  };

  self.createUser = function(googleUserId, name) {
    let user = new User(googleUserId, name);
    self.users.push(user);
    return user;
  };

  self.hasSentAMessage = function(googleUserId) {
    let user = self.getUserByGoogleUserId(googleUserId);
    if(!user) return false;
    for(let i = 0; i < self.messages.length; i++) {
      let message = self.messages[i];
      if(message.authoringUserId === user.id) return true;
    }
    return false;
  };

  self.activeConversationExists = function(userId1, userId2) {
    for(let i = 0; i < self.conversations.length; i++) {
      let conversation = self.conversations[i];
      if(conversation.isBetweenUsers(userId1, userId2) && conversation.isActive()) {
        return true;
      }
    }
    return false;
  };

  self.getUnmatchedConversations = function(userId) {
    let conversations = [];
    self.conversations.forEach(function(conversation) {
      if(conversation.respondingUserId === null && conversation.initiatingUserId !== userId) {
        conversations.push(conversation);
      }
    });
    return conversations;
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

  self.getConversationIdByMessageId = function(messageId) {
    for(let i = 0; i < self.messages.length; i++) {
      let message = self.messages[i];
      if(message.id === messageId) return message.conversationId;
    }
    return null;
  };

  self.getAllMessagesByMessageId = function(messageId) {
    let messages = [];
    let conversationId = self.getConversationIdByMessageId(messageId);
    if (!conversationId) return messages;
    return self.getAllMessagesByConversationId(conversationId);
  };

  self.endConversation = function(messageId) {
    let conversation = self.getConversationByMessageId(messageId);
    conversation.endConversation();
  };

  self.startNewConversation = function(user, text) {
    let unmatchedConversations = self.getUnmatchedConversations(user.id);
    for(let i = 0; i < unmatchedConversations.length; i++) {
      let unmatchedConversation = unmatchedConversations[i];
      if(!self.activeConversationExists(user.id, unmatchedConversation.initiatingUserId)) {
        unmatchedConversation.respondingUserId = user.id;
        let message = new Message(text, user.id, unmatchedConversation.id);
        self.messages.push(message);
        return;
      }
    }
    let conversation = new Conversation(user.id);
    self.conversations.push(conversation);
    let message = new Message(text, user.id, conversation.id);
    self.messages.push(message);
  };

  self.replyToMessage = function(replyingUserId, replyText, messageIdToReplyTo) {
    let conversationId = self.getConversationIdByMessageId(messageIdToReplyTo);
    let message = new Message(replyText, replyingUserId, conversationId);
    self.messages.push(message);
  };

  self.getUserByUserId = function(userId) {
    for(let i = 0; i < self.users.length; i++) {
      let user = self.users[i];
      if(user.id === userId) return user;
    }
    return null;
  };

  self.getConversationByConversationId = function(conversationId) {
    for(let i = 0; i < self.conversations; i++) {
      let conversation = self.conversations[i];
      if(conversation.id === conversations) return conversation;
    }
    return null;
  };

  self.getConversationByMessageId = function(messageId) {
    let conversationId = self.getConversationIdByMessageId(messageId);
    return self.getConversationByConversationId(conversationId);
  };

  self.getConversationsByUserId = function(userId) {
    let conversations = [];
    self.conversations.forEach(function(conversation) {
      if(conversation.initiatingUserId === userId || conversation.respondingUserId === userId) {
        if(conversation.isActive()) conversations.push(conversation);
      }
    });
    return conversations;
  };

  self.dbDump = function() {
    console.log('users:\n' + JSON.stringify(self.users));
    console.log('\n\nconversations:\n' + JSON.stringify(self.conversations));
    console.log('\n\nmessages:\n' + JSON.stringify(self.messages));
  };

  self.getUnreadMessages = function(userId) {
    let unreadMessages = [];
    let allConversations = self.getConversationsByUserId(userId);
    allConversations.forEach(function(conversation) {
      if (conversation.isActive()) {
        let allMessages = self.getAllMessagesByConversationId(conversation.id);
        allMessages.forEach(function(message) {
          if(message.isUnread() && message.authoringUserId !== userId) unreadMessages.push(message);
        });
      }
    });
    return unreadMessages;
  };
};