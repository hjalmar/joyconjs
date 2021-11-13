const buttonmap = {
  0: 'button_1',
  1: 'button_2',
  2: 'button_3',
  3: 'button_4',
  4: 'left_shoulder_button',
  5: 'right_shoulder_button',
  6: 'left_trigger',
  7: 'right_trigger',
  8: 'options',
  9: 'start',
  10: 'left_axis_button',
  11: 'right_axis_button',
  12: 'd_pad_up',
  13: 'd_pad_down',
  14: 'd_pad_left',
  15: 'd_pad_right',
  16: 'vendor',
};

const axesmap = {
  0: 'left_stick_axis',
  1: 'right_stick_axis',
};

class Button{
  constructor(key){
    this.key = key;
    this.threshold = 0;
    this.callbacks = new Map([
      ['axis', null],
      ['on', null],
      ['pressed', null],
      ['released', null],
      ['touched', null],
      ['untouched', null]
    ]);
    this.previousState = {};
    this.state = {};
    this.passedThreshold = false;
  }
  bindCallback(type, fn){
    this.callbacks.set(type, fn);
  }
  updateState(state){
    this.previousState = { ...this.state };
    if(this.state.value >= this.threshold){
      this.passedThreshold = true;
    }
    this.state = { ...state, key: this.key, threshold: this.threshold };
  }
  __getCallback(type){
    const callback = this.callbacks.get(type);
    if(typeof callback == 'function'){
      return callback; 
    }
  }
  on(){
    if(this.state.pressed){
      const callback = this.__getCallback('on'); 
      if(callback && this.passedThreshold){
        callback.call(null, { ...this.state });
      }
    }
  }
  pressed(){
    if(this.state.pressed && !this.previousState.pressed){
      const callback = this.__getCallback('pressed'); 
      if(callback){
        callback.call(null, { ...this.state });
      }
    }
  }
  released(){
    if(this.passedThreshold && !this.state.pressed && this.previousState.pressed){
      this.passedThreshold = false;
      const callback = this.__getCallback('released');
      if(callback){
        callback.call(null, { ...this.state });
      }
    }
  }
  touched(){
    if(this.state.touched && !this.previousState.touched){
      const callback = this.__getCallback('touched'); 
      if(callback){
        callback.call(null, { ...this.state });
      }
    }
  }
  untouched(){
    if(!this.state.touched && this.previousState.touched){
      const callback = this.__getCallback('untouched');
      if(callback){
        callback.call(null, { ...this.state });
      }
    }
  }
}

class Axis{
  constructor(key, callback){
    this.key = key;
    this.thresholds = { x: 0, y: 0 };
    this.callback = callback;
  }
  on({ x, y }){
    const state = {
      key: this.key,
      direction: { x: 0, y: 0 },
      x,
      y,
      thresholds: { ...this.thresholds },
      angle: 0,
      degrees: 0,
      radians: 0,
      overThreshold: { x: false, y: false }
    }
    
    if(Math.abs(x) >= this.thresholds.x){
      state.direction.x = x > 0 ? 1 : -1;
      state.overThreshold.x = true;
    }
    
    if(Math.abs(y) >= this.thresholds.y){
      state.direction.y = y > 0 ? 1 : -1;
      state.overThreshold.y = true;
    }
    
    if(state.overThreshold.x || state.overThreshold.y){
      const angle = Math.atan2(y, x);
      const degrees = (360+Math.round(180*angle/Math.PI))%360;
      const radians = degrees * Math.PI / 180;
      state.angle = angle;
      state.degrees = degrees;
      state.radians = radians;
      this.callback.call(null, state);
    }
  }
}

class Gamepad{
  constructor(uid){
    this.uid = uid;
    this.state = navigator.getGamepads()[uid];
    this.__axesCallbacks = new Map();
    this.__buttonCallbacks = new Map();
    this.__event;
    this.__buttonmap = new Map();
    this.__axesmap = new Map();
    this.__identify;
    this.buttons(buttonmap);
    this.axes(axesmap);
  }
  get getButtonMap(){
    return Object.freeze(Array.from(this.__buttonmap));
  }
  get getAxesMap(){
    return Object.freeze(Array.from(this.__axesmap));
  }
  __mergeMappings(customMapping, target, clear){
    const keybinds = Object.entries(Object.assign({}, customMapping));
    if(clear) {
      target.clear();
    }
    const bindKey = (key, value) => {
      if(target.has(key)){
        throw new Error(`Trying to bind a duplicated value. '${key}' has already been defined`);
      }
      target.set(key, Number(value));
    };
    keybinds.forEach(([ value, key ]) => {
      if(Array.isArray(key)) {
        for(const _key of key) {
          bindKey(_key, value);
        }
      }else{
        bindKey(key, value);
      }
    });
  }
  identify(fn) {
    this.__identify = fn;
  }
  clearButtons(){
    this.__buttonmap.clear();
  }
  clearAxes(){
    this.__axesmap.clear();
  }
  buttons(customMapping = {}, clear){
    this.__mergeMappings(customMapping, this.__buttonmap, clear);
  }
  axes(customMapping = {}, clear){
    this.__mergeMappings(customMapping, this.__axesmap, clear);
  }
  __bind(type, key, fn, applyThreshold){
    if(typeof fn !== 'function'){
      throw new Error(`Invalid '${type}' callback function for '${key}'`);
    }
    
    key = Array.isArray(key) ? key : [key]; 
    key.forEach((_key) => {
      if(!this.__buttonCallbacks.has(_key)){
        this.__buttonCallbacks.set(_key, new Button(_key));
      }
      this.__buttonCallbacks.get(_key).bindCallback(type, fn);
    });

    const threshold = (value) => {
      key.forEach((_key) => {
        if(this.__buttonCallbacks.has(_key)){
          if(!isNaN(value)){
            this.__buttonCallbacks.get(_key).threshold = Math.min(1, Math.max(0, value));
          }
        }
      });     
    }
    if(!applyThreshold) return;  
    return { threshold };
  }
  rumble(data){
    data = Object.assign({
      startDelay: 0,
      duration: 500,
      weakMagnitude: 1.0,
      strongMagnitude: 1.0
    }, data);

    if(this.state.vibrationActuator && this.state.vibrationActuator.playEffect){
      this.state.vibrationActuator.playEffect(this.state.vibrationActuator.type, data);
    }
  }
  axis(key, fn){
    if(typeof fn !== 'function'){
      throw new Error(`Invalid '${type}' callback function for '${key}'`);
    }
    
    key = Array.isArray(key) ? key : [key]; 
    key.forEach((_key) => {
      if(!this.__axesCallbacks.has(_key)){
        this.__axesCallbacks.set(_key, new Axis(_key, fn));
      }
    });
    const threshold = (x, y) => {
      if(isNaN(x)) return;

      key.forEach((_key) => {
        if(this.__axesCallbacks.has(_key)){
          if(isNaN(y)) {
            if(Array.isArray(x)) {
              [ x, y ] = x;
            }else{
              y = x;
            }
          }
          if(!isNaN(x) && !isNaN(y)){
            this.__axesCallbacks.get(_key).thresholds = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
          }
        }
      });
    }

    return { threshold };
  }
  pressed(key, fn){
    return this.__bind('pressed', key, fn, true);
  }
  touched(key, fn){
    return this.__bind('touched', key, fn, true);
  }
  untouched(key, fn){
    return this.__bind('untouched', key, fn);
  }
  on(key, fn){
    return this.__bind('on', key, fn, true);
  }
  released(key, fn){
    return this.__bind('released', key, fn);
  }
  pull(){
    this.state = navigator.getGamepads()[this.uid];
    if(!this.state) return;

    if(this.__identify) {
      const active = this.state.buttons.map((button, key) => ({ key, button, uid: this.uid })).filter(({ button }) => button.pressed);
      if(active.length) {
        this.__identify.call(null, active);
      }
    }

    // handle axes
    for(const [ key, axis ] of this.__axesCallbacks){
      const axesId = this.__axesmap.get(key);
      if(Number.isInteger(axesId)){
        axis.on.call(axis, { x: this.state.axes[axesId * 2], y: this.state.axes[(axesId * 2) + 1] });
      }
    }

    // handle buttons
    for(const [ key, button ] of this.__buttonCallbacks){
      if(button){
        const buttonId = this.__buttonmap.get(button.key);
        const buttonState =  this.state.buttons[buttonId];
        if(Number.isInteger(buttonId) && buttonState){
          const { pressed, touched, value } = buttonState;
          button.updateState({ pressed: pressed && button.threshold <= value, touched: touched && button.threshold <= value, value });
          const callbacks = Array.from(button.callbacks).filter(([ type, callback ]) => callback);
          callbacks.forEach(([ type ]) => {
            if(button[type]){
              button[type].call(button);
            }
          });
        }
      }
    }
  }

  help(){
    console.log('%c JoyconJS ', 'background-color: darkslateblue ; color: white;');
    console.log('A browser javascript gamepad API library');
    console.log('https://www.npmjs.com/package/joyconjs');
    console.log('');
    console.log('%c Current mappings ', 'background-color: darkslateblue ; color: white;');
    console.log(`%c ${this.state.id}`, 'color: mediumspringgreen;');
    console.table(Array.from(this.__buttonmap.entries()));
    console.table(Array.from(this.__axesmap.entries()));
  }
}

export default class JoyconJS{
  constructor(callbacks, options){
    this.animationFrameId = 0;
    this.__callbacks = {
      connected: _ => _,
      disconnected: _ => _,
    }
    Object.assign(this.__callbacks, callbacks);

    this.options = {};
    Object.assign(this.options, options);

    this.devices = new Map();

    this.connected = (e) => {
      this.devices.set(e.gamepad.index, new Gamepad(e.gamepad.index));
      if(typeof this.__callbacks.connected == 'function'){
        this.__callbacks.connected.call(this, this.devices.get(e.gamepad.index));
      }
    }

    this.disconnected = (e) => {
      if(typeof this.__callbacks.disconnected == 'function'){
        this.__callbacks.disconnected.call(this, this.devices.get(e.gamepad.index));
      }
      this.devices.delete(e.gamepad.index);
    }

    window.addEventListener('gamepadconnected', this.connected);
    window.addEventListener('gamepaddisconnected', this.disconnected);
  }

  pull(){
    this.devices.forEach((device) => device.pull());
  }

  listen(){
    if(this.animationFrameId) return;
    const loop = (time) => {
      this.pull();
      this.animationFrameId = requestAnimationFrame(loop);
    }
    this.animationFrameId = requestAnimationFrame(loop);
  }

  destroy(){
    this.devices.clear();
    window.removeEventListener('gamepadconnected', this.connected);
    window.removeEventListener('gamepaddisconnected', this.disconnected);
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = 0;
  }
}