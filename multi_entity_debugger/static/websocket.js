var ws = new WebSocket("ws://localhost:8000/ws");
var messages = {}; // Stores messages by entity
var currentEntity = null; // Currently selected entity

function createMessageElement(msgObj) {
    var messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");

    var dl = document.createElement("dl");
    Object.entries(msgObj).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'label') {
            var dt = document.createElement("dt");
            dt.textContent = key;
            dl.appendChild(dt);

            var dd = document.createElement("dd");
            dd.textContent = value;
            dl.appendChild(dd);
        }
    });

    messageContainer.appendChild(dl);
    return messageContainer;
}

function displayMessages() {
    var container = document.getElementById("messages");
    container.innerHTML = '';
    if (currentEntity && messages[currentEntity]) {
        messages[currentEntity].forEach(msg => {
            var msgElement = createMessageElement(msg);
            container.appendChild(msgElement);
        });
    }
}

function createEntityLink(id, label) {
    var entityLinkDiv = document.createElement("div");
    entityLinkDiv.classList.add("entity-link");
    var link = document.createElement("a");
    link.textContent = label;
    link.href = "#";
    entityLinkDiv.onclick = function() {
        currentEntity = id;
        displayMessages();
        return false;
    };
    entityLinkDiv.appendChild(link);
    return entityLinkDiv;
}

function updateEntityLinks() {
    var entitiesDiv = document.getElementById("entities");
    Object.keys(messages).forEach(id => {
        if (!document.getElementById("link-" + id)) {
            var data = messages[id];
            var link = createEntityLink(id, data[0].label);
            link.id = "link-" + id;
            entitiesDiv.appendChild(link);
            entitiesDiv.appendChild(document.createTextNode(" "));
        }
    });
}

ws.onmessage = function(event) {
    console.log(`Received message ${event.data}`);
    var data = JSON.parse(event.data);
    if (!messages[data.id]) {
        messages[data.id] = [];
    }
    messages[data.id].push(data);
    updateEntityLinks();
    if (currentEntity === null) {
        currentEntity = data.id;
    }
    if (currentEntity === data.id) {
        displayMessages();
    }
};

