let mqtt = require("mqtt");
let docopt = require("docopt");
let {version} = require("./package.json");
let process = require('process');

let doc = `
Usage:
    mqtt-bridge <source> <dest> [options]

Options:
    -p --prefix <prefix> Prepend <prefix> to the topic path.
    -x --exclusive       Don't bridge messages that already begin with <prefix>.
`;

let {'<dest>': dest, '<source>': source, '--prefix': prefix, '--exclusive': exclusive}
      = docopt.docopt(doc, {version: version});

console.log(prefix);

let src_client = mqtt.connect(source);
let dest_client = mqtt.connect(dest);

src_client.on('error', (err) => {
  console.err("Source error: " + err);
  process.exit(-1);
});

dest_client.on('error', (err) => {
  console.err("Destination error: " + err);
  process.exit(-1);
});

src_client.on('message', (topic, msg, packet) => {
  if((exclusive && !topic.startsWith(prefix)) || !exclusive) {
    console.info("Bridging message for topic " + topic);
    dest_client.publish(prefix ? prefix + "/" + topic : topic, msg);
  }
});

src_client.on('connect', (connack) => {
  if(!connack.sessionPresent) {
    src_client.subscribe("#", (err, granted) => {
      if(err != null) {
        console.err("Failed to subscribe to # with error " + err);
        process.exit(-1);
      }
      console.log("Successfully subscribed to #");
    })
  }
})
