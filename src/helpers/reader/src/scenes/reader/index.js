import React from 'react';
import './reader.css';

import TopBar from '../../components/topBar';
import Section from '../../components/section';
import Credit from '../../components/credit';

export default class Reader extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            article : window.OS_ARTICLE || {}
        }
    }

    renderArticle(){
        return (
            <div className="wrapper">
                {/* ----- Top Bar ----- */}
                <TopBar shop={(this.state.article || {}).shop || {}}/>
                {/* ----- Content ----- */}
                <div className="content">
                    {((this.state.article || {}).sections || []).map((section, idx) => <Section section={section} key={`section_${idx}`}/>)}
                </div>
                {/* ----- Footer ----- */}
                <Credit/>
            </div>
        );
    }

    renderNotFound(){
        return (
            <div className="wrapper">
                <h3>Oops! Something went wrong</h3>
                <div>
                    <pre>Error 404: Article not found.</pre>
                </div>
                <Credit/>
            </div>
        )
    }

    render(){
        console.log("=====> ", this.state.article);
        return (this.state.article || {}).id ? this.renderArticle() : this.renderNotFound();
    }

}