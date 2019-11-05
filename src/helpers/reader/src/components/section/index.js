import React from 'react';
import './section.css'
import h2p from 'html2plaintext';
import Slider from '../slider';

export default class Section extends React.Component {

    constructor(props){
        super(props);
    }

    render(){
        // get tags
        let tags =this.props.section.tags || [];
        // set childs container
        let childs = [];
        // generate slider childs
        this.props.section.media.forEach(m => childs.push(
            /^jpeg|png|jpg|svg|gif$/i.test(m.ext) ? 
            // image?
            <div className="media">
                <img src={m.url}/>
            </div> 
            : 
            // video?
            <div className="media">
                <video src={m.url} controls={true}/>
            </div>
        ));
        
        return (
            <div className="section">
                <div className="media">
                    <Slider loop={true} showArrows={this.props.section.media.length > 1} showNav={this.props.section.media.length > 1} selected={0}>{childs}</Slider>
                </div>
                <div className="title">
                    {this.props.section.title || ""}
                </div>
                <div className="description">
                    {h2p(this.props.section.description || "")}
                </div>
                <div className="tags">
                    { tags.length ? `#${tags.join(" #")}` : "" }
                </div>
            </div>
        )
    }

}