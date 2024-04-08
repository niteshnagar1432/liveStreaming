let liveBtn = document.querySelector(".liveBtn");

liveBtn.addEventListener("click", () => {
  // alert('ndjk');
  init();
});

const init = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  document.getElementById("video").srcObject = stream;
  const peer = createPeer();
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));
};

const createPeer = () => {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
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
  const { data } = await axios.post("http://15.206.243.145:4001/broadcast", payload);
  const desc = new RTCSessionDescription(data.sdp);
  peer.setRemoteDescription(desc).catch((e) => console.log(e));
};

// ----------------------------------------- view.html ------------------------------------
