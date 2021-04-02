let commands;
let audioElem;

const role = {
  broadcaster: "broadcaster",
  moderator: "moderator",
  vip: "vip",
  subscriber: "subscriber",
  premium: "premium",
};

const getCanPlay = (onlyMod, onlySub, onlyVip, roles) => {
  switch (true) {
    case roles.indexOf(role.broadcaster) !== -1:
      return true;
    case onlyMod && roles.indexOf(role.moderator) !== -1:
      return true;
    case onlyVip && roles.indexOf(role.vip) !== -1:
      return true;
    case (onlySub && roles.indexOf(role.subscriber) !== -1) ||
      roles.indexOf(role.premium) !== -1:
      return true;
    case !onlyMod && !onlySub && !onlyVip:
      return true;
    default:
      return false;
  }
};

window.addEventListener("onWidgetLoad", function (obj) {
  audioElem = $("#sound");
  setInterval(function () {
    audioElem.children().each(function () {
      if (this.paused) {
        this.remove();
      }
    });
  }, 60000);
  const fieldData = obj.detail.fieldData;
  commands = Object.keys(fieldData).reduce((acc, cur) => {
    const [name, idx] = cur.split("-");
    if (name === "command") {
      const command = fieldData[cur][0] === "!" && fieldData[cur].slice(1);
      if (command) {
        acc[command] = {
          sound: fieldData["sound-" + idx],
          onlyMod: fieldData["onlyMod-" + idx],
          onlySub: fieldData["onlySub-" + idx],
          onlyVip: fieldData["onlyVip-" + idx],
          volume: fieldData["volume" + idx],
        };
      }
    }
    return acc;
  }, {});

  window.addEventListener("onEventReceived", function (obj) {
    if (!obj.detail.event || Object.keys(commands).length === 0) {
      console.log("no command sound available");
      return;
    }
    const event = obj.detail.event;
    const listener = obj.detail.listener;
    const msg = event.data.text[0] === "!" && event.data.text.slice(1);
    const roles = event.data.tags.badges
      .split(",")
      .map((role) => role.split("/")[0]);
    const onlyMod = commands[msg].onlyMod;
    const onlySub = commands[msg].onlySub;
    const onlyVip = commands[msg].onlyVip;
    const volume = commands[msg].volume;
    const canPlay = getCanPlay(onlyMod, onlySub, onlyVip, roles);
    if (listener === "message" && commands.hasOwnProperty(msg) && canPlay) {
      const isPresent = document.getElementById(msg);
      const stopped = isPresent && isPresent.ended;
      if (stopped) {
        isPresent.remove();
        audioElem.append(
          '<audio id="' +
            msg +
            '" autoplay="autoplay"><source src="' +
            commands[msg].sound +
            '" type="audio/mp3" /></audio>'
        );
      }
      if (!isPresent) {
        audioElem.append(
          '<audio id="' +
            msg +
            '" autoplay="autoplay"><source src="' +
            commands[msg].sound +
            '" type="audio/mp3" /></audio>'
        );
      }
      document.getElementById(msg).volume = volume;
    }
  });
});
