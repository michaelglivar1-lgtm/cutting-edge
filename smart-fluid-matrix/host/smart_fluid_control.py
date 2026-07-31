"""
PROGRAMMABLE SMART-FLUID MATRIX — HOST CONTROLLER

SETUP
1. Install Python 3.
2. Install PySerial:
       python3 -m pip install pyserial
3. On macOS, list serial ports:
       ls /dev/cu.*
4. Replace SERIAL_PORT below with the Arduino port.
5. Upload the Arduino firmware before running this file.
6. Verify relay behavior with the external field supply disconnected.
7. Run:
       python3 smart_fluid_control.py
8. Press Ctrl+C for a controlled shutdown.

The program first runs a repeatable state sequence, then random states.
Random switching is an experiment mode—not closed-loop learning.
"""

import atexit
import csv
import random
import signal
import time
from datetime import datetime

import serial

SERIAL_PORT = "/dev/cu.usbmodem1101"  # CHANGE THIS
BAUD_RATE = 9600
STEP_SECONDS = 1.5
ACTIVATION_PROBABILITY = 0.30
LOG_FILE = "smart_fluid_test_log.csv"

arduino = None
running = True


def connect():
    """Open the serial connection and force all channels off."""
    global arduino
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Arduino commonly resets when serial opens.
    arduino.reset_input_buffer()
    arduino.write(b"X")
    arduino.flush()


def send(command):
    """Send one ASCII command to the microcontroller."""
    if arduino and arduino.is_open:
        arduino.write(command.encode("ascii"))
        arduino.flush()


def all_off():
    """Request immediate deactivation of every electrode."""
    try:
        send("X")
    except Exception:
        pass


def shutdown():
    """Turn everything off and close the serial port."""
    global arduino
    all_off()
    if arduino and arduino.is_open:
        arduino.close()


def stop_handler(signum, frame):
    """Handle Ctrl+C or operating-system termination."""
    global running
    running = False


def initialize_log():
    """Create the CSV header only when the file is new."""
    try:
        with open(LOG_FILE, "x", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([
                "timestamp", "q1", "q2", "q3", "q4", "mode"
            ])
    except FileExistsError:
        pass


def log_state(state, mode):
    """Record every commanded state for later video/data matching."""
    with open(LOG_FILE, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([
            datetime.now().isoformat(),
            int(state[0]), int(state[1]),
            int(state[2]), int(state[3]),
            mode,
        ])


def apply_state(state):
    """Apply [Q1,Q2,Q3,Q4] Boolean state to the Arduino."""
    on_commands = ["1", "2", "3", "4"]
    off_commands = ["A", "B", "C", "D"]
    for index, enabled in enumerate(state):
        send(on_commands[index] if enabled else off_commands[index])


def random_state():
    """Generate one open-loop random test state."""
    return [
        random.random() < ACTIVATION_PROBABILITY
        for _ in range(4)
    ]


def sequence_test():
    """Run a repeatable sequence before any random testing."""
    states = [
        [False, False, False, False],
        [True,  False, False, False],
        [False, True,  False, False],
        [False, False, True,  False],
        [False, False, False, True],
        [True,  True,  False, False],
        [False, False, True,  True],
        [True,  False, True,  False],
        [False, True,  False, True],
        [True,  True,  True,  True],
        [False, False, False, False],
    ]

    for state in states:
        if not running:
            break
        apply_state(state)
        log_state(state, "sequence")
        print(f"Applied state: {state}")
        time.sleep(STEP_SECONDS)


def random_test():
    """Run open-loop random patterns until the user stops the program."""
    while running:
        state = random_state()
        apply_state(state)
        log_state(state, "random")
        print(f"Applied state: {state}")
        time.sleep(STEP_SECONDS)


if __name__ == "__main__":
    atexit.register(shutdown)
    signal.signal(signal.SIGINT, stop_handler)
    signal.signal(signal.SIGTERM, stop_handler)
    initialize_log()

    try:
        connect()
        print("Smart-fluid controller connected.")
        print("Running repeatable sequence test.")
        sequence_test()

        if running:
            print("Running random pattern test.")
            random_test()

    except Exception as error:
        print(f"Controller error: {error}")

    finally:
        shutdown()
        print("All electrodes off. Serial connection closed.")
