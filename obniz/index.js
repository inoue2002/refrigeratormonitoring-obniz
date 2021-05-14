"use strict";
require("dotenv").config();
const Obniz = require("obniz");
const axios = require("axios");
const obniz = new Obniz(process.env.OBNIZ_ID);

obniz.onconnect = async () => {
  const hcsr04 = obniz.wired("HC-SR04", {
    gnd: 0,
    echo: 1,
    trigger: 2,
    vcc: 3,
  });
  let isOpen = false;
  let startTime;
  let totalTime;
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
    console.log(avg, isOpen);
    if (avg > 100 && isOpen === false) {
      isOpen = true;
      startTime = new Date().getTime();
      console.log("冷蔵庫があきました！");
    }
    if (avg < 100 && isOpen === true) {
      //しまった時
      isOpen = false;
      console.log(new Date().getTime());
      console.log(startTime);

      totalTime = new Date().getTime() - startTime;
      totalTime = totalTime / 1000;
      var hour = Math.floor(totalTime / 3600);
      var hour_wari = Math.floor(totalTime % 3600);
      var min = Math.floor(hour_wari / 60);
      var min_wari = Math.floor(hour_wari % 60);
      var sec = min_wari;

      console.log(`${hour}時間${min}分${sec}秒開いていた`);
      //totalTimeをAPIに送る
      axios.post(process.env.API_URL + "/register", {
        totalTime: Math.floor(totalTime),
      });
    }
    await obniz.wait(100);
  }
};
