let viewBtn = document.querySelector('.viewBtn');

viewBtn.addEventListener('click',()=>{
    // alert('viewBtn');
    init();
});

const init = async ()=>{
    let peer =  createPeer()
    peer.addTransceiver('video',{direction:'recvonly'});
};

const createPeer = () =>{
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    });

    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationEvent(peer)

    return peer;
};

const handleNegotiationEvent = async (peer)=>{
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    let payload = {
        sdp: peer.localDescription,
    }
    const {data} = await axios.post('http://15.206.243.145:4001/consumer',payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((e)=>console.log(e));
};

const handleTrackEvent = (e)=>{
    document.getElementById('viewVideo').srcObject = e.streams[0]
};