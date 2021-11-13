# JoyconJS
Library to connect your gamepad to the browser gamepad API.

##### Install
`
npm i joyconjs
`

## Initialization
Listen for gamepad connection and disconnection.
```js
  const joycon = new JoyconJS({
    connected(gamepad){},
    disconnected(gamepad){}
  });
```

### Listening and pulling gamepad state
To continiously pull in a standalone `requestAnimationFrame` loop call the listen method. This creates a new `raf` loop behind the scenes that keeps pulling the state for each connected gamepad.
```js
joycon.listen();
```

However if you want to pull the gampad data in your own loop you simply call the pull method. This same method is being called in the listen method and updates the states for all connected gamepads. The difference is that it's up to you to decide when that data is being updated.
```js
joycon.pull();
```

### Cleanup
Since we are listening for the gamepad events we also should clean that up. In a front-end framework that would be done in your components `unmount` or `destroy` callback.

The destroy method removes all eventlisteners and cancels the current running `raf` loop if data is pulled via the listen method.
```js
joycon.destroy();
```

## Mappings
We have two mappings. One for buttons and one for axes. By default there are buttons and axes mapped which you can override to easily fit the your and your users gamepad.

### Clear gamepad mappings
```js
gamepad.clearButtons();
gamepad.clearAxes();
```

### Customizing mapping
Mappings are index based. So create a custom key for the particular input at that particular index. We are also able to define multiple mappings to the same index.

Map a single key to a button at index 0. This is my `A` button so I name it `a_button`.
```js
gamepad.buttons({
  0: 'a_button'
});
```

But we can also map it to several custom keys by providing an array of keys. These keys are still mapped to the same index as the previous example and is triggered on the same button press.
```js
gamepad.buttons({
  0: ['player_jump', 'ok_dialog']
});
```

Also instead of having to clear buttons or axes in a separate function call we can pass a boolean `true` as the second argument and it will clear any previous bindings.
```js
gamepad.buttons({
  0: ['player_jump', 'ok_dialog']
}, true);
```

The implementation goes the same for the stick axes.
```js
gamepad.axes({
  0: ['move_character', 'ui_control'],
  1: 'crosshair'
}, true);
```

## Buttons
`connected` callback provides a gamepad object where we bind our buttons to. There are 3 types of buttons. `on`, `pressed`, `touched` and separate implementations for `untouched` and `released`.

* __`on`__ - Continiously firing on every frame
* __`pressed`__ - Fire once
* __`touched`__ - Touch sensitive buttons. Fire once.

These binding methods accepts a `key` and a `callback` function and returns an object with the ability to chain a threshold value to the bound button. This threshold is a value between `0` and `1`.

```js
gamepad.on('left_trigger', console.log).threshold(.6);
gamepad.pressed('left_trigger', console.log).threshold(.6);
```

* __`released`__ - Fires when a button is released
* __`untouched`__ - Fires when a touch is untouched/released

Bind release callbacks.
```js
gamepad.released('left_trigger', console.log);
gamepad.untouched('left_trigger', console.log);
```

We can also pass an array of keys to map multiple buttons to the same callback. 
```js
gamepad.on(['player_jump', 'ok_dialog'], console.log);
```

## Axes
Axes works pretty much as buttons with the difference that you can pass both `x` and `y` thresholds. If only one value is provided the `y` value will inherit the `x` value.
```js
gamepad.axis('move_character', console.log).thresholds(.3, .8);
```

## Quick help
You can get the current mappings and controller id by calling the `help` method.
```js
gamepad.help();
```

Get current axes and button maps as entries array.
```js
gamepad.getAxesMap;
gamepad.getButtonMap;
```

## Callback data
Button data.
```js
data {
  "pressed": true,
  "touched": true,
  "value": 1,
  "key": "player_jump",
  "threshold": 0.8
}
```
Axis data.
```js
data {
  "key": "move_character",
  "direction": {
    "x": 1,
    "y": 0
  },
  "x": 0.8115510940551758,
  "y": -0.09947359561920166,
  "thresholds": {
    "x": 0.8,
    "y": 0.8
  },
  "angle": -0.12196382640571538,
  "degrees": 353,
  "radians": 6.161012259539983,
  "overThreshold": {
    "x": true,
    "y": false
  }
}
```

#### Usage
```js
  const joycon = new JoyconJS({
    connected(gamepad){
      gamepad.on('player_jump', (data) => {
        // do something when button_1 is down
      });
      gamepad.axis('move_character', (data) => {
        // move character
      }).threshold(.2);
    },
    disconnected(gamepad){
      // do some cleanup
    }
  });
```