# JoyconJS

##### Install
`
npm i joyconjs
`

### Initialize
```js
// import library
import JoyconJS from 'joyconjs'

// available options
// these are the default values
// and are not required to be provided
const options = {
  autorun: true,
};
/*
  initialize Joycon wrapper
  @param (Object) object consisting of connected and disconnected callbacks which returns the gamepad instance
*/
const joycon = new JoyconJS({
  connected: (gamepad) => {},
  disconnected: (gamepad) => {}
// options can be omitted unless non-default
// values needs to be provided
}, options);
```

#### JoyconJS instance
* **joycon.pause()** - *Clears the internal animationframe if autorun is true*
* **joycon.resume()** - *Restarts the animationframe loop*

## External loop
Autorun runs it's own requestAnimationFrame loop that pull the gamepad states. To handle that in your own gameloop set autorun to false and pull new data with
```js
// pull new data
joycon.pull()
```

## Gamepad instance
* **gamepad.threshold(*Number: n*)** - *Modify gamepads x and y axis thresholds with a number between 0 and 1*
* **gamepad.threshold(*Number: x, Number: y*)** - *Modify gamepads x and y axis thresholds with a number between 0 and 1*
* **gamepad.thresholdX(*Number: x*)** - *Modify gamepads x axis thresholds with a number between 0 and 1*
* **gamepad.thresholdY(*Number: y*)** - *Modify gamepads y axis thresholds with a number between 0 and 1*
* **gamepad.keymap(*Object: keymap*)** - *Define a new keymap for the gamepad instance*
* **gamepad.pause()** - *Pause the gamepad from reading new events*
* **gamepad.resume()** - *Resume gamepad from a paused state*
* **gamepad.rumble(String: Type, Object: {properties})** - *Rumble/vibrate gamepad on suported devices and browser*

#### Set threshold
```js
//...
const joycon = new JoyconJS({
  connected: (gamepad) => {
    // set both x and y threshold.
    // A number of .5 would equal 50%
    gamepad.threshold(.5)
  }
})
```

#### Pause/Resume
```js
//...
const joycon = new JoyconJS({
  connected: (gamepad) => {
    gamepad.pause();
    gamepad.resume();
  }
})
```

#### Rumble/vibration
```js
//...
const joycon = new JoyconJS({
  connected: (gamepad) => {
    gamepad.rumble('dual-rumble', {
      // defaults options below
      startDelay: 0,
      duration: 500,
      weakMagnitude: 1.0,
      strongMagnitude: 1.0
    })
  }
})
```

#### keymap
The default schema might not be suitable for your gamepad. You can provide your own map which consist of a key/value pair list.
```js
// note that you don't need to provide a full list.
// only the listed buttons will be replaced
const customKeymap = {
  0: 'button_2',
  1: 'button_4',
  2: 'button_1',
  3: 'button_3'
}
// on the gamepad instance
gamepad.keymap(keymap);
```

## Events
Gamepad instance comes with some callback events which will help you implement
behaviour in your application
```js
// available events
gamepad.pressed('valid_button_name', callbackFunction);
gamepad.on('valid_button_name', callbackFunction);
gamepad.touched('valid_button_name', callbackFunction);
gamepad.released('valid_button_name', callbackFunction);
gamepad.axis('valid_axis_name', callbackFunction);
```

* **gamepad.pressed(*String*: button_name, Function: callback)** - *single press, will only fire once*
* **gamepad.on(*String*: button_name, Function: callback)** - *will continiously fire while hold down*
* **gamepad.touched(*String*: button_name, Function: callback)** - *presume some gamepads have touch, will continiously fire. No single touch implemented at this moment*
* **gamepad.released(*String*: button_name, Function: callback)** - *when button released. will not fire for axis*
* **gamepad.axis(*String*: button_name, Function: callback)** - *will fire when axis goes over threshold limits*
* **gamepad.getKeymap** - *returns the current keymap*

#### callback data
Button callback data
```js
// button data
gamepad.pressed('button_1', (data, gamepadState) => {
  // data.pressed : Boolean
  // data.touched : Boolean
  // data.value : Number (value between 0 - 1)

  // gamepadState consist of the state when this callback was called
});
```

Axis callback data
```js
// axis data
gamepad.axis('left_stick_axis', (data, gamepadState) => {
  // data.angle: Number (0 - PI)
  // data.degrees: Number (0 - 359)
  // data.radians: Number (0 - TWO_PI)
  // data.direction: {x: Number (-1, 0, 1), y: Number (-1, 0, 1)}
  // data.overThreshold: Boolean (always true, used internally)
  // data.thresholds: {x: Number (0 - 1), y: Number (0 - 1)}
  // data.x: Number (-1 - 1)
  // data.y: Number (-1 - 1)

  // gamepadState consist of the state when this callback was called
});
```

#### Bind events
```js
const joycon = new JoyconJS({
  connected: (gamepad) => {
    // bind a button to button_1
    gamepad.pressed('button_1', (data) => {
      console.log(data);
    });
    // button_1 is released
    gamepad.released('button_1', (data) => {
      console.log('button_1 released', data);
    });
  }
});
```

### Keymaps
##### buttons
  * *button_1*
  * *button_2*
  * *button_3*
  * *button_4*
  * *left_shoulder_button*
  * *right_shoulder_button*
  * *left_trigger*
  * *right_trigger*
  * *options*
  * *start*
  * *left_axis_button*
  * *right_axis_button*
  * *d_pad_up*
  * *d_pad_down*
  * *d_pad_left*
  * *d_pad_right*
  * *vendor*

##### axes
  * *left_stick_axis*
  * *right_stick_axis*

```js
const joycon = new JoyconJS({
  connected: (gamepad) => {
    gamepad.axis('left_stick_axis', (data) => {
      console.log('left stick triggers');
    });
  }
});
```

## Complete script
```js
const joycon = new JoyconJS({
  connected: (gamepad) => {
    // set threshold
    gamepad.threshold(.6);
    // move left axis
    gamepad.axis('left_stick_axis', (data) => {
      console.log('axis left is over threshold');
    });
    // bind a buttons
    gamepad.pressed('button_1', (data) => {
      console.log('button_1 pressed');
    });
    gamepad.released('button_1', (data) => {
      console.log('button_1 released');
    });
  }
});
```
