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
    var messages = {}; // Stores messages by entity
    var currentEntity = null; // Currently selected entity

    var getRandomId = function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    var EntityView = Marionette.View.extend({
        tagName: 'div',
        className: 'entity-container',
        template: _.template(document.getElementById("entity-template").innerHTML),
        events: {
            'click a': 'entityClicked'
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

    var entitiesView = new EntitiesView({
        collection: new Backbone.Collection()
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
    });

    ws.onmessage = function(event) {
        console.log(`Received message ${event.data}`);
        var data = JSON.parse(event.data);
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











// var ws = new WebSocket("ws://localhost:8000/ws");
// var messages = {}; // Stores messages by entity
// var currentEntity = null; // Currently selected entity
//
// function createMessageElement(msgObj) {
//     var messageContainer = document.createElement("div");
//     messageContainer.classList.add("message-container");
//
//     var dl = document.createElement("dl");
//     Object.entries(msgObj).forEach(([key, value]) => {
//         if (key !== 'id' && key !== 'label') {
//             var dt = document.createElement("dt");
//             dt.textContent = key;
//             dl.appendChild(dt);
//
//             var dd = document.createElement("dd");
//             dd.textContent = value;
//             dl.appendChild(dd);
//         }
//     });
//
//     messageContainer.appendChild(dl);
//     return messageContainer;
// }
//
// function displayMessages() {
//     var container = document.getElementById("messages");
//     container.innerHTML = '';
//     if (currentEntity && messages[currentEntity]) {
//         messages[currentEntity].forEach(msg => {
//             var msgElement = createMessageElement(msg);
//             container.appendChild(msgElement);
//         });
//     }
// }
//
// function createEntityLink(id, label) {
//     var entityLinkDiv = document.createElement("div");
//     entityLinkDiv.classList.add("entity-link");
//     var link = document.createElement("a");
//     link.textContent = label;
//     link.href = "#";
//     entityLinkDiv.onclick = function() {
//         currentEntity = id;
//         displayMessages();
//         return false;
//     };
//     entityLinkDiv.appendChild(link);
//     return entityLinkDiv;
// }
//
// function updateEntityLinks() {
//     var entitiesDiv = document.getElementById("entities");
//     Object.keys(messages).forEach(id => {
//         if (!document.getElementById("link-" + id)) {
//             var data = messages[id];
//             var link = createEntityLink(id, data[0].label);
//             link.id = "link-" + id;
//             entitiesDiv.appendChild(link);
//             entitiesDiv.appendChild(document.createTextNode(" "));
//         }
//     });
// }
//
// ws.onmessage = function(event) {
//     console.log(`Received message ${event.data}`);
//     var data = JSON.parse(event.data);
//     if (!messages[data.id]) {
//         messages[data.id] = [];
//     }
//     messages[data.id].push(data);
//     updateEntityLinks();
//     if (currentEntity === null) {
//         currentEntity = data.id;
//     }
//     if (currentEntity === data.id) {
//         displayMessages();
//     }
// };
//
