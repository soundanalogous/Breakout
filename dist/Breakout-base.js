/***
	Breakout - 0.1.6

    Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
    Released under the MIT license. See LICENSE file for details.
	http.//breakoutjs.com
	***/
'use strict';var BO=BO||{},BREAKOUT=BREAKOUT||BO;BREAKOUT.VERSION="0.1.6";BO.enableDebugging=!1;var JSUTILS=JSUTILS||{};JSUTILS.namespace=function(a){var a=a.split("."),b=window,e;for(e=0;e<a.length;e+=1)"undefined"===typeof b[a[e]]&&(b[a[e]]={}),b=b[a[e]];return b};JSUTILS.inherit=function(a){function b(){}if(null==a)throw TypeError();if(Object.create)return Object.create(a);var e=typeof a;if("object"!==e&&"function"!==e)throw TypeError();b.prototype=a;return new b};
if(!Function.prototype.bind)Function.prototype.bind=function(a){if("function"!==typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var b=Array.prototype.slice.call(arguments,1),e=this,j=function(){},d=function(){return e.apply(this instanceof j?this:a||window,b.concat(Array.prototype.slice.call(arguments)))};j.prototype=this.prototype;d.prototype=new j;return d};JSUTILS.namespace("JSUTILS.Event");
JSUTILS.Event=function(){var a;a=function(a){this._type=a;this._target=null;this.name="Event"};a.prototype={get type(){return this._type},set type(a){this._type=a},get target(){return this._target},set target(a){this._target=a}};a.CONNECTED="connected";a.CHANGE="change";a.COMPLETE="complete";return a}();JSUTILS.namespace("JSUTILS.EventDispatcher");
JSUTILS.EventDispatcher=function(){var a;a=function(a){this._target=a||null;this._eventListeners={};this.name="EventDispatcher"};a.prototype={addEventListener:function(a,e){this._eventListeners[a]||(this._eventListeners[a]=[]);this._eventListeners[a].push(e)},removeEventListener:function(a,e){for(var j=0,d=this._eventListeners[a].length;j<d;j++)this._eventListeners[a][j]===e&&this._eventListeners[a].splice(j,1)},hasEventListener:function(a){return this._eventListeners[a]&&0<this._eventListeners[a].length?
!0:!1},dispatchEvent:function(a,e){a.target=this._target;var j=!1,d;for(d in e)a[d.toString()]=e[d];if(this.hasEventListener(a.type)){d=0;for(var c=this._eventListeners[a.type].length;d<c;d++)try{this._eventListeners[a.type][d].call(this,a),j=!0}catch(k){}}return j}};return a}();JSUTILS.namespace("JSUTILS.TimerEvent");
JSUTILS.TimerEvent=function(){var a,b=JSUTILS.Event;a=function(a){this.name="TimerEvent";b.call(this,a)};a.TIMER="timerTick";a.TIMER_COMPLETE="timerComplete";a.prototype=JSUTILS.inherit(b.prototype);return a.prototype.constructor=a}();JSUTILS.namespace("JSUTILS.Timer");
JSUTILS.Timer=function(){var a,b=JSUTILS.TimerEvent,e=JSUTILS.EventDispatcher;a=function(a,d){e.call(this,this);this.name="Timer";this._count=0;this._delay=a;this._repeatCount=d||0;this._isRunning=!1;this._timer=null};a.prototype=JSUTILS.inherit(e.prototype);a.prototype.constructor=a;a.prototype.__defineGetter__("delay",function(){return this._delay});a.prototype.__defineSetter__("delay",function(a){this._delay=a;this._isRunning&&(this.stop(),this.start())});a.prototype.__defineGetter__("repeatCount",
function(){return this._repeatCount});a.prototype.__defineSetter__("repeatCount",function(a){this._repeatCount=a;this._isRunning&&(this.stop(),this.start())});a.prototype.__defineGetter__("running",function(){return this._isRunning});a.prototype.__defineGetter__("currentCount",function(){return this._count});a.prototype.start=function(){if(null===this._timer)this._timer=setInterval(this.onTick.bind(this),this._delay),this._isRunning=!0};a.prototype.reset=function(){this.stop();this._count=0};a.prototype.stop=
function(){if(null!==this._timer)clearInterval(this._timer),this._timer=null,this._isRunning=!1};a.prototype.onTick=function(){this._count+=1;0!==this._repeatCount&&this._count>this._repeatCount?(this.stop(),this.dispatchEvent(new b(b.TIMER_COMPLETE))):this.dispatchEvent(new b(b.TIMER))};return a}();JSUTILS.namespace("BO.IOBoardEvent");
BO.IOBoardEvent=function(){var a,b=JSUTILS.Event;a=function(a){this.name="IOBoardEvent";b.call(this,a)};a.ANALOG_DATA="analogData";a.DIGITAL_DATA="digitalData";a.FIRMWARE_VERSION="firmwareVersion";a.FIRMWARE_NAME="firmwareName";a.STRING_MESSAGE="stringMessage";a.SYSEX_MESSAGE="sysexMessage";a.PIN_STATE_RESPONSE="pinStateResponse";a.READY="ioBoardReady";a.CONNECTED="ioBoardConnected";a.DISCONNECTED="ioBoardDisonnected";a.prototype=JSUTILS.inherit(b.prototype);return a.prototype.constructor=a}();JSUTILS.namespace("BO.WSocketEvent");
BO.WSocketEvent=function(){var a,b=JSUTILS.Event;a=function(a){this.name="WSocketEvent";b.call(this,a)};a.CONNECTED="webSocketConnected";a.MESSAGE="webSocketMessage";a.CLOSE="webSocketClosed";a.prototype=JSUTILS.inherit(b.prototype);return a.prototype.constructor=a}();JSUTILS.namespace("BO.WSocketWrapper");
BO.WSocketWrapper=function(){var a,b=JSUTILS.EventDispatcher,e=BO.WSocketEvent;a=function(a,e,c,k){this.name="WSocketWrapper";b.call(this,this);this._host=a;this._port=e;this._protocol=k||"default-protocol";this._useSocketIO=c||!1;this._socket=null;this._readyState="";this.init(this)};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.prototype.init=function(a){if(a._useSocketIO){a._socket=io.connect("http://"+a._host+":"+a._port);try{a._socket.on("connect",function(){a.dispatchEvent(new e(e.CONNECTED));
a._socket.on("message",function(c){a.dispatchEvent(new e(e.MESSAGE),{message:c})})})}catch(d){console.log("Error "+d)}}else try{if("MozWebSocket"in window)a._socket=new MozWebSocket("ws://"+a._host+":"+a._port,a._protocol);else if("WebSocket"in window)a._socket=new WebSocket("ws://"+a._host+":"+a._port);else throw console.log("Websockets not supported by this browser"),"Websockets not supported by this browser";a._socket.onopen=function(){a.dispatchEvent(new e(e.CONNECTED));a._socket.onmessage=function(c){a.dispatchEvent(new e(e.MESSAGE),
{message:c.data})};a._socket.onclose=function(){a._readyState=a._socket.readyState;a.dispatchEvent(new e(e.CLOSE))}}}catch(c){console.log("Error "+c)}};a.prototype.send=function(a){this.sendString(a)};a.prototype.sendString=function(a){this._socket.send(a.toString())};a.prototype.__defineGetter__("readyState",function(){return this._readyState});return a}();JSUTILS.namespace("BO.filters.FilterBase");
BO.filters.FilterBase=function(){var a;a=function(){throw Error("Can't instantiate abstract classes");};a.prototype.processSample=function(){throw Error("Filter objects must implement the method processSample");};return a}();JSUTILS.namespace("BO.filters.Scaler");
BO.filters.Scaler=function(){var a,b=BO.filters.FilterBase;a=function(e,b,d,c,k,o){this.name="Scaler";this._inMin=e||0;this._inMax=b||1;this._outMin=d||0;this._outMax=c||1;this._type=k||a.LINEAR;this._limiter=o||!0};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.prototype.processSample=function(a){var b=this._outMax-this._outMin,a=(a-this._inMin)/(this._inMax-this._inMin);this._limiter&&(a=Math.max(0,Math.min(1,a)));return b*this._type(a)+this._outMin};a.LINEAR=function(a){return a};
a.SQUARE=function(a){return a*a};a.SQUARE_ROOT=function(a){return Math.pow(a,0.5)};a.CUBE=function(a){return a*a*a*a};a.CUBE_ROOT=function(a){return Math.pow(a,0.25)};return a}();JSUTILS.namespace("BO.filters.Convolution");
BO.filters.Convolution=function(){var a,b=BO.filters.FilterBase;a=function(a){this.name="Convolution";this._buffer=[];this.coef=a};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.prototype.__defineGetter__("coef",function(){return this._coef});a.prototype.__defineSetter__("coef",function(a){this._coef=a;this._buffer=Array(this._coef.length);for(var a=this._buffer.length,b=0;b<a;b++)this._buffer[b]=0});a.prototype.processSample=function(a){this._buffer.unshift(a);this._buffer.pop();
for(var a=0,b=this._buffer.length,d=0;d<b;d++)a+=this._coef[d]*this._buffer[d];return a};a.LPF=[1/3,1/3,1/3];a.HPF=[1/3,-2/3,1/3];a.MOVING_AVERAGE=[0.125,0.125,0.125,0.125,0.125,0.125,0.125,0.125];return a}();JSUTILS.namespace("BO.filters.TriggerPoint");
BO.filters.TriggerPoint=function(){var a,b=BO.filters.FilterBase;a=function(a){this.name="TriggerPoint";this._points={};this._range=[];void 0===a&&(a=[[0.5,0]]);if(a[0]instanceof Array)for(var b=a.length,d=0;d<b;d++)this._points[a[d][0]]=a[d][1];else"number"===typeof a[0]&&(this._points[a[0]]=a[1]);this.updateRange();this._lastStatus=0};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.prototype.processSample=function(a){for(var b=this._lastStatus,d=this._range.length,c=0;c<d;c++){var k=
this._range[c];if(k[0]<=a&&a<=k[1]){b=c;break}}return this._lastStatus=b};a.prototype.addPoint=function(a,b){this._points[a]=b;this.updateRange()};a.prototype.removePoint=function(a){delete this._points[a];this.updateRange()};a.prototype.removeAllPoints=function(){this._points={};this.updateRange()};a.prototype.updateRange=function(){this._range=[];var a=this.getKeys(this._points),b=a[0];this._range.push([Number.NEGATIVE_INFINITY,b-this._points[b]]);for(var b=a.length-1,d=0;d<b;d++){var c=a[d],k=
a[d+1],c=1*c+this._points[c],k=k-this._points[k];if(c>=k)throw Error("The specified range overlaps...");this._range.push([c,k])}a=a[a.length-1];this._range.push([1*a+this._points[a],Number.POSITIVE_INFINITY])};a.prototype.getKeys=function(a){var b=[],d;for(d in a)b.push(d);return b.sort()};return a}();JSUTILS.namespace("BO.generators.GeneratorEvent");
BO.generators.GeneratorEvent=function(){var a,b=JSUTILS.Event;a=function(a){b.call(this,a);this.name="GeneratorEvent"};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.UPDATE="update";return a}();JSUTILS.namespace("BO.generators.GeneratorBase");
BO.generators.GeneratorBase=function(){var a,b=JSUTILS.EventDispatcher;a=function(){b.call(this,this);this.name="GeneratorBase"};a.prototype=JSUTILS.inherit(b.prototype);a.prototype.constructor=a;a.prototype.__defineGetter__("value",function(){return this._value});a.prototype.__defineSetter__("value",function(a){this._value=a});return a}();JSUTILS.namespace("BO.generators.Oscillator");
BO.generators.Oscillator=function(){var a,b=BO.generators.GeneratorBase,e=BO.generators.GeneratorEvent,j=JSUTILS.Timer,d=JSUTILS.TimerEvent;a=function(c,d,e,t,C,l){b.call(this);this.name="Oscillator";this._wave=c||a.SIN;this._freq=d||1;this._amplitude=e||1;this._offset=t||0;this._phase=C||0;this._times=l||0;if(0===d)throw Error("Frequency should be larger than 0");this._autoUpdateCallback=this.autoUpdate.bind(this);this._timer=new j(33);this._timer.start();this.reset()};a.prototype=JSUTILS.inherit(b.prototype);
a.prototype.constructor=a;a.prototype.__defineSetter__("serviceInterval",function(a){this._timer.delay=a});a.prototype.__defineGetter__("serviceInterval",function(){return this._timer.delay});a.prototype.start=function(){this.stop();this._timer.addEventListener(d.TIMER,this._autoUpdateCallback);this._startTime=(new Date).getTime();this.autoUpdate(null)};a.prototype.stop=function(){this._timer.hasEventListener(d.TIMER)&&this._timer.removeEventListener(d.TIMER,this._autoUpdateCallback)};a.prototype.reset=
function(){this._time=0;this._lastVal=0.999};a.prototype.update=function(a){a=a||-1;this._time=0>a?this._time+this._timer.delay:this._time+a;this.computeValue()};a.prototype.autoUpdate=function(){this._time=(new Date).getTime()-this._startTime;this.computeValue()};a.prototype.computeValue=function(){var d=this._time/1E3;0!==this._times&&this._freq*d>=this._times?(this.stop(),this._value=this._wave!==a.LINEAR?this._offset:this._amplitude*this._wave(1,0)+this._offset):(d=this._freq*(d+this._phase),
this._value=this._amplitude*this._wave(d,this._lastVal)+this._offset,this._lastVal=d);this.dispatchEvent(new e(e.UPDATE))};a.SIN=function(a){return 0.5*(1+Math.sin(2*Math.PI*(a-0.25)))};a.SQUARE=function(a){return 0.5>=a%1?1:0};a.TRIANGLE=function(a){a%=1;return 0.5>=a?2*a:2-2*a};a.SAW=function(a){a%=1;return 0.5>=a?a+0.5:a-0.5};a.IMPULSE=function(a,d){return a%1<d%1?1:0};a.LINEAR=function(a){return 1>a?a:1};return a}();JSUTILS.namespace("BO.PinEvent");
BO.PinEvent=function(){var a,b=JSUTILS.Event;a=function(a){this.name="PinEvent";b.call(this,a)};a.CHANGE="pinChange";a.RISING_EDGE="risingEdge";a.FALLING_EDGE="fallingEdge";a.prototype=JSUTILS.inherit(b.prototype);return a.prototype.constructor=a}();JSUTILS.namespace("BO.Pin");
BO.Pin=function(){var a,b=JSUTILS.EventDispatcher,e=BO.PinEvent,j=BO.generators.GeneratorEvent;a=function(a,c){this.name="Pin";this._type=c;this._number=a;this._analogNumber=void 0;this._maxPWMValue=255;this._value=0;this._lastValue=-1;this._average=0;this._minimum=Math.pow(2,16);this._numSamples=this._sum=this._maximum=0;this._generator=this._filters=null;this._autoSetValueCallback=this.autoSetValue.bind(this);this._evtDispatcher=new b(this)};a.prototype={setAnalogNumber:function(a){this._analogNumber=
a},get analogNumber(){return this._analogNumber},get number(){return this._number},setMaxPWMValue:function(){this._maxPWMValue=value},get maxPWMValue(){return this._maxPWMValue},get average(){return this._average},get minimum(){return this._minimum},get maximum(){return this._maximum},get value(){return this._value},set value(a){this._lastValue=this._value;this._preFilterValue=a;this._value=this.applyFilters(a);this.calculateMinMaxAndMean(this._value);this.detectChange(this._lastValue,this._value)},
get lastValue(){return this._lastValue},get preFilterValue(){return this._preFilterValue},get filters(){return this._filters},set filters(a){this._filters=a},get generator(){return this._generator},getType:function(){return this._type},setType:function(d){if(0<=d&&d<a.TOTAL_PIN_MODES)this._type=d},getCapabilities:function(){return this._capabilities},setCapabilities:function(a){this._capabilities=a},detectChange:function(a,c){a!==c&&(this.dispatchEvent(new e(e.CHANGE)),0>=a&&0!==c?this.dispatchEvent(new e(e.RISING_EDGE)):
0!==a&&0>=c&&this.dispatchEvent(new e(e.FALLING_EDGE)))},clearWeight:function(){this._sum=this._average;this._numSamples=1},calculateMinMaxAndMean:function(a){var c=Number.MAX_VALUE;this._minimum=Math.min(a,this._minimum);this._maximum=Math.max(a,this._maximum);this._sum+=a;this._average=this._sum/++this._numSamples;this._numSamples>=c&&this.clearWeight()},clear:function(){this._minimum=this._maximum=this._average=this._lastValue=this._preFilterValue;this.clearWeight()},addFilter:function(a){if(null!==
a){if(null===this._filters)this._filters=[];this._filters.push(a)}},addGenerator:function(a){this.removeGenerator();this._generator=a;this._generator.addEventListener(j.UPDATE,this._autoSetValueCallback)},removeGenerator:function(){null!==this._generator&&this._generator.removeEventListener(j.UPDATE,this._autoSetValueCallback);this._generator=null},removeAllFilters:function(){this._filters=null},autoSetValue:function(){this.value=this._generator.value},applyFilters:function(a){if(null===this._filters)return a;
for(var c=this._filters.length,b=0;b<c;b++)a=this._filters[b].processSample(a);return a},addEventListener:function(a,b){this._evtDispatcher.addEventListener(a,b)},removeEventListener:function(a,b){this._evtDispatcher.removeEventListener(a,b)},hasEventListener:function(a){return this._evtDispatcher.hasEventListener(a)},dispatchEvent:function(a,b){return this._evtDispatcher.dispatchEvent(a,b)}};a.HIGH=1;a.LOW=0;a.ON=1;a.OFF=0;a.DIN=0;a.DOUT=1;a.AIN=2;a.AOUT=3;a.PWM=3;a.SERVO=4;a.SHIFT=5;a.I2C=6;a.TOTAL_PIN_MODES=
7;return a}();JSUTILS.namespace("BO.I2CBase");
BO.I2CBase=function(){var a,b=BO.Pin,e=JSUTILS.EventDispatcher,j=BO.IOBoardEvent;a=function(d,c,k){if(void 0!=d){this.name="I2CBase";this.board=d;var o=k||0,k=o&255,o=o>>8&255;this._address=c;this._evtDispatcher=new e(this);c=d.getI2cPins();2==c.length?(d.getPin(c[0]).getType()!=b.I2C&&(d.getPin(c[0]).setType(b.I2C),d.getPin(c[1]).setType(b.I2C)),d.addEventListener(j.SYSEX_MESSAGE,this.onSysExMessage.bind(this)),d.sendSysex(a.I2C_CONFIG,[k,o])):console.log("Error, this board does not support i2c")}};a.prototype=
{get address(){return this._address},onSysExMessage:function(b){var b=b.message,c=this.board.getValueFromTwo7bitBytes(b[1],b[2]),e=[];if(b[0]==a.I2C_REPLY&&c==this._address){for(var c=3,j=b.length;c<j;c+=2)e.push(this.board.getValueFromTwo7bitBytes(b[c],b[c+1]));this.handleI2C(e)}},sendI2CRequest:function(b){var c=[],e=b[0];c[0]=b[1];c[1]=e<<3;for(var e=2,j=b.length;e<j;e++)c.push(b[e]&127),c.push(b[e]>>7&127);this.board.sendSysex(a.I2C_REQUEST,c)},update:function(){},handleI2C:function(){},addEventListener:function(a,
b){this._evtDispatcher.addEventListener(a,b)},removeEventListener:function(a,b){this._evtDispatcher.removeEventListener(a,b)},hasEventListener:function(a){return this._evtDispatcher.hasEventListener(a)},dispatchEvent:function(a,b){return this._evtDispatcher.dispatchEvent(a,b)}};a.I2C_REQUEST=118;a.I2C_REPLY=119;a.I2C_CONFIG=120;a.WRITE=0;a.READ=1;a.READ_CONTINUOUS=2;a.STOP_READING=3;return a}();JSUTILS.namespace("BO.PhysicalInputBase");
BO.PhysicalInputBase=function(){var a,b=JSUTILS.EventDispatcher;a=function(){this.name="PhysicalInputBase";this._evtDispatcher=new b(this)};a.prototype={addEventListener:function(a,b){this._evtDispatcher.addEventListener(a,b)},removeEventListener:function(a,b){this._evtDispatcher.removeEventListener(a,b)},hasEventListener:function(a){return this._evtDispatcher.hasEventListener(a)},dispatchEvent:function(a,b){return this._evtDispatcher.dispatchEvent(a,b)}};return a}();JSUTILS.namespace("BO.IOBoard");
BO.IOBoard=function(){var a=224,b=240,e=247,j=111,d=107,c=BO.Pin,k=JSUTILS.EventDispatcher,o=BO.PinEvent,t=BO.WSocketEvent,C=BO.WSocketWrapper,l=BO.IOBoardEvent;return function(Q,y,E,R){function F(a){i.removeEventListener(l.FIRMWARE_NAME,F);var S=10*a.version;q("debug: Firmware name = "+a.name+"\t, Firmware version = "+a.version);23<=S?i.send([b,d,e]):console.log("error: You must upload StandardFirmata version 2.3 or greater from Arduino version 1.0 or higher")}function G(){q("debug: IOBoard ready");
H=!0;i.dispatchEvent(new l(l.READY));i.enableDigitalPins()}function I(a){a=a.substring(0,1);return a.charCodeAt(0)}function J(a){var b=a.target.getType(),g=a.target.number,a=a.target.value;switch(b){case c.DOUT:K(g,a);break;case c.AOUT:L(g,a);break;case c.SERVO:b=i.getDigitalPin(g),b.getType()==c.SERVO&&b.lastValue!=a&&L(g,a)}}function z(a){if(a.getType()==c.DOUT||a.getType()==c.AOUT||a.getType()==c.SERVO)a.hasEventListener(o.CHANGE)||a.addEventListener(o.CHANGE,J);else if(a.hasEventListener(o.CHANGE))try{a.removeEventListener(o.CHANGE,
J)}catch(b){q("debug: Caught pin removeEventListener exception")}}function L(h,c){var g=i.getDigitalPin(h).maxPWMValue,c=c*g,c=0>c?0:c,c=c>g?g:c;if(15<h||c>Math.pow(2,14)){var g=c,f=[];if(g>Math.pow(2,16))throw console.log("error: Extended Analog values > 16 bits are not currently supported by StandardFirmata"),"error: Extended Analog values > 16 bits are not currently supported by StandardFirmata";f[0]=b;f[1]=j;f[2]=h;f[3]=g&127;f[4]=g>>7&127;g>=Math.pow(2,14)&&(f[5]=g>>14&127);f.push(e);i.send(f)}else i.send([a|
h&15,c&127,c>>7&127])}function K(a,b){var g=Math.floor(a/8);if(b==c.HIGH)s[g]|=b<<a%8;else if(b==c.LOW)s[g]&=~(1<<a%8);else{console.log("warning: Invalid value passed to sendDigital, value must be 0 or 1.");return}i.sendDigitalPort(g,s[g])}function q(a){T&&console.log(a)}this.name="IOBoard";var i=this,r,n=[],s=[],u,D=[],M=[],N=[],p=[],v=0,O=19,H=!1,A="",w=0,x,P=!1,B=!1,T=BO.enableDebugging;x=new k(this);!E&&"number"===typeof y&&(y+="/websocket");r=new C(Q,y,E,R);r.addEventListener(t.CONNECTED,function(){q("debug: Socket Status: (open)");
i.dispatchEvent(new l(l.CONNECTED));i.addEventListener(l.FIRMWARE_NAME,F);i.reportFirmware()});r.addEventListener(t.MESSAGE,function(h){var d="";if(h.message.match(/config/))d=h.message.substr(h.message.indexOf(":")+2),"multiClient"===d&&(q("debug: Multi-client mode enabled"),P=!0);else if(h=h.message,h*=1,n.push(h),d=n.length,128<=n[0]&&n[0]!=b){if(3===d){var g=n,h=g[0],f;240>h&&(h&=240,f=g[0]&15);switch(h){case 144:var m=8*f;f=m+8;g=g[1]|g[2]<<7;h={};f>=v&&(f=v);for(var d=0,j=m;j<f;j++){h=i.getDigitalPin(j);
if(void 0==h)break;if(h.getType()==c.DIN&&(m=g>>d&1,m!=h.value))h.value=m,i.dispatchEvent(new l(l.DIGITAL_DATA),{pin:h});d++}break;case 249:w=g[1]+g[2]/10;i.dispatchEvent(new l(l.FIRMWARE_VERSION),{version:w});break;case a:if(h=g[1],g=g[2],f=i.getAnalogPin(f),void 0!==f)f.value=i.getValueFromTwo7bitBytes(h,g)/1023,f.value!=f.lastValue&&i.dispatchEvent(new l(l.ANALOG_DATA),{pin:f})}n=[]}}else if(n[0]===b&&n[d-1]===e){f=n;f.shift();f.pop();switch(f[0]){case 121:for(h=3;h<f.length;h+=2)g=String.fromCharCode(f[h]),
g+=String.fromCharCode(f[h+1]),A+=g;w=f[1]+f[2]/10;i.dispatchEvent(new l(l.FIRMWARE_NAME),{name:A,version:w});break;case 113:g="";d=f.length;for(m=1;m<d;m+=2)h=String.fromCharCode(f[m]),h+=String.fromCharCode(f[m+1]),g+=h.charAt(0);i.dispatchEvent(new l(l.STRING_MESSAGE),{message:g});break;case 108:if(!B){for(var h={},d=1,m=g=0,j=f.length,k;d<=j;)if(127==f[d]){M[g]=g;k=void 0;if(h[c.DOUT])k=c.DOUT;if(h[c.AIN])k=c.AIN,D[m++]=g;k=new c(g,k);k.setCapabilities(h);z(k);p[g]=k;k.getCapabilities()[c.I2C]&&
N.push(k.number);h={};g++;d++}else h[f[d]]=f[d+1],d+=2;u=Math.ceil(g/8);q("debug: Num ports = "+u);for(f=0;f<u;f++)s[f]=0;v=g;q("debug: Num pins = "+v);i.send([b,105,e])}break;case 110:if(!B){h=f.length;d=f[2];m=p[f[1]];4<h?g=i.getValueFromTwo7bitBytes(f[3],f[4]):3<h&&(g=f[3]);m.getType()!=d&&(m.setType(d),z(m));if(m.value!=g)m.value=g;i.dispatchEvent(new l(l.PIN_STATE_RESPONSE),{pin:m})}break;case 106:if(!B){g=f.length;for(h=1;h<g;h++)127!=f[h]&&(D[f[h]]=h-1,i.getPin(h-1).setAnalogNumber(f[h]));
if(P){for(f=0;f<i.getPinCount();f++)g=i.getDigitalPin(f),i.send([b,109,g.number,e]);setTimeout(G,500);B=!0}else q("debug: System reset"),i.send(255),setTimeout(G,500)}break;default:i.dispatchEvent(new l(l.SYSEX_MESSAGE),{message:f})}n=[]}else 128<=h&&128>n[0]&&(console.log("warning: Malformed input data... resetting buffer"),n=[],h!==e&&n.push(h))});r.addEventListener(t.CLOSE,function(){q("debug: Socket Status: "+r.readyState+" (Closed)");i.dispatchEvent(new l(l.DISCONNECTED))});this.__defineGetter__("samplingInterval",
function(){return O});this.__defineSetter__("samplingInterval",function(a){10<=a&&100>=a?(O=a,i.send([b,122,a&127,a>>7&127,e])):console.log("warning: Sampling interval must be between 10 and 100")});this.__defineGetter__("isReady",function(){return H});this.getValueFromTwo7bitBytes=function(a,b){return b<<7|a};this.getSocket=function(){return r};this.reportVersion=function(){i.send(249)};this.reportFirmware=function(){i.send([b,121,e])};this.disableDigitalPins=function(){for(var a=0;a<u;a++)i.sendDigitalPortReporting(a,
c.OFF)};this.enableDigitalPins=function(){for(var a=0;a<u;a++)i.sendDigitalPortReporting(a,c.ON)};this.sendDigitalPortReporting=function(a,b){i.send([208|a,b])};this.enableAnalogPin=function(a){i.send([192|a,c.ON]);i.getAnalogPin(a).setType(c.AIN)};this.disableAnalogPin=function(a){i.send([192|a,c.OFF]);i.getAnalogPin(a).setType(c.AIN)};this.setDigitalPinMode=function(a,b){i.getDigitalPin(a).setType(b);z(i.getDigitalPin(a));i.send([244,a,b])};this.enablePullUp=function(a){K(a,c.HIGH)};this.getFirmwareName=
function(){return A};this.getFirmwareVersion=function(){return w};this.getPinCapabilities=function(){for(var a=[],b={"0":"input",1:"output",2:"analog",3:"pwm",4:"servo",5:"shift",6:"i2c"},c=0;c<p.length;c++){var d=[],e=0,i;for(i in p[c].getCapabilities()){var j=[];0<=i&&(j[0]=b[i],j[1]=p[c].getCapabilities()[i]);d[e]=j;e++}a[c]=d}return a};this.sendDigitalPort=function(a,b){i.send([144|a&15,b&127,b>>7])};this.sendString=function(a){for(var b=[],c=0,d=a.length;c<d;c++)b.push(I(a[c])&127),b.push(I(a[c])>>
7&127);this.sendSysex(113,b)};this.sendSysex=function(a,c){var d=[];d[0]=b;d[1]=a;for(var f=0,j=c.length;f<j;f++)d.push(c[f]);d.push(e);i.send(d)};this.sendServoAttach=function(a,d,g){var f=[],d=d||544,g=g||2400;f[0]=b;f[1]=112;f[2]=a;f[3]=d%128;f[4]=d>>7;f[5]=g%128;f[6]=g>>7;f[7]=e;i.send(f);a=i.getDigitalPin(a);a.setType(c.SERVO);z(a)};this.getPin=function(a){return p[a]};this.getAnalogPin=function(a){return p[D[a]]};this.getDigitalPin=function(a){return p[M[a]]};this.analogToDigital=function(a){return i.getAnalogPin(a).number};
this.getPinCount=function(){return v};this.getI2cPins=function(){return N};this.reportCapabilities=function(){for(var a={"0":"input",1:"output",2:"analog",3:"pwm",4:"servo",5:"shift",6:"i2c"},b=0;b<p.length;b++)for(var c in p[b].getCapabilities())console.log("Pin "+b+"\tMode: "+a[c]+"\tResolution (# of bits): "+p[b].getCapabilities()[c])};this.send=function(a){r.sendString(a)};this.close=function(){r.close()};this.addEventListener=function(a,b){x.addEventListener(a,b)};this.removeEventListener=function(a,
b){x.removeEventListener(a,b)};this.hasEventListener=function(a){return x.hasEventListener(a)};this.dispatchEvent=function(a,b){return x.dispatchEvent(a,b)}}}();
