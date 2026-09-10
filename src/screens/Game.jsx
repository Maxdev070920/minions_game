import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import LabScene from "../game/scenes/LabScene";
import { createBridge } from "../game/systems/bridge";
import { GAME } from "../game/config/constants";
import Mote from "../components/Mote";
export default function Game({
  character,
  settings,
  equipped,
  onResult,
  onLeave,
  onRestart,
}) {
  const [touchDevice] = useState(() => navigator.maxTouchPoints > 0);
  const host = useRef(null),
    bridge = useRef(createBridge()).current;
  const [hud, setHud] = useState({
      health: 3,
      cores: 0,
      time: 90,
      cooldown: 0,
    }),
    [paused, setPaused] = useState(false),
    [objective, setObjective] = useState(
      "Collect 8 Energy Cores. Stay out of trouble.",
    ),
    [stick, setStick] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const clean = [
      bridge.on("hud", setHud),
      bridge.on("game-paused", setPaused),
      bridge.on("objective", setObjective),
      bridge.on("mission-completed", onResult),
      bridge.on("mission-failed", onResult),
    ];
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: GAME.width,
      height: GAME.height,
      backgroundColor: "#101d2b",
      physics: { default: "arcade", arcade: { debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: new LabScene(character, bridge, settings, equipped),
      render: { antialias: true },
      input: { activePointers: 3 },
    });
    const orientation = () => {
      if (window.innerWidth <= 700 && window.innerHeight > window.innerWidth)
        bridge.emit("command", "pause");
    };
    const started = bridge.on("game-started", orientation);
    window.addEventListener("resize", orientation);
    const hide = () => {
      if (document.hidden) bridge.emit("command", "pause");
    };
    document.addEventListener("visibilitychange", hide);
    document.body.classList.add("playing");
    return () => {
      clean.forEach((f) => f());
      started();
      window.removeEventListener("resize", orientation);
      document.removeEventListener("visibilitychange", hide);
      game.destroy(true);
      document.body.classList.remove("playing");
    };
  }, []);
  function joystick(e) {
    if (e.type === "pointerdown")
      e.currentTarget.setPointerCapture(e.pointerId);
    if (e.buttons === 0 && e.type === "pointermove") return;
    const r = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / 35,
      y = (e.clientY - r.top - r.height / 2) / 35;
    const l = Math.max(1, Math.hypot(x, y));
    x /= l;
    y /= l;
    setStick({ x, y });
    bridge.emit("move", { x, y });
  }
  function release() {
    setStick({ x: 0, y: 0 });
    bridge.emit("move", { x: 0, y: 0 });
  }
  return (
    <main className={`game-screen ${touchDevice ? "touch-device" : ""}`}>
      <div className="game-hud">
        <div className="hud-person">
          <Mote character={character} />
          <div>
            <strong>{character.name}</strong>
            <div className="hearts" aria-label={`${hud.health} health`}>
              {"♥".repeat(hud.health)}
              <span>{"♡".repeat(3 - hud.health)}</span>
            </div>
          </div>
        </div>
        <div className="hud-stat">
          <small>ENERGY CORES</small>
          <strong className="mint">
            ◈ {hud.cores}
            <span> / 8</span>
          </strong>
        </div>
        <div className={`hud-stat ${hud.time < 20 ? "danger" : ""}`}>
          <small>TIME REMAINING</small>
          <strong>
            ◷ {String(Math.floor(Math.ceil(hud.time) / 60)).padStart(2, "0")}:
            {String(Math.ceil(hud.time) % 60).padStart(2, "0")}
          </strong>
        </div>
        <button
          onClick={() => bridge.emit("command", "ability")}
          className="ability-hud"
          disabled={hud.cooldown > 0}
        >
          <span>✧ {character.ability}</span>
          <small>
            {hud.cooldown > 0 ? `${hud.cooldown.toFixed(1)}s` : "SPACE · READY"}
          </small>
          <i
            style={{
              width: `${(1 - hud.cooldown / character.cooldown) * 100}%`,
            }}
          />
        </button>
        <button
          aria-label="Pause game"
          onClick={() => bridge.emit("command", "pause")}
        >
          Ⅱ
        </button>
      </div>
      <div className="objective">
        <span className="status-dot" />
        {objective}
      </div>
      <div ref={host} className="phaser-host" />
      <div className="game-footer">
        <span>
          <kbd>W A S D</kbd> Move
        </span>
        <span>
          <kbd>E</kbd> Exit portal
        </span>
        <span>
          <kbd>SPACE</kbd> Ability
        </span>
        <span>
          SECTOR 07 <b>● LIVE</b>
        </span>
      </div>
      <div className="mobile-controls">
        <div
          className="joystick"
          onPointerDown={joystick}
          onPointerMove={joystick}
          onPointerUp={release}
          onPointerCancel={release}
          aria-label="Movement joystick"
        >
          <i
            style={{
              transform: `translate(${stick.x * 28}px,${stick.y * 28}px)`,
            }}
          />
        </div>
        <button onClick={() => bridge.emit("command", "interact")}>
          E<span>Interact</span>
        </button>
        <button onClick={() => bridge.emit("command", "ability")}>
          ✧<span>Ability</span>
        </button>
      </div>
      <div className="rotate">
        <span>↻</span>
        <h2>A little room for mayhem</h2>
        <p>Rotate your device to landscape to explore the lab.</p>
        <button onClick={onLeave}>Return to Base</button>
      </div>
      {paused && (
        <div className="modal-backdrop">
          <section className="modal pause">
            <p className="eyebrow">TAKE A BREATHER</p>
            <h2>Chaos on hold.</h2>
            <p>Your Mote promises to behave. Probably.</p>
            <button
              className="primary"
              onClick={() => bridge.emit("command", "resume")}
            >
              Resume Mission →
            </button>
            <button onClick={onRestart}>Restart Mission</button>
            <button onClick={onLeave}>Return to Base</button>
          </section>
        </div>
      )}
    </main>
  );
}
