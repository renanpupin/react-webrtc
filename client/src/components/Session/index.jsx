import React, {Component} from "react";
import Peer from "../../components/Peer";
import socketIO from 'socket.io-client';
const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};


export default class Session extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selfVideoStream: null,
            connectedToSocket: false,
            pcPeers: [],
            othersPeers: [],
        };

        this.socket = socketIO();
    }

    logError(error) {
        console.log("logError", error);
    }

    componentDidMount() {
        this.getLocalStream();
    }

    getLocalStream() {
        navigator.getUserMedia({ "audio": true, "video": true }, (stream) => {
            this.setState({selfVideoStream: stream});
        }, this.logError);
    }

    createOffer(pc, socketId) {
        pc.createOffer((desc) => {
            console.log('createOffer', desc);
            pc.setLocalDescription(desc, () => {
                console.log('setLocalDescription', pc.localDescription);
                this.socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
            }, this.logError);
        }, this.logError);
    }

    createDataChannel(pc) {
        if (pc.textDataChannel) {
            return;
        }
        let dataChannel = pc.createDataChannel("text");

        dataChannel.onerror = (error) => {
            console.log("dataChannel.onerror", error);
        };

        dataChannel.onmessage = (event) => {
            console.log("dataChannel.onmessage:", event.data);
            // var content = document.getElementById('textRoomContent');
            // content.innerHTML = content.innerHTML + '<p>' + socketId + ': ' + event.data + '</p>';
        };

        dataChannel.onopen = () => {
            console.log('dataChannel.onopen');
            // var textRoom = document.getElementById('textRoom');
            // textRoom.style.display = "block";
        };

        dataChannel.onclose = () => {
            console.log("dataChannel.onclose");
        };

        pc.textDataChannel = dataChannel;
    }

    createPC(socketId, isOffer) {
        let pc = new RTCPeerConnection(configuration);
        let pcPeers = this.state.pcPeers;
        pcPeers[socketId] = pc;

        pc.onicecandidate = (event) => {
            console.log('onicecandidate', event);
            if (event.candidate) {
                this.socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
            }
        };


        pc.onnegotiationneeded = () => {
            console.log('onnegotiationneeded');
            if(isOffer) {
                this.createOffer(pc, socketId);
            }
        };

        pc.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange', event);
            if(event.target.iceConnectionState === 'connected') {
                this.createDataChannel(pc);
            }
        };
        pc.onsignalingstatechange = (event) => {
            console.log('onsignalingstatechange', event);
        };

        pc.onaddstream = (event) => {
            console.log('onaddstream', event);
            // var element = document.createElement('video');
            let otherPeer = {
                id: "remoteView" + socketId,
                stream: event.stream,
            };
            this.setState({
                othersPeers: [...this.state.othersPeers, otherPeer],
            });
            // element.id = "remoteView" + socketId;
            // element.autoplay = 'autoplay';
            // element.src = URL.createObjectURL(event.stream);
            // remoteViewContainer.appendChild(element);
        };
        pc.addStream(this.state.selfVideoStream);
        return pc;
    }


    join() {
        this.socket.emit('join', "SECOMPP2018", (socketIds) => {
            console.log('join', socketIds);
            for (var i in socketIds) {
                let socketId = socketIds[i];
                this.createPC(socketId, true);
            }
            this.setState({
                connectedToSocket: true,
                othersPeers: socketIds,
            });
        });
    }

    renderOtherPeers(otherPeer, index) {
        return (
            <Peer
                id={otherPeer.id}
                key={index}
                videoSource={otherPeer.stream ? URL.createObjectURL(otherPeer.stream) : null}
            />
        );
    }


    render() {
        const othersPeers = this.state.othersPeers.map((item, index) => this.renderOtherPeers(item, index));
        return (
            <div className={"rw-session-container"}>
                <Peer
                    id={"selfPeer"}
                    videoSource={this.state.selfVideoStream ? URL.createObjectURL(this.state.selfVideoStream) : null}
                />
                {othersPeers}
                {!this.state.connectedToSocket &&
                <div className={"rw-connect-dialog-container"}>
                    <div className={"rw-backdrop"}>
                        <div className={"rw-connect-dialog"}>
                            <span>
                                Atenção
                            </span>
                            <span>
                                Ainda não conectado a sessão. Deseja conectar?
                            </span>
                            <button onClick={() => this.join()}>
                                Sim
                            </button>
                        </div>
                    </div>
                </div>}
            </div>
        )
    }
}