const express = require("express");
const bodyParser = require("body-parser");
const wrtc = require("wrtc");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
//get sender stream

const server = require("http").createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

let senderStream;

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
  res.json({status:true,message:'this is testing route.'});
})

app.post("/broadcast", async ({ body }, res) => {
  try {
    const peer = new wrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    const desc = new wrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
    };

    res.json(payload);
  } catch (error) {
    console.error("Error in /broadcast endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const handleTrackEvent = (e, peer) => {
  senderStream = e.streams[0];
};

app.post("/consumer", async ({ body }, res) => {
  try {
    const peer = new wrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });
    const desc = new wrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    senderStream.getTracks().forEach((e) => peer.addTrack(e, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
      sdp: peer.localDescription,
    };

    res.json(payload);
  } catch (error) {
    console.error("Error in /consumer endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("broadcast", (data) => {
    handleSocketBrodCast(data, socket, io);
  });

  socket.on("consume", (data) => {
    handleSocketStreamCon(data, socket, io);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const handleSocketBrodCast = async (data, socket, io) => {
  try {
    const peer = new wrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    const desc = new wrtc.RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    console.log("peer", data);
    const payload = {
      sdp: peer.localDescription,
      peer: data.peer,
    };

    io.to(socket.id).emit("broadcast", payload);

    // res.json(payload);
  } catch (error) {
    console.error("Error in / socket broadcast endpoint:", error);
    // res.status(500).json({ error: "Internal server error" });
  }
};

const handleSocketStreamCon = async (data, socket, io) => {
  try {
    const peer = new wrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });
    const desc = new wrtc.RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc);
    senderStream.getTracks().forEach((e) => peer.addTrack(e, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
      sdp: peer.localDescription,
    };
    io.to(socket.id).emit("consume", payload);
    // res.json(payload);
  } catch (error) {
    console.error("Error in /socket consumer endpoint:", error);
    // res.status(500).json({ error: "Internal server error" });
  }
};

server.listen(4001, () => {
  console.log("server running on port 4001.");
});
