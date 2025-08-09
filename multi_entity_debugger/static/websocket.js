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
    var entityAutoScroll = {};
    var entityStats = {};

    var activateKeyHandlers = function() {
        $(document).on('keydown', function(e) {
            var isInputFocused = $('input, textarea, select').is(':focus');
            var isHelpVisible = $('.help-modal-overlay').length > 0;
            
            if (isHelpVisible) {
                if (e.which === 27 || (e.which === 191 && e.shiftKey)) {
                    hideHelpModal();
                    e.preventDefault();
                }
                return;
            }
            
            var ctrlOrCmd = isMac() ? e.metaKey : e.ctrlKey;
            
            if (e.which === 191 && e.shiftKey) {
                showHelpModal();
                e.preventDefault();
                return;
            }
            
            if (ctrlOrCmd && e.which === 70) {
                $('#search-input').focus();
                e.preventDefault();
                return;
            }
            
            if (e.which === 27) {
                if (isInputFocused) {
                    $('input, textarea, select').blur();
                } else if (currentEntity) {
                    messagesView.onClearFilters();
                }
                e.preventDefault();
                return;
            }
            
            if (!isInputFocused) {
                if (e.which === 83) {
                    if (currentEntity) {
                        messagesView.onAutoScrollToggle();
                    }
                    e.preventDefault();
                    return;
                }
                
                if (ctrlOrCmd && e.which === 75) {
                    if (e.shiftKey) {
                        clearAllMessages();
                    } else if (currentEntity) {
                        clearEntityMessages(currentEntity);
                    }
                    e.preventDefault();
                    return;
                }
                
                if (e.which === 68) {
                    toggleDarkMode();
                    e.preventDefault();
                    return;
                }
                
                var collection = entitiesView.collection;
                var activeEntity = collection.findWhere({active: true});
                var currentIndex = collection.indexOf(activeEntity || collection.at(0));
                var newEntity;
                
                if (e.which === 39 || (e.which === 9 && !e.shiftKey)) {
                    newEntity = collection.at(currentIndex + 1) || collection.at(0);
                } else if (e.which === 37 || (e.which === 9 && e.shiftKey)) {
                    newEntity = collection.at(currentIndex - 1) || collection.last();
                } else if (e.which >= 49 && e.which <= 57) {
                    var index = e.which - 49;
                    if (collection.length > index && currentIndex !== index) {
                        newEntity = collection.at(index);
                    }
                }
                
                if (newEntity) {
                    MyApp.trigger('entity:selected', newEntity.id);
                    if (e.which === 9) {
                        e.preventDefault();
                    }
                }
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

    var getEntityAutoScroll = function(entityId) {
        if (entityAutoScroll[entityId] === undefined) {
            entityAutoScroll[entityId] = true;
        }
        return entityAutoScroll[entityId];
    };

    var setEntityAutoScroll = function(entityId, enabled) {
        entityAutoScroll[entityId] = enabled;
        updateAutoScrollButton(entityId);
    };

    var updateAutoScrollButton = function(entityId) {
        var enabled = getEntityAutoScroll(entityId);
        var button = $('#auto-scroll-toggle');
        var icon = button.find('.auto-scroll-icon');
        var text = button.find('.auto-scroll-text');
        
        if (enabled) {
            button.removeClass('auto-scroll-off').addClass('auto-scroll-on');
            text.text('Auto-scroll: ON');
            icon.text('↓');
        } else {
            button.removeClass('auto-scroll-on').addClass('auto-scroll-off');
            text.text('Auto-scroll: OFF');
            icon.text('↕');
        }
    };

    var isScrolledToBottom = function(element) {
        return element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
    };

    var scrollToBottom = function(element) {
        element.scrollTop = element.scrollHeight;
    };

    var formatRelativeTime = function(timestamp) {
        var now = new Date();
        var messageTime = new Date(timestamp);
        var diffMs = now - messageTime;
        var diffSeconds = Math.floor(diffMs / 1000);
        var diffMinutes = Math.floor(diffSeconds / 60);
        var diffHours = Math.floor(diffMinutes / 60);
        var diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 30) {
            return 'just now';
        } else if (diffSeconds < 60) {
            return diffSeconds + ' seconds ago';
        } else if (diffMinutes === 1) {
            return '1 minute ago';
        } else if (diffMinutes < 60) {
            return diffMinutes + ' minutes ago';
        } else if (diffHours === 1) {
            return '1 hour ago';
        } else if (diffHours < 24) {
            return diffHours + ' hours ago';
        } else if (diffDays === 1) {
            return 'yesterday';
        } else if (diffDays < 7) {
            return diffDays + ' days ago';
        } else {
            return timestamp;
        }
    };

    var updateRelativeTimes = function() {
        $('.relative-time').each(function() {
            var timestamp = $(this).data('timestamp');
            if (timestamp) {
                $(this).text(formatRelativeTime(timestamp));
            }
        });
    };

    var getEntityStats = function(entityId) {
        if (!entityStats[entityId]) {
            entityStats[entityId] = {
                messageCount: 0,
                messageTimestamps: [],
                lastMessageTimestamp: null
            };
        }
        return entityStats[entityId];
    };

    var updateEntityStats = function(entityId, timestamp) {
        var stats = getEntityStats(entityId);
        stats.messageCount++;
        stats.lastMessageTimestamp = timestamp;
        
        var now = new Date();
        var messageTime = new Date(timestamp);
        stats.messageTimestamps.push(messageTime.getTime());
        
        var tenMinutesAgo = now.getTime() - (10 * 60 * 1000);
        stats.messageTimestamps = stats.messageTimestamps.filter(function(time) {
            return time > tenMinutesAgo;
        });
        
        var rate = (stats.messageTimestamps.length / 10).toFixed(1);
        stats.messageRate = rate;
        
        return stats;
    };

    var getActivityClass = function(rate) {
        if (rate >= 2.0) {
            return 'activity-high';
        } else if (rate >= 0.5) {
            return 'activity-medium';
        } else if (rate > 0) {
            return 'activity-low';
        }
        return '';
    };

    var updateEntityDisplay = function(entityId) {
        var entity = entitiesView.collection.get(entityId);
        if (entity) {
            var stats = getEntityStats(entityId);
            var lastMessage = stats.lastMessageTimestamp ? formatRelativeTime(stats.lastMessageTimestamp) : 'never';
            entity.set({
                messageCount: stats.messageCount,
                messageRate: stats.messageRate || '0.0',
                lastMessage: lastMessage
            });
        }
    };

    var clearEntityMessages = function(entityId) {
        messages[entityId] = [];
        entityStats[entityId] = {
            messageCount: 0,
            messageTimestamps: [],
            lastMessageTimestamp: null
        };
        
        updateEntityDisplay(entityId);
        
        if (currentEntity === entityId) {
            messagesView.collection.reset([]);
            updateFilterStatus(entityId);
        }
    };

    var clearAllMessages = function() {
        for (var entityId in messages) {
            clearEntityMessages(entityId);
        }
    };

    var showHelpModal = function() {
        var helpHtml = document.getElementById('help-modal-template').innerHTML;
        $('body').append(helpHtml);
        $('.help-modal-overlay').css('display', 'flex');
        
        $('#help-close, .help-modal-overlay').on('click', function(e) {
            if (e.target === this) {
                hideHelpModal();
            }
        });
    };

    var hideHelpModal = function() {
        $('.help-modal-overlay').remove();
    };

    var isMac = function() {
        return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    };

    var isDarkMode = function() {
        return document.body.classList.contains('dark-mode');
    };

    var toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        var darkModeEnabled = isDarkMode();
        localStorage.setItem('darkMode', darkModeEnabled);
        updateThemeToggleIcon();
    };

    var updateThemeToggleIcon = function() {
        var icon = $('.theme-icon');
        if (isDarkMode()) {
            icon.text('☀️');
        } else {
            icon.text('🌙');
        }
    };

    var initializeTheme = function() {
        var savedTheme = localStorage.getItem('darkMode');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'true' || (savedTheme === null && prefersDark)) {
            document.body.classList.add('dark-mode');
        }
        
        updateThemeToggleIcon();
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
            },
            'change:messageCount change:messageRate': function() {
                this.updateActivityClass();
            }
        },
        onRender: function() {
            if (this.model.get('active')) {
                this.ui.link.addClass('entity-link-active');
            }
            else {
                this.ui.link.removeClass('entity-link-active');
            }
            this.updateActivityClass();
        },
        updateActivityClass: function() {
            var rate = parseFloat(this.model.get('messageRate') || '0');
            var activityClass = getActivityClass(rate);
            
            this.ui.link.removeClass('activity-high activity-medium activity-low');
            if (activityClass) {
                this.ui.link.addClass(activityClass);
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
            this.listenTo(this.collection, 'add', this.onMessageAdded);
        },
        template: _.template(document.getElementById("messages-template").innerHTML),
        ui: {
            header: '#messages-header',
            searchInput: '#search-input',
            logLevelFilter: '#log-level-filter',
            clearButton: '#clear-filters',
            autoScrollToggle: '#auto-scroll-toggle',
            themeToggle: '#theme-toggle',
            messagesContainer: '#messages'
        },
        events: {
            'input @ui.searchInput': 'onSearchChange',
            'change @ui.logLevelFilter': 'onLogLevelChange',
            'click @ui.clearButton': 'onClearFilters',
            'click @ui.autoScrollToggle': 'onAutoScrollToggle',
            'click @ui.themeToggle': 'onThemeToggle',
            'scroll @ui.messagesContainer': 'onMessagesScroll'
        },
        childViewContainer: '#messages',
        childView: MessageView,
        onRender: function() {
            if (currentEntity) {
                var filter = getEntityFilter(currentEntity);
                this.ui.searchInput.val(filter.searchText);
                this.ui.logLevelFilter.val(filter.logLevel);
                updateFilterStatus(currentEntity);
                updateAutoScrollButton(currentEntity);
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
                updateAutoScrollButton(currentEntity);
                
                var messagesEl = this.ui.messagesContainer[0];
                if (getEntityAutoScroll(currentEntity) && messagesEl) {
                    setTimeout(function() {
                        scrollToBottom(messagesEl);
                        updateRelativeTimes();
                    }, 10);
                } else {
                    setTimeout(updateRelativeTimes, 10);
                }
            }
        },
        onMessageAdded: function() {
            setTimeout(updateRelativeTimes, 10);
            if (currentEntity && getEntityAutoScroll(currentEntity)) {
                var messagesEl = this.ui.messagesContainer[0];
                if (messagesEl) {
                    setTimeout(function() {
                        scrollToBottom(messagesEl);
                    }, 10);
                }
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
        onAutoScrollToggle: function() {
            if (!currentEntity) return;
            var currentEnabled = getEntityAutoScroll(currentEntity);
            setEntityAutoScroll(currentEntity, !currentEnabled);
        },
        onThemeToggle: function() {
            toggleDarkMode();
        },
        onMessagesScroll: function() {
            if (!currentEntity) return;
            var messagesEl = this.ui.messagesContainer[0];
            if (messagesEl && isScrolledToBottom(messagesEl)) {
                if (!getEntityAutoScroll(currentEntity)) {
                    setEntityAutoScroll(currentEntity, true);
                }
            }
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

    initializeTheme();
    activateKeyHandlers();

    setInterval(updateRelativeTimes, 30000);
    
    setInterval(function() {
        entitiesView.collection.each(function(entity) {
            var entityId = entity.get('name');
            updateEntityDisplay(entityId);
        });
    }, 30000);

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
        updateAutoScrollButton(entityId);
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
        
        updateEntityStats(data.name, data.timestamp);
        
        if (!entitiesView.collection.get(data.name)) {
            var stats = getEntityStats(data.name);
            var lastMessage = stats.lastMessageTimestamp ? formatRelativeTime(stats.lastMessageTimestamp) : 'never';
            entitiesView.collection.add(new Backbone.Model({ 
                id: data.name, 
                name: data.name, 
                label: data.label, 
                active: currentEntity === null,
                messageCount: stats.messageCount,
                messageRate: stats.messageRate || '0.0',
                lastMessage: lastMessage
            }));
        } else {
            updateEntityDisplay(data.name);
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
