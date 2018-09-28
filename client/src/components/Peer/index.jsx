import React, {Component} from "react";

export default class Peer extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    componentDidMount() {

    }


    render() {
        if(this.props.videoSource) {
            return (
                <div
                    className={"rw-peer-container"}
                >
                    <video
                        id={this.props.id}
                        autoPlay
                        src={this.props.videoSource}
                        muted
                    />
                </div>
            );
        } else {
            return null;
        }

    }
}