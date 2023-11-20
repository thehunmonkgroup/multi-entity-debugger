// websocket.js
var ws = new WebSocket("ws://localhost:8000/ws");
var messages = {}; // Stores messages by agent
var currentAgent = null; // Currently selected agent

function createMessageElement(msgObj) {
    var messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");

    var dl = document.createElement("dl");
    Object.entries(msgObj).forEach(([key, value]) => {
        if (key !== 'agent') {
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
    if (currentAgent && messages[currentAgent]) {
        messages[currentAgent].forEach(msg => {
            var msgElement = createMessageElement(msg);
            container.appendChild(msgElement);
        });
    }
}

function createAgentLink(agent) {
    var agentLinkDiv = document.createElement("div");
    agentLinkDiv.classList.add("agent-link");
    var link = document.createElement("a");
    link.textContent = agent;
    link.href = "#";
    agentLinkDiv.onclick = function() {
        currentAgent = agent;
        displayMessages();
        return false;
    };
    agentLinkDiv.appendChild(link);
    return agentLinkDiv;
}

function updateAgentLinks() {
    var agentsDiv = document.getElementById("agents");
    Object.keys(messages).forEach(agent => {
        if (!document.getElementById("link-" + agent)) {
            var link = createAgentLink(agent);
            link.id = "link-" + agent;
            agentsDiv.appendChild(link);
            agentsDiv.appendChild(document.createTextNode(" "));
        }
    });
}

ws.onmessage = function(event) {
    console.log(`Received message ${event.data}`);
    var data = JSON.parse(event.data);
    if (!messages[data.agent]) {
        messages[data.agent] = [];
    }
    messages[data.agent].push(data);
    updateAgentLinks();
    if (currentAgent === null) {
        currentAgent = data.agent;
    }
    if (currentAgent === data.agent) {
        displayMessages();
    }
};

