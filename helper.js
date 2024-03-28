let liveBtn = document.querySelector(".liveBtn");

liveBtn.addEventListener("click", () => {
  // alert('ndjk');
  init();
});

const init = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("video").srcObject = stream;
  const peer = createPeer();
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));
};

const createPeer = () => {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org",
      },
    ],
  });

  peer.onnegotiationneeded = () => handleNegotiationEvent(peer);

  return peer;
};

const handleNegotiationEvent = async (peer) => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  let payload = {
    sdp: peer.localDescription,
  };
  const { data } = await axios.post("https://livestreaming-sbyq.onrender.com/broadcast", payload);
  const desc = new RTCSessionDescription(data.sdp);
  peer.setRemoteDescription(desc).catch((e) => console.log(e));
};

// ----------------------------------------- view.html ------------------------------------
