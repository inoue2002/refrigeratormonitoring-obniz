"use strict";

const Obniz = require("obniz");
const obniz = new Obniz("69477898");

obniz.onconnect = async () => {
  const hcsr04 = obniz.wired("HC-SR04", {
    gnd: 0,
    echo: 1,
    trigger: 2,
    vcc: 3,
  });

  while (true) {
    let avg = 0;
    let count = 0;
    for (let i = 0; i < 3; i++) {
      // measure three time. and calculate average
      const val = await hcsr04.measureWait();
      if (val) {
        count++;
        avg += val;
      }
    }
    if (count > 1) {
      avg /= count;
    }
    console.log(avg);
    await obniz.wait(100);
  }
};
