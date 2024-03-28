const express = require("express");
const bodyParser = require("body-parser");
const wrtc = require("wrtc");
const app = express();
const cors = require('cors');
//get sender stream
let senderStream;


app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/broadcast", async ({ body }, res) => {
    try {
        const peer = new wrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19320",
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
                    urls: "stun:stun.l.google.com:19320",
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


app.listen(4001,()=>{
    console.log('server running on port 4001.');
})