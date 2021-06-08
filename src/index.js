import React,{useState,useRef} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button, } from '@contentful/forma-36-react-components';
import { init, locations } from 'contentful-ui-extensions-sdk';
import tokens from '@contentful/forma-36-tokens';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import waiting from './waiting.gif';
import donecopy from './done.png';
import errorcopy from './error.png';
import readyngo from './ready.png';
import timeranimate from './TenMin.gif';
import timerzero from './zerotime.jpg';

export class DialogExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };
  constructor(props)
  {
    super(props);
    this.state={hotelCodes:[],currentHotelCode:'',currentParameter:'',isCopying:false};
    this.refFromHotelList=React.createRef();
    this.refResultStatus=React.createRef();
    this.refTimer=React.createRef();
    this.serviceURL='';
  }
  componentDidMount(){
      const thisHotelCode=this.props.sdk.parameters.invocation['currentHotelCode'];
      this.serviceURL=this.props.sdk.parameters.invocation['serviceURL'];
      console.log(this.serviceURL);

      this.props.sdk.space.getEntries({
        content_type: 'hotelInfo',
        skip:0,
        limit:1000
      }).then((response)=>{console.log('data: ' + response.items[0].fields.hotelCode['en-CA'] );
        let theHCodes=[];
        response.items.map((item)=>theHCodes.push(item.fields.hotelCode['en-CA']));
        this.setState({hotelCodes:[...this.state.hotelCodes,...theHCodes],currentHotelCode:thisHotelCode,currentParameter:'default',isCopying:false});
        this.refFromHotelList.current.value="Please Select Copy From Hotel";
      })
      .catch((err)=>{
        console.log(err)
      });
      
    };
  handleFieldSelectChange=(e)=>{
      console.log('Selection Change');
      
      const selectedCode=this.refFromHotelList.current.value;
      this.setState({
        hotelCodes: this.state.hotelCodes,
        currentHotelCode:this.state.currentHotelCode,
        currentParameter:selectedCode,
        isCopying:this.state.isCopying
      });
      this.refFromHotelList.current.value=selectedCode
      //this.refResultStatus.current.src=waiting
    };
  render() {
    return (
      <div style={{ margin: tokens.spacingM }}>
        <div style={{display:"flex",justifyContent:"left",alignItems:"center"}}>
          <select defaultValue={"Please Select Copy From Hotel"} onChange={this.handleFieldSelectChange} ref={this.refFromHotelList} style={{height:"30px"}}>
            <option key={9999} value='Please Select Copy From Hotel'>Please Select Copy From Hotel</option>
            {
            this.state.hotelCodes.map((itm,idx)=>{
                return<option key={idx} value={itm}>
                    {itm}
                </option>
            })
            }
          </select> will be copied into Hotel:{this.state.currentHotelCode}
          <img src={readyngo} height={40} width={40} ref={this.refResultStatus}/>
          <img src={timerzero} height={40} ref={this.refTimer}/>
        </div>
        <div>Selected Source Hotel Code:{this.state.currentParameter}</div>
        <Button
          testId="close-dialog"
          buttonType="muted"
          onClick={() => {
            this.props.sdk.close('data from modal dialog');
          }}>
          Close modal
        </Button>
        <Button
          testId="try-copy-hotel"
          buttonType="muted"
          disabled={this.state.isCopying}
          onClick={() => {
            this.refResultStatus.current.src=waiting;
            this.refTimer.current.src=timeranimate;
            const fetchConfig={
              headers:{
                  'SWG-Token': "abcde"
              }
            };
            this.setState({
              hotelCodes: this.state.hotelCodes,
              currentHotelCode:this.state.currentHotelCode,
              currentParameter:this.state.currentParameter,
              isCopying:true
            });
            //fetch("https://services.shapefutureconsulting.ca/api/GetHotelData?FromHotelCode=" + this.refFromHotelList.current.value + "&ToHotelCode=" + this.state.currentHotelCode
            fetch(this.serviceURL +"/" + this.refFromHotelList.current.value + "/" + this.state.currentHotelCode
            ,fetchConfig)
            .then((res)=>res.json())
            .then((rsp)=>{
              console.log(rsp);
              this.refResultStatus.current.src=donecopy;
              this.refTimer.current.src=timerzero;
            }).catch((err)=>{this.refResultStatus.current.src=errorcopy;this.refTimer.current.src=timerzero;console.log(err)});
            
          }}>
          Try copy
        </Button>
      </div>
    );
  }
}

export class SidebarExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };
  constructor(props)
  {
    super(props);
    this.state={hotelCode:'',serviceURL:'',hotelIsPublished:true};
  }

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    const hotelCode=this.props.sdk.entry.fields['hotelCode'].getValue();
    const hotelHasDining=(this.props.sdk.entry.fields['dining'].getValue() !=null);
    const hotelHasFacility=(this.props.sdk.entry.fields['facilitiesAndServices'].getValue() !=null);
    const hotelHasPromos=(this.props.sdk.entry.fields['promotionsAndOffers'].getValue() !=null);
    const hotelIsDraft=this.props.sdk.entry.getSys().publishedAt===undefined;
    this.setState({hotelCode:hotelCode,serviceURL:this.props.sdk.parameters.instance.serviceForCopyURL,shouldDisable:!hotelIsDraft || hotelHasDining || hotelHasFacility || hotelHasPromos});
    // const fetchConfig={
    //   headers:{
    //       'SWG-Token': "fg365gs9sfdciy"
    //   }
    // };
    // fetch("https://xxxx",fetchConfig)
    // .then((res)=>res.json())
    // .then((rsp)=>{
    //   //console.log(rsp);
    //   this.setState({hotelCode:hotelCode,testParam:rsp.from});
    // },(error)=>{console.log(error)});
  }

  onButtonClick = async () => {
    const result = await this.props.sdk.dialogs.openExtension({
      width: 800,
      title: 'Copy Data for Hotel ' + this.state.hotelCode ,
      minHeight:200,
      parameters:{currentHotelCode:this.state.hotelCode,serviceURL:this.state.serviceURL}
    });
    console.log(result);
  };

  render() {
    return (
      <Button
        buttonType="positive"
        isFullWidth={true}
        testId="open-dialog"
        disabled={this.state.shouldDisable}
        onClick={this.onButtonClick}>
        Copy content from an existing hotel
      </Button>
    );
  }
}

export const initialize = sdk => {
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    ReactDOM.render(<DialogExtension sdk={sdk} />, document.getElementById('root'));
  } else {
    ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
  }
};

init(initialize);

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
