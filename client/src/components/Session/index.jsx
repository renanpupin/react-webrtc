import React, {Component, Fragment} from "react";
import Peer from "../../components/Peer";
import socketIO from 'socket.io-client';
const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

const socket = socketIO();

export default class Session extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selfVideoStream: null,
            connectedToSocket: false,
            othersPeers: [],
        };

        this.pc = null;
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

    join() {
        socket.emit('join', "SECOMPP2018", (socketIds) => {
            console.log('join', socketIds);
            for (var i in socketIds) {
                var socketId = socketIds[i];
                // createPC(socketId, true);
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
                id={"remoteView" + index}
                key={index}
                videoSource={this.state.selfVideoStream ? URL.createObjectURL(this.state.selfVideoStream) : null}
            />
        );
    }


    render() {
        const othersPeers = this.state.othersPeers.map((item, index) => this.renderOtherPeers(item, index))
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