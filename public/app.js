const socket = io();
const params = new URLSearchParams(location.search);
const roomId = params.get("room");

document.getElementById("roomCode").innerText = "Room: " + roomId;

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: location.port
});

let myStream;
let peers = {};
const grid = document.getElementById("video-grid");

function addVideo(stream, id){
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.id = id;
    grid.append(video);
}

async function startScreen(){
    myStream = await navigator.mediaDevices.getDisplayMedia({
        video:true,
        audio:true
    });
    addVideo(myStream, "me");
}

peer.on("open", id=>{
    socket.emit("join-room", { roomId, peerId:id });
});

socket.on("user-connected", userId=>{
    const call = peer.call(userId, myStream);
    call.on("stream", stream=>{
        addVideo(stream, userId);
    });
    peers[userId] = call;
});

peer.on("call", call=>{
    call.answer(myStream);
    call.on("stream", stream=>{
        addVideo(stream, call.peer);
    });
});

socket.on("chat", msg=>{
    const li = document.createElement("li");
    li.innerText = msg;
    document.getElementById("chat").appendChild(li);
});

function sendMsg(){
    const msg = document.getElementById("msg").value;
    socket.emit("chat", msg, roomId);
}
