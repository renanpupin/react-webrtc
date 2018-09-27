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
    }
}