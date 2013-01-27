var common = {
    reportFirmware: [240, 121, 2, 3, 65, 0, 100, 0, 118, 0, 97, 0, 110, 0, 99, 
        0, 101, 0, 100, 0, 70, 0, 105, 0, 114, 0, 109, 0, 97, 0, 116, 0, 97, 0, 
        46, 0, 105, 0, 110, 0, 111, 0, 247
    ],
    stringMessage: [240, 113, 72, 0, 101, 0, 108, 0, 108, 0, 111, 0, 32, 0, 87, 0, 111,
        0, 114, 0, 108, 0, 100, 0, 33, 0, 247
    ],
    analogInput: [224, 42, 6], // analog pin 0, 0.79
    digitalInput: [144, 4, 0], // digital pin 2, 1
    sendAnalogData: [235, 50, 1], // pin 11, 0.7
    sendExtendedAnalogData: {
        maxBits: [240, 111, 11, 0, 0, 4, 247],
        maxPins: [240, 111, 128, 127, 1, 247]
    },
    sendDigitalData: [0, 8],
    sendDigitalPort: [144, 8, 0],
    sendString: [
        113,
        [72, 0, 101, 0, 108, 0, 108, 0, 111, 0, 32, 0, 87, 0, 111, 0, 114, 
            0, 108, 0, 100, 0, 33, 0
        ]
    ],
    sendSysex: [240, 113, 72, 0, 101, 0, 108, 0, 108, 0, 111, 0, 32, 0, 87, 0,
        111, 0, 114, 0, 108, 0, 100, 0, 33, 0, 247
    ],
    sendServoAttach: [240, 112, 9, 32, 4, 96, 18, 247], // pin 9, default min and max    
    sendServoData: [9, 0.5] // pin 8, 90 degrees
};

var uno = {
    numPins: 20,
    i2cPins: [18, 19],
    pwmPins: [3, 5, 6, 9, 10, 11],
    analogPinCount: 6,
    firstAnalogPinNum: 14,
    lastAnalogPinNum: 19,
    testDigitalPin: 2,
    testAnalogPin: 0,
    testPinStateDout: 2,
    testPinStatePwm: 11,
    defaultPinStates: [undefined, undefined, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        2, 2, 2, 2, 2, 2
    ],    
    capabilityResponse: [240, 108, 127, 127, 0, 1, 1, 1, 4, 14, 127, 0, 1, 1, 1,
        3, 8, 4, 14, 127, 0, 1, 1, 1, 4, 14, 127, 0, 1, 1, 1, 3, 8, 4, 14, 127,
        0, 1, 1, 1, 3, 8, 4, 14, 127, 0, 1, 1, 1, 4, 14, 127, 0, 1, 1, 1, 4, 14, 
        127, 0, 1, 1, 1, 3, 8, 4, 14, 127, 0, 1, 1, 1, 3, 8, 4, 14, 127, 0, 1, 
        1, 1, 3, 8, 4, 14, 127, 0, 1, 1, 1, 4, 14, 127, 0, 1, 1, 1, 4, 14, 127, 
        0, 1, 1, 1, 2, 10, 127, 0, 1, 1, 1, 2, 10, 127, 0, 1, 1, 1, 2, 10, 127, 
        0, 1, 1, 1, 2, 10, 127, 0, 1, 1, 1, 2, 10, 6, 1, 127, 0, 1, 1, 1, 2, 10, 
        6, 1, 127, 247
    ],
    analogMapping: [240, 106, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 
        127, 127, 127, 127, 0, 1, 2, 3, 4, 5, 247
    ],
    pinStateResponse: {
        digitalOut: [240, 110, 2, 1, 1, 247], // digital out pin 2, 1
        pwm: [240, 110, 11, 3, 88, 1, 247]    // pwm pin 2, 0.85
    }    
};

var mega = {

};

var fio = {

};

var teensy2 = {

};


