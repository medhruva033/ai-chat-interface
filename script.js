
const $ = (selector) => document.querySelector(selector);

const form = $("#chat-form");
const input = $("#prompt");
const messages = $("#messages");
const welcome = $("#welcome");
const chatList = $("#chat-list");
const search = $("#search");
const sendButton = $("#send");

const STORAGE_KEY = "nexa-ai-conversations-v1";

let chats = loadChats();
let activeId = chats[0]?.id ?? null;
let waiting = false;

function loadChats() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.filter(
      chat => chat && typeof chat.id === "string" && Array.isArray(chat.messages)
    ) : [];
  } catch {
    return [];
  }
}

function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    alert("Unable to save chats. Browser storage may be full or disabled.");
  }
}

function currentChat() {
  return chats.find(chat => chat.id === activeId);
}

function createChat() {
  if (waiting) return;
  const chat = {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now()
  };
  chats.unshift(chat);
  activeId = chat.id;
  saveChats();
  render();
  input.focus();
  $("#sidebar").classList.remove("open");
}

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = "message-row";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "You" : "✳";

  const content = document.createElement("div");
  content.className = "message-content";

  const author = document.createElement("div");
  author.className = "message-author";
  author.textContent = role === "user" ? "You" : "Nexa AI";

  const body = document.createElement("div");
  body.className = "message-text";
  body.textContent = text;

  content.append(author, body);
  row.append(avatar, content);
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  return body;
}

function render() {
  chatList.replaceChildren();

  const query = search.value.trim().toLowerCase();
  const visibleChats = chats.filter(chat => {
    const content = chat.title + " " +
      chat.messages.map(message => message.content).join(" ");
    return content.toLowerCase().includes(query);
  });

  visibleChats.forEach(chat => {
    const button = document.createElement("button");
    button.className = "chat-item" + (chat.id === activeId ? " active" : "");
    button.type = "button";

    const icon = document.createElement("span");
    icon.textContent = "◷";

    const title = document.createElement("span");
    title.textContent = chat.title;

    button.append(icon, title);
    button.addEventListener("click", () => {
      if (waiting) return;
      activeId = chat.id;
      render();
      $("#sidebar").classList.remove("open");
    });
    chatList.append(button);
  });

  const chat = currentChat();
  const hasMessages = Boolean(chat?.messages.length);

  welcome.hidden = hasMessages;
  messages.hidden = !hasMessages;
  messages.replaceChildren();

  if (chat) {
    chat.messages.forEach(message => addMessage(message.role, message.content));
  }
}

function demoReply(text) {
  const normalized = text.toLowerCase();

  if (normalized.includes("c++")) {
    return "Here's a practical C++ roadmap:\n\n1. Master functions, arrays and pointers.\n2. Learn classes and object-oriented programming.\n3. Practise STL: vector, map, set and algorithms.\n4. Solve DSA problems consistently.\n5. Explore open-source C++ projects and submit a tested pull request.\n\nStart with one small, testable goal.";
  }

  if (normalized.includes("project") || normalized.includes("github")) {
    return "A strong portfolio project should solve a clear problem.\n\n• Define the target user.\n• Build the smallest useful version.\n• Write a clear README.\n• Add tests where appropriate.\n• Document limitations and future improvements.\n\nAvoid claiming features that are not implemented.";
  }

  if (normalized.includes("api")) {
    return "An API lets two software components communicate.\n\nFor example, a frontend sends a request to a backend. The backend processes it and returns data, often as JSON.\n\nA real AI chat app needs a backend to call the model provider securely. Never expose a private API key in browser JavaScript.";
  }

  return "Good question. This demo currently uses predefined responses rather than a real AI model.\n\nTry asking about C++, GitHub projects, APIs, or learning roadmaps. A backend integration can make the assistant generate real answers.";
}

function sendMessage(text) {
  if (waiting || !text.trim()) return;

  if (!activeId) {
    const chat = {
      id: crypto.randomUUID(),
      title: "New conversation",
      messages: [],
      updatedAt: Date.now()
    };
    chats.unshift(chat);
    activeId = chat.id;
  }

  const chat = currentChat();
  if (!chat) return;

  chat.messages.push({ role: "user", content: text });
  if (chat.messages.length === 1) {
    chat.title = text.length > 32 ? text.slice(0, 32) + "…" : text;
  }

  chat.updatedAt = Date.now();
  saveChats();
  render();

  waiting = true;
  input.disabled = true;
  sendButton.disabled = true;

  const typing = addMessage("assistant", "Nexa is thinking...");
  typing.classList.add("typing");

  // Demo delay, not a real model request.
  window.setTimeout(() => {
    const reply = demoReply(text);
    const latestChat = currentChat();

    if (latestChat) {
      latestChat.messages.push({ role: "assistant", content: reply });
      latestChat.updatedAt = Date.now();
      saveChats();
    }

    waiting = false;
    input.disabled = false;
    sendButton.disabled = false;
    render();
    input.focus();
  }, 850);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || waiting) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
});

$("#new-chat").addEventListener("click", createChat);
search.addEventListener("input", render);

$("#menu").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

$("#clear-all").addEventListener("click", () => {
  if (waiting || !chats.length) return;
  if (!confirm("Delete all saved conversations?")) return;

  chats = [];
  activeId = null;
  saveChats();
  render();
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  });
});

if (!activeId) {
  activeId = null;
}
render();
