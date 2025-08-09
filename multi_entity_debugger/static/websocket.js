var MyApp = new Marionette.Application();

MyApp.on('start', function() {
    var MainLayout = Marionette.View.extend({
      el: 'body', // Bind to the existing body element
      regions: {
        entities: '#entities-region',
        messages: '#messages-region'
      }
    });

    var mainLayout = new MainLayout();
    var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws = new WebSocket(protocol + "//" + window.location.host + "/ws");
    var messages = {};
    var currentEntity = null;
    var messagesHeader = $('#messages-header');
    var entityFilters = {};

    var activateKeyHandlers = function() {
        $(document).on('keyup', function(e) {
          var newEntity;
          var collection = entitiesView.collection;
          var activeEntity = collection.findWhere({active: true});
          var currentIndex = collection.indexOf(activeEntity ? activeEntity : 0);
          if (e.which === 39 || (e.which === 9 && !e.shiftKey)) { // Right arrow, Tab
            // Get next model, loop if at end
            var newEntity = collection.at(currentIndex + 1) || collection.at(0);
          } else if (e.which === 37 || (e.which === 9 && e.shiftKey)) { // Left arrow, Shift+Tab
            // Get previous model, loop if at beginning
            var newEntity = collection.at(currentIndex - 1) || collection.last();
          }
          // Number keys
          if (e.which >= 49 && e.which <= 57) {
            var index = e.which - 49;
            if ((collection.length > index) && currentIndex !== index) {
              newEntity = collection.at(index);
            }
          }
          if (newEntity) {
            MyApp.trigger('entity:selected', newEntity.id);
          }

        });
    }

    var getRandomId = function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    var matchesFilter = function(message, searchText, logLevel) {
        if (logLevel && message.log_level !== logLevel) {
            return false;
        }
        
        if (!searchText) {
            return true;
        }
        
        var searchLower = searchText.toLowerCase();
        var messageData = message.toJSON ? message.toJSON() : message;
        
        for (var key in messageData) {
            if (key === 'id' || key === 'name' || key === 'label') {
                continue;
            }
            
            var value = messageData[key];
            var searchValue = '';
            
            if (typeof value === 'string') {
                searchValue = value.toLowerCase();
            } else if (typeof value === 'object' && value !== null) {
                searchValue = JSON.stringify(value).toLowerCase();
            } else if (value !== null && value !== undefined) {
                searchValue = value.toString().toLowerCase();
            }
            
            if (searchValue.includes(searchLower)) {
                return true;
            }
        }
        
        return false;
    };

    var getEntityFilter = function(entityId) {
        if (!entityFilters[entityId]) {
            entityFilters[entityId] = {
                searchText: '',
                logLevel: ''
            };
        }
        return entityFilters[entityId];
    };

    var updateFilterStatus = function(entityId) {
        var filter = getEntityFilter(entityId);
        var allMessages = messages[entityId] || [];
        var filteredMessages = allMessages.filter(function(msg) {
            return matchesFilter(msg, filter.searchText, filter.logLevel);
        });
        
        var statusText = '';
        if (filter.searchText || filter.logLevel) {
            statusText = 'Showing ' + filteredMessages.length + ' of ' + allMessages.length + ' messages';
        }
        
        $('#filter-status').text(statusText);
    };

    var EntityView = Marionette.View.extend({
        tagName: 'div',
        className: 'entity-container',
        template: _.template(document.getElementById("entity-template").innerHTML),
        ui: {
            link: '.entity-link'
        },
        events: {
            'click': 'entityClicked',
        },
        modelEvents: {
            'change:active': function() {
                this.render();
            }
        },
        onRender: function() {
            if (this.model.get('active')) {
                this.ui.link.addClass('entity-link-active');
            }
            else {
                this.ui.link.removeClass('entity-link-active');
            }
        },
        entityClicked: function(e) {
            e.preventDefault();
            var entityId = this.model.get('name');
            MyApp.trigger('entity:selected', entityId);
        }
    });

    var EntitiesView = Marionette.CollectionView.extend({
        initialize: function() {
          this.listenTo(this.collection, 'change:active', this.onActiveChange);
        },
        template: _.template(document.getElementById("entities-template").innerHTML),
        childViewContainer: '#entities',
        childView: EntityView,
        emptyView: Marionette.View.extend({
          template: _.template('<em>No entities yet</em>')
        }),
        onActiveChange: function(changedModel, isActive) {
          if (isActive) {
            this.collection.each(function(model) {
              if (model !== changedModel) {
                model.set('active', false);
              }
            });
          }
        },
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
    });

    var MessagesView = Marionette.CollectionView.extend({
        initialize: function() {
            this.listenTo(this.collection, 'reset', this.onCollectionReset);
        },
        template: _.template(document.getElementById("messages-template").innerHTML),
        ui: {
            header: '#messages-header',
            searchInput: '#search-input',
            logLevelFilter: '#log-level-filter',
            clearButton: '#clear-filters'
        },
        events: {
            'input @ui.searchInput': 'onSearchChange',
            'change @ui.logLevelFilter': 'onLogLevelChange',
            'click @ui.clearButton': 'onClearFilters'
        },
        childViewContainer: '#messages',
        childView: MessageView,
        onRender: function() {
            if (currentEntity) {
                var filter = getEntityFilter(currentEntity);
                this.ui.searchInput.val(filter.searchText);
                this.ui.logLevelFilter.val(filter.logLevel);
                updateFilterStatus(currentEntity);
            }
        },
        onCollectionReset: function() {
            var firstMessage = this.collection.at(0);
            if (firstMessage) {
                this.ui.header.text(`Messages for ${firstMessage.get('label')}`);
            }
            if (currentEntity) {
                var filter = getEntityFilter(currentEntity);
                this.ui.searchInput.val(filter.searchText);
                this.ui.logLevelFilter.val(filter.logLevel);
                updateFilterStatus(currentEntity);
            }
        },
        onSearchChange: function() {
            if (!currentEntity) return;
            var filter = getEntityFilter(currentEntity);
            filter.searchText = this.ui.searchInput.val();
            this.applyFilters();
        },
        onLogLevelChange: function() {
            if (!currentEntity) return;
            var filter = getEntityFilter(currentEntity);
            filter.logLevel = this.ui.logLevelFilter.val();
            this.applyFilters();
        },
        onClearFilters: function() {
            if (!currentEntity) return;
            var filter = getEntityFilter(currentEntity);
            filter.searchText = '';
            filter.logLevel = '';
            this.ui.searchInput.val('');
            this.ui.logLevelFilter.val('');
            this.applyFilters();
        },
        applyFilters: function() {
            if (!currentEntity) return;
            var filter = getEntityFilter(currentEntity);
            var allMessages = messages[currentEntity] || [];
            var filteredMessages = allMessages.filter(function(msg) {
                return matchesFilter(msg, filter.searchText, filter.logLevel);
            });
            this.collection.reset(filteredMessages);
            updateFilterStatus(currentEntity);
        }
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

    activateKeyHandlers();

    MyApp.on('entity:selected', function(entityId) {
        currentEntity = entityId;
        var filter = getEntityFilter(entityId);
        var allMessages = messages[entityId] || [];
        var filteredMessages = allMessages.filter(function(msg) {
            return matchesFilter(msg, filter.searchText, filter.logLevel);
        });
        messagesView.collection.reset(filteredMessages);
        var entity = entitiesView.collection.get(entityId);
        entity.set('active', true);
        updateFilterStatus(entityId);
    });

    ws.onmessage = function(event) {
        console.log(`Received message ${event.data}`);
        var data;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            console.error('Failed to parse WebSocket message as JSON:', event.data, e);
            return;
        }
        if (!messages[data.name]) {
            messages[data.name] = [];
        }
        data.id = getRandomId();
        var messageModel = new Backbone.Model(data);
        messages[data.name].push(messageModel);
        if (!entitiesView.collection.get(data.name)) {
            entitiesView.collection.add(new Backbone.Model({ id: data.name, name: data.name, label: data.label, active: currentEntity === null }));
        }
        if (currentEntity === null) {
            currentEntity = data.name;
            MyApp.trigger('entity:selected', currentEntity);
        } else if (currentEntity === data.name) {
            var filter = getEntityFilter(currentEntity);
            if (matchesFilter(messageModel, filter.searchText, filter.logLevel)) {
                messagesView.collection.add(messageModel);
            }
            updateFilterStatus(currentEntity);
        }
    };
});

$(function() {
    MyApp.start();
});
