var MyApp = new Marionette.Application();

var MainLayout = Marionette.View.extend({
  el: 'body', // Bind to the existing body element
  regions: {
    entities: '#entities',
    messages: '#messages'
  }
});

MyApp.on('start', function() {
    var mainLayout = new MainLayout();
    var ws = new WebSocket("ws://localhost:8000/ws");
    var entities = {}; // Stores entity data.
    var messages = {}; // Stores messages by entity
    var currentEntity = null; // Currently selected entity
    var messagesHeader = $('#messages-header');

    var getRandomId = function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    var updateHeaders = function(entityName) {
        messagesHeader.text(`Messages for ${entityName}`);
    }

    var EntityView = Marionette.View.extend({
        tagName: 'div',
        className: 'entity-container',
        template: _.template(document.getElementById("entity-template").innerHTML),
        events: {
            'click': 'entityClicked'
        },
        entityClicked: function(e) {
            e.preventDefault();
            var entityId = this.model.get('name');
            MyApp.trigger('entity:selected', entityId);
        }
    });

    var EntitiesView = Marionette.CollectionView.extend({
        childView: EntityView,
        emptyView: Marionette.View.extend({
          template: _.template('No entities yet.')
        }),
    });

    var MessageView = Marionette.View.extend({
        tagName: 'div',
        className: 'message-container',
        template: _.template(document.getElementById("message-template").innerHTML),
        templateContext: function() {
            return {
                message: this.model.toJSON()
            };
        },
        onRender: function() {
            console.log('MessageView rendered', this.model);
        },
    });

    var MessagesView = Marionette.CollectionView.extend({
        childView: MessageView,
        emptyView: Marionette.View.extend({
          template: _.template('No messages yet.')
        }),
    });

    var Entities = Backbone.Collection.extend({
      comparator: function(model) {
        return model.get('label');
      }
    });

    var entitiesView = new EntitiesView({
        collection: new Entities(),
    });

    var messagesView = new MessagesView({
        collection: new Backbone.Collection()
    });

    mainLayout.showChildView('entities', entitiesView);
    mainLayout.showChildView('messages', messagesView);

    MyApp.on('entity:selected', function(entityId) {
        currentEntity = entityId;
        var entityMessages = messages[entityId] || [];
        messagesView.collection.reset(entityMessages);
        updateHeaders(entities[entityId].label);
    });

    ws.onmessage = function(event) {
        console.log(`Received message ${event.data}`);
        var data = JSON.parse(event.data);
        if (!entities[data.name]) {
            entities[data.name] = {
                name: data.name,
                label: data.label,
            };
        }
        if (!messages[data.name]) {
            messages[data.name] = [];
        }
        data.id = getRandomId();
        var messageModel = new Backbone.Model(data);
        messages[data.name].push(messageModel);
        if (!entitiesView.collection.findWhere({ id: data.name })) {
            entitiesView.collection.add(new Backbone.Model({ id: data.name, name: data.name, label: data.label }));
        }
        if (currentEntity === null) {
            currentEntity = data.name;
            MyApp.trigger('entity:selected', currentEntity);
        } else if (currentEntity === data.name) {
            messagesView.collection.add(messageModel);
        }
    };
});

$(function() {
    MyApp.start();
});
