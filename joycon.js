const keymap = {
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
}

// NOTE: why the use of Object assign instead of spread? Edge does not play so nice with spread
// operator. This is before they have released their new version using chromium/blink engine
class Gamepad{
  constructor(uid, gamepadData){
    // gamepad reference
    this._gamepadReference = gamepadData;
    // gamepads unique id
    this.uid = uid
    // active state
    this.active = true
    // action callbacks
    this._actionCallbacks = {
      axes: {},
      pressed: {},
      touched: {},
      on:{},
      released: {}
    };
    // default threshold
    this._defaultAxisThresholds = {
      x: 0.3,
      y: 0.3,
    };
    // keymappings
    this._keymap = keymap
    // set class properties
    this._gamepadData = this._setNewData(gamepadData);
    this._prevGamepadData = {}
    // last rumble
    this._lastRumbleTimestamp = Date.now()
  }
  threshold(x, y){
    y = y || x
    this.thresholdX(x)
    this.thresholdY(y)
  }
  thresholdX(n){
    if(isNaN(n)){throw new Error('thresholdX requires a valid number');}
    this._defaultAxisThresholds.x = n
  }
  thresholdY(n){
    if(isNaN(n)){throw new Error('thresholdY requires a valid number');}
    this._defaultAxisThresholds.y = n
  }
  axis(axisName, fn){
    return this._bindButton('axes', axisName, fn)
  }
  on(buttonName, fn){
    return this._bindButton('on', buttonName, fn)
  }
  released(buttonName, fn){
    return this._bindButton('released', buttonName, fn)
  }
  touched(buttonName, fn){
    return this._bindButton('touched', buttonName, fn)
  }
  pressed(buttonName, fn){
    return this._bindButton('pressed', buttonName, fn)
  }
  _bindButton(callback, buttonName, fn){
    if(typeof fn !== 'function'){
      throw new Error('pressed requires callback to be of type "function"');
    }
    this._actionCallbacks[callback][buttonName] = fn;
    return this;
  }
  pause(){
    this.active = false;
  }
  resume(){
    this.active = true;
  }
  handleInputActions(prev){
    // axes
    for(let axis in this._gamepadData.axes){
      const ax = this._gamepadData.axes[axis]
      if(Math.abs(ax.x) > ax.thresholds.x){
        ax.direction.x = ax.x > 0 ? 1 : -1;
        ax.overThreshold = true;
      }else{
        ax.direction.x = 0;
      }

      if(Math.abs(ax.y) > ax.thresholds.y){
        ax.direction.y = ax.y > 0 ? 1 : -1;
        ax.overThreshold = true
      }else{
        ax.direction.y = 0;
      }

      // call the callback if something has changed
      if(ax.overThreshold){
        const callback = this._actionCallbacks.axes[axis];
        if(callback){
          const angle = Math.atan2(ax.y, ax.x);
          const degrees = (360+Math.round(180*angle/Math.PI))%360;
          const radians = degrees * Math.PI / 180;
          // apply
          ax.angle = angle;
          ax.degrees = degrees;
          ax.radians = radians;
          callback.call(this, ax);
        }
      }
    }

    // buttons
    for(let key in this._gamepadData.buttons){
      const b = this._gamepadData.buttons[key];
      // single press
      if(b.pressed){
        // hold down
        const callback = this._actionCallbacks.on[this._keymap[key]];
        if(callback){
          callback.call(this, b, this._gamepadData);
        }
        if(!this._prevGamepadData[key]){
          this._prevGamepadData[key] = b.pressed
          const callback = this._actionCallbacks.pressed[this._keymap[key]];
          if(callback){
            callback.call(this, b, this._gamepadData);
          }
        }
      // else check if the previous value was true only then call
      // the release function. since the callback should only fire once
    }else if(this._prevGamepadData[key]){
      this._prevGamepadData[key] = false
      // release callback
      const callback = this._actionCallbacks.released[this._keymap[key]];
      if(callback){
        callback.call(this, b, this._gamepadData);
      }
    }
      // is touched
      if(b.touched){
        const callback = this._actionCallbacks.touched[this._keymap[key]];
        if(callback){
          callback.call(this, b, this._gamepadData);
        }
      }
    }
  }
  rumble(type, data){
    data = Object.assign({
      startDelay: 0,
      duration: 500,
      weakMagnitude: 1.0,
      strongMagnitude: 1.0
    }, data);

    // NOTE: some notes about the rumble effect
    // I presume we can just check it like this here
    // also would it save battery or feel smoother if we only play rumble
    // after time for the duration + delay is past?
    if(this._gamepadReference.vibrationActuator && this._gamepadReference.vibrationActuator.playEffect && Math.abs(this._lastRumbleTimestamp - Date.now()) > data.duration + data.startDelay){
      this._lastRumbleTimestamp = Date.now()
      this._gamepadReference.vibrationActuator.playEffect(type, {
        startDelay: data.startDelay,
        duration: data.duration,
        weakMagnitude: data.weakMagnitude,
        strongMagnitude: data.strongMagnitude
      });
    }
  }
  get getKeymap(){
    return this._keymap
  }
  keymap(map){
    this._keymap = Object.assign(this._keymap, map)
  }
  updateData(gamepadData){
    // do not do anything if the gamepad is paused
    if(!this.active){
      return;
    }
    // reference so we eed to have something to compare to
    this._gamepadData = this._setNewData(gamepadData);
    // handle input events
    this.handleInputActions();
  }
  _setNewData(gamepadData){
    return {
      axes: {
        left_stick_axis: {
          thresholds: this._defaultAxisThresholds,
          x: gamepadData.axes[0],
          y: gamepadData.axes[1],
          radians: 0,
          degrees: 0,
          angle: 0,
          direction: {
            x: 0,
            y: 0
          },
          overThreshold: false
        },
        right_stick_axis: {
          thresholds: this._defaultAxisThresholds,
          radians: 0,
          degrees: 0,
          angle: 0,
          x: gamepadData.axes[2],
          y: gamepadData.axes[3],
          direction: {
            x: 0,
            y: 0
          },
          overThreshold: false
        },
      },
      buttons: gamepadData.buttons
    }
  }
}

/*
  gamepad wrapper
*/
class JoyconJS{
  constructor(gamepadCallbacks, options){
    // active
    this.active = true
    // options
    this._options = Object.assign({autorun: true}, options);
    // requestAnimationFrame
    this._internalPulling = null;
    // callbacks
    this._gamepadCallbacks = Object.assign({}, gamepadCallbacks);
    // connected devices
    this.devices = {};
    // listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => {
      this.devices[e.gamepad.index] = new Gamepad(e.gamepad.index, e.gamepad);
      if(typeof this._gamepadCallbacks.connected == 'function'){
        this._gamepadCallbacks.connected.call(this, this.devices[e.gamepad.index]);
      }
      if(!this._internalPulling && this._options.autorun == true){
        this._internalPull();
      }
    })
    // gamepad disconnected
    window.addEventListener('gamepaddisconnected', (e) => {
      delete this.devices[e.gamepad.index];
      if(typeof this._gamepadCallbacks.disconnected == 'function'){
        this._gamepadCallbacks.disconnected.call(this, this.devices[e.gamepad.index]);
      }
      if(Object.keys(this.devices).length < 1){
        this._clearAnimationFrame()
      }
    });
  }
  _clearAnimationFrame(){
    cancelAnimationFrame(this._internalPulling);
  }
  pause(){
    this.active = false;
    this._clearAnimationFrame()
  }
  resume(){
    this.active = true;
    if(this._internalPulling){
      this._internalPull()
    }
  }
  pull(){
    // pull gamepad data from navigator
    const gamepadList = navigator.getGamepads();
    // update devices
    for(let index = 0; index < gamepadList.length; index++){
      const device = gamepadList[index];
      if(device){
        if(device.index in this.devices){
          // update device data
          this.devices[device.index].updateData(device);
        }
      }
    }
  }
  _internalPull(){
    // simulate the gameloop
    const gameloop = (time) => {
      // pull device data
      this.pull();
      // loop
      this._internalPulling = requestAnimationFrame((time) => gameloop(time));
    }
    this._internalPulling = requestAnimationFrame((time) => gameloop(time));
  }
}

export default JoyconJS;
