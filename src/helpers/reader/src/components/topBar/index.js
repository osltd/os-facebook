import React from 'react';
import './topBar.css'

export default class TopBar extends React.Component {

    constructor(props){
        super(props);
    }

    render(){
        return (
            <div className="top-bar">
                <div className="top-bar-wrapper">
                    <img src={this.props.shop.logo} className="shop-logo"/>
                    <span className="shop-name">{this.props.shop.name}</span>
                </div>
            </div>
        )
    }

}