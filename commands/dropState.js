let dropInProgress = false;
let dropCooldown = 0;

module.exports = {
  getDropInProgress: () => dropInProgress,
  setDropInProgress: (value) => { dropInProgress = value; },
  startDrop: () => { dropInProgress = true; },
  stopDrop: () => { dropInProgress = false; },
  getDropCooldown: () => dropCooldown,
  setDropCooldown: (value) => { dropCooldown = value; },
  updateDropStateAndCooldown: (isDropInProgress, cooldown) => {
    dropInProgress = isDropInProgress;
    dropCooldown = cooldown;
  }
};