# Programmable Smart-Fluid Matrix

Electrically addressable particle-suspension research platform. A computer sends
serial commands to a microcontroller, which switches a low-voltage electrode array
to move, align, concentrate, and potentially connect particles suspended in a
dielectric fluid into temporary, measurable patterns.

Full reference: [`docs/Smart_Fluid_Matrix_Everything_In_One.pdf`](docs/Smart_Fluid_Matrix_Everything_In_One.pdf)
(prototype planning edition, July 2026).

> **Important:** This is an experimental low-voltage research prototype. It does not
> establish that the device is intelligent, commercially ready, or safe for unattended
> operation. Start with graphite, not carbon nanotubes; use a fused, current-limited
> supply; and keep the chamber covered.

## Objectives

1. **Primary** — repeatable, reversible, spatially addressable particle movement.
2. **Secondary** — measurable conductive pathways formed by activated structures.
3. **Advanced** — closed-loop sensor/camera feedback that optimizes the material
   state instead of switching electrodes randomly.

## Repository layout

| Path | Contents |
|---|---|
| `firmware/smart_fluid_controller/` | Arduino sketch — four-channel serial electrode controller |
| `host/smart_fluid_control.py` | Python host controller (sequence test, then random test, CSV logging) |
| `host/requirements.txt` | Python dependencies (`pyserial`) |
| `docs/` | Full prototype guide PDF and test-record template |

## Architecture

```
Computer running Python
        | USB serial
        v
Arduino / Raspberry Pi Pico
        | Digital control
        v
Relay module or MOSFET driver
        | Switched low-voltage field supply
        v
Q1, Q2, Q3, Q4 perimeter electrodes
        | Electric field through test suspension
        v
Center/common return electrode

Camera + current/resistance/temperature sensors
        +----> Python logging and closed-loop control
```

The four switched electrodes require an opposing return electrode — start with one
common center electrode connected to the external supply return.

## Safety requirements

1. Use a fused, current-limited, low-voltage supply. Never connect mains power to the chamber.
2. Start at 3–5 V and raise voltage only in small steps while monitoring current and temperature.
3. Keep the chamber covered and place it in secondary containment.
4. Avoid airborne graphite. Do not use loose carbon-nanotube powder without professional exposure controls.
5. Disconnect power before changing electrodes or wiring.
6. Stop immediately for heating, bubbling, corrosion, arcing, smoke, odor, or rapidly rising current.
7. Keep Arduino USB circuitry isolated from the electrode supply unless the selected driver specifically requires a shared reference.
8. Do not leave the prototype operating unattended.

## Relay wiring

- Arduino 5 V → relay VCC; Arduino GND → relay GND.
- Arduino D2 → IN1; D3 → IN2; D4 → IN3; D5 → IN4.
- Fused external positive → COM1–COM4.
- NO1 → Q1; NO2 → Q2; NO3 → Q3; NO4 → Q4.
- External supply negative → center/common return electrode.
- Do not automatically connect external negative to Arduino ground; relay contacts normally isolate the circuits.

**Critical:** verify whether the relay module is active-low — many common modules
energize when the input is LOW. The firmware defaults to `ACTIVE_LOW = true`;
change it if bench testing shows the opposite.

## Serial command set

| Command | Action | | Command | Action |
|---|---|---|---|---|
| `1` | Q1 ON | | `A` | Q1 OFF |
| `2` | Q2 ON | | `B` | Q2 OFF |
| `3` | Q3 ON | | `C` | Q3 OFF |
| `4` | Q4 ON | | `D` | Q4 OFF |
| `X` | Emergency global OFF | | `?` | Prints `READY` |

## Getting started

1. Upload `firmware/smart_fluid_controller/smart_fluid_controller.ino` to an
   Arduino Uno/Nano (or adapt pins for a Pico).
2. **Relay verification with the external supply disconnected:** power the Arduino
   over USB only, confirm all relays stay off at boot, exercise `1 A 2 B 3 C 4 D X`
   from the Serial Monitor, and confirm a safe all-off restart after a USB
   replug. If behavior is reversed, flip `ACTIVE_LOW` and retest.
3. Install the host dependency: `python3 -m pip install -r host/requirements.txt`.
4. Set `SERIAL_PORT` in `host/smart_fluid_control.py` (macOS: `ls /dev/cu.*`).
5. Run `python3 host/smart_fluid_control.py`. It runs a repeatable sequence test,
   then open-loop random states, logging every commanded state to
   `smart_fluid_test_log.csv`. Ctrl+C performs a controlled all-off shutdown.
6. Only after all startup/shutdown tests pass, attach the fused, current-limited
   3–5 V field supply and follow the initial test procedure in the guide
   (oil-only control first, one electrode at a time, ten repetitions).

## Fluid samples

Prepare small samples with identical oil volume, depth, mixing time, settling time,
and chamber geometry:

- **A** — oil only (mandatory control)
- **B** — 0.5% graphite by mass
- **C** — 1% graphite by mass
- **D** — 2% graphite by mass
- **E** — 5% graphite by mass

Increase concentration before increasing voltage.

## Stage gates

1. **Visible response** — field-driven movement distinct from the oil-only control, location-specific, repeated ≥10 times.
2. **Reversible structure** — defined structure with measurable formation/dissolution times, repeatable for ≥50 cycles.
3. **Conductive switching** — significant, repeatable resistance drop during activation that isn't a short, moisture, or contamination.
4. **Programmable routing** — different commands create electrically distinct, software-selectable paths.
5. **Closed-loop adaptation** — sensor-scored feedback beats a random-control baseline.

Log every run with `docs/test-record-template.md`.
