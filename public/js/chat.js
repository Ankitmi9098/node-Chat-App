const socket = io();

// socket.on("countUpdated", (count) => {
//   //event name needs to be same, argument name can be different
//   console.log(`The count has been updated to ${count}`);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("clicked");
//   socket.emit("increment");
// });

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $sendButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//Template
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild; //New Message Element

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("newMessage", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll()
  // console.log(message);
});

socket.on("locationMessage", (message) => {
  const locationRender = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", locationRender);
  autoScroll()
  // console.log(message);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $sendButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    $messageFormInput.value = "";
    $sendButton.removeAttribute("disabled");
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    // console.log("Message Delivered");
  });
});

$locationButton.addEventListener("click", () => {
  $locationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position.coords.latitude)
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("sendLocation", location, () => {
      $locationButton.removeAttribute("disabled");
      // console.log("Location Shared");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  const sidebarRender = Mustache.render(sidebarTemplate, { room, users });
  $sidebar.innerHTML = sidebarRender;
});
