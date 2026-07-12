/*
  PROGRAMMABLE SMART-FLUID MATRIX
  Four-channel serial electrode controller

  SAFETY:
  1. Test relay logic before connecting the external field supply.
  2. Confirm every channel is OFF during boot and reset.
  3. Use a fused, current-limited, low-voltage supply.
  4. Press/send X to turn every channel off.
*/

const byte RELAYS[] = {2, 3, 4, 5};
const byte RELAY_COUNT = 4;

// Many relay boards are active-low. If testing shows yours is
// active-high, change true to false and upload again.
const bool ACTIVE_LOW = true;

byte relayOnLevel() {
  return ACTIVE_LOW ? LOW : HIGH;
}

byte relayOffLevel() {
  return ACTIVE_LOW ? HIGH : LOW;
}

void setChannel(byte channel, bool enabled) {
  if (channel >= RELAY_COUNT) return;
  digitalWrite(
    RELAYS[channel],
    enabled ? relayOnLevel() : relayOffLevel()
  );
}

void allOff() {
  for (byte i = 0; i < RELAY_COUNT; i++) {
    setChannel(i, false);
  }
}

void setup() {
  Serial.begin(9600);

  // Write the inactive level before switching each pin to OUTPUT.
  // This reduces unwanted relay pulses during startup.
  for (byte i = 0; i < RELAY_COUNT; i++) {
    digitalWrite(RELAYS[i], relayOffLevel());
    pinMode(RELAYS[i], OUTPUT);
  }

  allOff();
  Serial.println("SMART_FLUID_CONTROLLER_READY");
}

void loop() {
  if (Serial.available() <= 0) return;

  char command = Serial.read();

  switch (command) {
    case '1': setChannel(0, true);  break; // Q1 ON
    case 'A': setChannel(0, false); break; // Q1 OFF
    case '2': setChannel(1, true);  break; // Q2 ON
    case 'B': setChannel(1, false); break; // Q2 OFF
    case '3': setChannel(2, true);  break; // Q3 ON
    case 'C': setChannel(2, false); break; // Q3 OFF
    case '4': setChannel(3, true);  break; // Q4 ON
    case 'D': setChannel(3, false); break; // Q4 OFF
    case 'X': allOff();             break; // Emergency global OFF
    case '?': Serial.println("READY"); break;
  }
}
