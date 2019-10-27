// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket,
// and connect at the socket path in "lib/web/endpoint.ex".
//
// Pass the token on params as below. Or remove it
// from the params if you are not using authentication.
import {Socket, Presence} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "lib/web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "lib/web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/3" function
// in "lib/web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket, _connect_info) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, connect to the socket:
let roomId = window.roomId
let presences = {}
// console.log(roomId)
socket.connect()
// console.log(socket)

if (roomId) {
  const timeout = 3000
  var typingTimer
  let userTyping = false
  // Now that you are connected, you can join channels with a topic:
  let channel = socket.channel(`room:${roomId}`, {})
  // console.log(channel)
  channel.join()
    .receive("ok", resp => { console.log("Joined successfully", resp) })
    .receive("error", resp => { console.log("Unable to join", resp) })




  channel.on(`room:${roomId}:new_message`, (message) => {
    // console.log("message yo",message)
    displayMessage(message)
  })

  channel.on("presence_state", state => {
    presences = Presence.syncState(presences, state)
    // console.log(presences)
    displayUsers(presences)
  })

  channel.on("presence_diff", diff => {
    presences = Presence.syncDiff(presences, diff)
    // console.log(presences)
    displayUsers(presences)
  })

  document.querySelector("#message-form").addEventListener('submit', (e) => {
    e.preventDefault()
    let input = e.target.querySelector("#message-body")

    channel.push('message:add', {
      message: input.value
    })
    input.value = ''
  })

  document.querySelector("#message-body").addEventListener("keydown", () => {
    userStartTyping()
    clearTimeout(typingTimer)
  })

  document.querySelector("#message-body").addEventListener("keyup", ()=> {
    clearTimeout(typingTimer)
    typingTimer = setTimeout(userStopTyping, timeout)
  })

  const userStartTyping = () => {
    if (userTyping) {
      return 
    }

    userTyping = true
    channel.push('user:typing', {
      typing: true
    })
  }

  const userStopTyping = () => {
    clearTimeout(typingTimer)
    userTyping = false

    channel.push('user:typing', {
      typing: false
    })
  }

  const displayMessage = (msg) => {
    let template = `
      <li class="list-group-item">
        <strong>
          ${msg.user.username}
        </strong> :   
        ${msg.body}
      </li>
    `

    document.querySelector("#display").innerHTML += template
  }

  const displayUsers = (presences) => {
    let usersOnline = Presence.list(presences, (_id, {
      metas: [
        user, ...rest
      ]
    }) => {
      var typingTemplate = ''
      if (user.typing) {
        typingTemplate = '<i>(Typing...)</i>'
      }
      return `
        <div id="user-${user.user_id}"><strong class="text-secondary">${user.username}</strong>${typingTemplate}</div>
      `
    }).join("")
    document.querySelector("#users-online").innerHTML = usersOnline
  }
}

export default socket
