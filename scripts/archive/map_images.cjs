const fs = require("fs");
let content = fs.readFileSync("stitch-integrations.html", "utf8");

const map = {
  "air_purifier.jpg": "smart_appliance.jpg",
  "air-conditioner.jpg": "smart_appliance.jpg",
  "blender.jpg": "smart_appliance.jpg",
  "coffee_maker.jpg": "smart_appliance.jpg",
  "heater.jpg": "smart_appliance.jpg",
  "humidifier.jpg": "smart_appliance.jpg",
  "kettle.jpg": "smart_appliance.jpg",
  "microwave.jpg": "smart_appliance.jpg",
  "oven.jpg": "smart_appliance.jpg",
  "washing_machine.jpg": "smart_appliance.jpg",
  "water_purifier.jpg": "smart_appliance.jpg",
  "kitchen_scale.jpg": "smart_appliance.jpg",
  "doorbell.jpg": "door_lock.jpg",
  "blood_pressure.jpg": "smart_scale.jpg",
  "home-automation.png": "smart_hub.jpg",
  "smart-hub.jpg": "smart_hub.jpg",
  "wifi-router.jpg": "smart_hub.jpg",
  "zigbee-bridge.jpg": "smart_hub.jpg",
  "light.png": "smart_bulb.jpg",
  "led-strip.jpg": "smart_bulb.jpg",
  "motion-sensor.jpg": "motion-detector.jpg",
  "water-leak.jpg": "smart_hub.jpg",
  "mosquito.jpg": "smart_plug.jpg",
  "energy-meter.jpg": "smart_plug.jpg",
  "power-strip.jpg": "smart_plug.jpg",
  "projector.jpg": "smart_appliance.jpg",
  "scooter.jpg": "smart_appliance.jpg",
  "smart-tv.jpg": "smart_appliance.jpg",
  "smart_speaker.jpg": "smart_hub.jpg",
  "solar-panel.jpg": "smart_appliance.jpg",
  "treadmill.jpg": "smart_appliance.jpg",
  "window-robot.jpg": "vacuum.jpg",
  "air-quality.jpg": "smart_hub.jpg",
  "fan.jpg": "smart_appliance.jpg",
};

for (const [oldImg, newImg] of Object.entries(map)) {
  content = content.split('\"img\": \"' + oldImg + '\"').join('\"img\": \"' + newImg + '\"');
}

// Handle the URL ones with exact string match as well if we can, or just regex
content = content.replace(/\"img\": \"https[^\"\n]+\"/g, '\"img\": \"smart_appliance.jpg\"');

fs.writeFileSync("stitch-integrations.html", content);
