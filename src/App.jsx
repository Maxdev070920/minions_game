import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CHARACTERS, CATEGORIES, TIPS } from "./data/catalog";
import {
  playerService,
  settingsService,
  inventoryService,
  missionService,
  walletService,
} from "./services/local";
import { filterInventory } from "./utils/logic";
import Mote from "./components/Mote";
const Game = lazy(() => import("./screens/Game"));

function Logo() {



  return (
    <div className="logo">
      <span className="logo-icon">
        m<span>✦</span>
      </span>
      <div>
        MOTE MAYHEM<small>LAB ESCAPE</small>
      </div>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const ref = useRef();
  
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = ref.current.querySelectorAll(
          'button,input,select,[tabindex="0"]',
        );
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        tabIndex="-1"
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
export default function App() {
  const [screen, setScreen] = useState("base"),
    [loading, setLoading] = useState(0),
    [player, setPlayer] = useState(playerService.get),
    [settings, setSettings] = useState(settingsService.get),
    [equipped, setEquipped] = useState(inventoryService.get),
    [modal, setModal] = useState(null),
    [result, setResult] = useState(null),
    [run, setRun] = useState(0),
    [pose, setPose] = useState(""),
    [category, setCategory] = useState("All items"),
    [rarity, setRarity] = useState("All rarities"),
    [item, setItem] = useState(inventoryService.items[0]);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const character =
    CHARACTERS.find((c) => c.id === player.selected) || CHARACTERS[0];
  useEffect(() => {
    const id = setInterval(() => setLoading((v) => Math.min(100, v + 10)), 75);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    console.log("123")
    const init = import("./utils/init")
  }, []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = settings.reducedMotion
      ? "true"
      : "false";
    settingsService.save(settings);
  }, [settings]);
  const choose = (id) => {
    const p = { ...player, selected: id };
    setPlayer(p);
    playerService.save(p);
  };
  const start = () => {
    setRun((v) => v + 1);
    setScreen("game");
  };
  const finish = (stats) => {
    const r = missionService.finish(stats);
    setResult(r);
    setPlayer(playerService.get());
    setScreen("results");
  };
  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  if (loading < 100)
    return (
      <div className="loading">
        <Logo />
        <p className="eyebrow">WAKING UP THE LAB...</p>
        <div className="load-track">
          <i style={{ width: `${loading}%` }} />
        </div>
        <small>{loading}%</small>
        <p>{tip}</p>
      </div>
    );
  if (screen === "game")
    return (
      <Suspense
        fallback={
          <div className="loading">
            <Logo />
            <p>Opening Sector 07…</p>
          </div>
        }
      >
        <Game
          key={run}
          character={character}
          settings={settings}
          equipped={equipped}
          onResult={finish}
          onRestart={start}
          onLeave={() => setScreen("base")}
        />
      </Suspense>
    );
  return (
    <div className="app-shell">
      <header>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setScreen("base");
          }}
          aria-label="Mote Mayhem home"
        >
          <Logo />
        </a>
        <nav aria-label="Main navigation">
          {[
            ["base", "⌂", "The Lab"],
            ["crew", "♧", "Crew"],
            ["inventory", "▣", "Inventory"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={screen === id ? "nav-active" : ""}
              onClick={() => setScreen(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="balance">
            ◈ <b>{player.balance.toLocaleString()}</b>
          </span>
          <button
            className="sound"
            onClick={() => update("mute", !settings.mute)}
            aria-label={settings.mute ? "Unmute audio" : "Mute audio"}
          >
            {settings.mute ? "♩̸" : "♫"}
          </button>
          <button
            className="avatar"
            onClick={() => setModal("profile")}
            aria-label="Player profile"
          >
            LR
            <span />
          </button>
        </div>
      </header>
      <div className="page-content">
        {screen === "base" && (
          <>
            <div className="page-topline">
              <span>
                <span className="status-dot" /> ALL SYSTEMS MOSTLY NORMAL
              </span>
              <span>LAB TERMINAL / 001</span>
            </div>
            <section className="hero">
              <div className="hero-copy">
                <div className="chapter">
                  <span>THE GREAT LITTLE ESCAPE</span>
                  <i>01</i>
                </div>
                <h1>
                  Small crew.
                  <br />
                  Big <em>mayhem.</em>
                </h1>
                <p>
                  The lab is locked. The robots are watching.
                  <br />
                  Eight energy cores stand between you and freedom.
                  <br />
                  <strong>Go make a beautiful mess.</strong>
                </p>
                <div className="hero-actions">
                  <button className="primary" onClick={start}>
                    <span>▶</span> Play Now <span>↗</span>
                  </button>
                  <button className="secondary" onClick={() => setModal("how")}>
                    ⓘ <span>How to Play</span>
                  </button>
                </div>
                <div className="mission-meta">
                  <span>◷ 90-second missions</span>
                  <i />
                  <span>⌘ Solo adventure</span>
                  <i />
                  <span className="mint">Free to play</span>
                </div>
              </div>
              <div className="hero-art">
                <div className="art-grid" />
                <div className="orbital orbit-one" />
                <div className="orbital orbit-two" />
                <span className="art-label">
                  SPECIMENS: UNREASONABLY CURIOUS
                </span>
                <div className="back-door">
                  <div />
                  <span>SECTOR 07</span>
                </div>
                <div className="platform" />
                <div className="hero-mote hero-moss">
                  <Mote character={CHARACTERS[3]} />
                </div>
                <div className="hero-mote hero-glitch">
                  <Mote character={CHARACTERS[2]} />
                </div>
                <div className="hero-mote hero-pip">
                  <Mote character={CHARACTERS[1]} />
                </div>
                <div className="hero-mote hero-volt">
                  <Mote character={CHARACTERS[0]} />
                </div>
                <span className="floating-core core-one">◈</span>
                <span className="floating-core core-two">◈</span>
                <span className="floating-core core-three">✦</span>
                <div className="specimen-tag">
                  <span className="status-dot" /> CONTAINMENT STATUS{" "}
                  <b>…complicated</b>
                </div>
              </div>
              <span className="hero-bottom-label">
                MOTE RESEARCH DIVISION © 2026
              </span>
            </section>
            <section className="mission-strip">
              <div className="strip-icon">⌁</div>
              <div>
                <small>YOUR NEXT MISSION</small>
                <h3>Break out of Sector 07</h3>
              </div>
              <div className="strip-detail">
                <span>◈</span>
                <div>
                  <b>8 Energy Cores</b>
                  <small>Collect them all</small>
                </div>
              </div>
              <div className="strip-detail">
                <span>◎</span>
                <div>
                  <b>One way out</b>
                  <small>Unlock the exit portal</small>
                </div>
              </div>
              <span className="difficulty">
                <i />
                <i />
                <i className="dim" /> ROOKIE FRIENDLY
              </span>
              <button
                className="circle-button"
                onClick={start}
                aria-label="Start Sector 07 mission"
              >
                ↗
              </button>
            </section>
            <section className="crew-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">MEET YOUR TROUBLEMAKERS</p>
                  <h2>A little weird. A lot of potential.</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => setScreen("crew")}
                >
                  Choose Crew <span>→</span>
                </button>
              </div>
              <div className="crew-grid">
                {CHARACTERS.map((c) => (
                  <button
                    className={`mini-card ${player.selected === c.id ? "selected" : ""}`}
                    key={c.id}
                    onClick={() => {
                      choose(c.id);
                      setScreen("crew");
                    }}
                    style={{ "--mote-color": c.color }}
                  >
                    <div className="mini-art">
                      <span className="card-number">
                        0{CHARACTERS.indexOf(c) + 1}
                      </span>
                      {player.selected === c.id && (
                        <span className="selected-badge">✓ YOUR MOTE</span>
                      )}
                      <Mote character={c} />
                    </div>
                    <div className="mini-info">
                      <div>
                        <h3>{c.name}</h3>
                        <span>{c.role}</span>
                      </div>
                      <span className="ability-symbol">
                        {c.id === "volt"
                          ? "ϟ"
                          : c.id === "pip"
                            ? "»"
                            : c.id === "glitch"
                              ? "✧"
                              : "✺"}
                      </span>
                    </div>
                    <p>{c.description}</p>
                  </button>
                ))}
              </div>
            </section>
            <section className="bottom-panels">
              <div className="player-panel">
                <span className="rank-icon">✷</span>
                <div>
                  <small>LOOKING GOOD, LAB ROOKIE</small>
                  <h3>
                    Level {1 + Math.floor(player.xp / 300)}{" "}
                    <span>· A work in progress. A great one.</span>
                  </h3>
                  <div className="xp-track">
                    <i style={{ width: `${(player.xp % 300) / 3}%` }} />
                  </div>
                  <small>{player.xp % 300} / 300 XP TO NEXT LEVEL</small>
                </div>
                <button onClick={() => setModal("profile")}>↗</button>
              </div>
              <div className="wallet-panel">
                <span>⬡</span>
                <div>
                  <h3>Your crew. Your collection.</h3>
                  <p>A new dimension of ownership is on the horizon.</p>
                  <button disabled>
                    Connect Wallet <span>COMING SOON</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
        {screen === "crew" && (
          <>
            <div className="inner-heading">
              <p className="eyebrow">FOUR PERSONALITIES. ZERO GOOD ALIBIS.</p>
              <h1>
                Choose your <em>chaos.</em>
              </h1>
              <p>Same mission. Four very different ways to make a mess.</p>
            </div>
            <div className="selection-layout">
              <div className="selection-grid">
                {CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className={`selection-card ${c.id === character.id ? "selected" : ""}`}
                    style={{ "--mote-color": c.color }}
                    onClick={() => choose(c.id)}
                  >
                    <div className="selection-title">
                      <h2>
                        {c.name} <small>{c.role}</small>
                      </h2>
                      <span>
                        {c.id === character.id ? "● SELECTED" : "○ SELECT"}
                      </span>
                    </div>
                    <Mote character={c} />
                    <p>{c.personality}</p>
                    <div className="stats">
                      <span>
                        Speed <b>{Math.round(c.speed / 47)} / 5</b>
                      </span>
                      <span>
                        Power <b>{c.power} / 5</b>
                      </span>
                    </div>
                    <strong>
                      {c.ability} <small>· {c.cooldown}s cooldown</small>
                    </strong>
                    <p>{c.description}</p>
                  </button>
                ))}
              </div>
              <aside
                className="preview-panel"
                style={{ "--mote-color": character.color }}
              >
                <p className="eyebrow">READY FOR A LITTLE TROUBLE?</p>
                <Mote character={character} equipped={equipped} pose={pose} />
                <h2>{character.name}</h2>
                <p>{character.personality}</p>
                <div className="preview-actions">
                  <button
                    onClick={() =>
                      setPose((p) => (p === "moving" ? "" : "moving"))
                    }
                  >
                    {pose === "moving" ? "Idle" : "Move"}
                  </button>
                  <button
                    onClick={() => {
                      setPose("casting");
                      setTimeout(() => setPose(""), 950);
                    }}
                  >
                    Try ability ✧
                  </button>
                </div>
                <p className="preview-description">{character.description}</p>
                <button className="primary" onClick={start}>
                  Start Mission →
                </button>
                <small>90 seconds · 8 cores · 1 escape</small>
              </aside>
            </div>
          </>
        )}
        {screen === "inventory" && (
          <>
            <div className="inner-heading">
              <p className="eyebrow">MORE STYLE. SAME MAYHEM.</p>
              <h1>
                The <em>good stuff.</em>
              </h1>
              <p>
                Cosmetics only. Looking this good doesn’t need a power boost.
              </p>
            </div>
            <div className="inventory-toolbar">
              <div className="filters">
                {CATEGORIES.map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    key={c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <select
                aria-label="Filter by rarity"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                {["All rarities", "Common", "Rare", "Epic", "Legendary"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
              </select>
            </div>
            <div className="inventory-layout">
              <div className="items-grid">
                {filterInventory(inventoryService.items, category, rarity).map(
                  (i) => (
                    <button
                      key={i.id}
                      className={`item-card ${item.id === i.id ? "selected" : ""}`}
                      onClick={() => setItem(i)}
                      style={{ "--mote-color": i.color }}
                    >
                      <div className="item-tags">
                        <small>{i.rarity}</small>
                        <small>
                          {i.locked
                            ? "▣ LOCKED"
                            : equipped[i.category] === i.id
                              ? "✓ EQUIPPED"
                              : "OWNED"}
                        </small>
                      </div>
                      <span className="cosmetic-icon">
                        {
                          {
                            Visors: "▰",
                            "Body colors": "◉",
                            "Back accessories": "⚑",
                            Footwear: "◒",
                            "Ability effects": "✧",
                            "Victory animations": "♫",
                          }[i.category]
                        }
                      </span>
                      <h3>{i.name}</h3>
                      <p>{i.category}</p>
                      {i.nft && <span className="nft-tag">Future NFT</span>}
                    </button>
                  ),
                )}
                {filterInventory(inventoryService.items, category, rarity)
                  .length === 0 && (
                  <p className="empty">Nothing here yet. Try another filter.</p>
                )}
              </div>
              <aside className="preview-panel">
                <p className="eyebrow">FITTING ROOM</p>
                <Mote
                  character={character}
                  equipped={{ ...equipped, [item.category]: item.id }}
                  pose={
                    item.category === "Victory animations"
                      ? "moving"
                      : item.category === "Ability effects"
                        ? "casting"
                        : ""
                  }
                />
                <h2>{item.name}</h2>
                <p>
                  {item.rarity} · {item.category}
                </p>
                <button
                  className="primary"
                  disabled={item.locked || equipped[item.category] === item.id}
                  onClick={() => setEquipped(inventoryService.equip(item))}
                >
                  {item.locked
                    ? "Locked · Future reward"
                    : equipped[item.category] === item.id
                      ? "✓ Equipped"
                      : "Equip cosmetic"}
                </button>
                <small>
                  {item.locked
                    ? "An upcoming collection item."
                    : "Purely cosmetic. Unreasonably stylish."}
                </small>
              </aside>
            </div>
          </>
        )}
        {screen === "results" && result && (
          <section className="results">
            <p className="eyebrow">SECTOR 07 · MISSION REPORT</p>
            <div className={`result-art ${result.won ? "win" : ""}`}>
              <Mote
                character={character}
                equipped={equipped}
                pose={
                  result.won && equipped["Victory animations"] ? "moving" : ""
                }
              />
              <span>{result.won ? "✦" : "×"}</span>
            </div>
            <h1>
              {result.won ? "Beautiful escape." : "A little lab setback."}
            </h1>
            <p>
              {result.won
                ? "Eight cores. One free Mote. That’s a good day."
                : result.damage === 3
                  ? "The robots got this round. You’ve got the next."
                  : "Time got away from you. Your next escape is waiting."}
            </p>
            <div className="score-panel">
              <small>FINAL SCORE</small>
              <strong>{result.score.toLocaleString()}</strong>
              <span>
                PERSONAL BEST · {missionService.best().toLocaleString()}
              </span>
            </div>
            <div className="result-stats">
              {[
                ["Mission time", `${result.elapsed.toFixed(1)}s`],
                ["Cores collected", `${result.cores}/8`],
                ["Damage received", result.damage],
                ["Abilities used", result.abilityUses],
                ["Experience earned", `+${result.xp} XP`],
              ].map(([a, b]) => (
                <div key={a}>
                  <small>{a}</small>
                  <strong>{b}</strong>
                </div>
              ))}
            </div>
            <div className="result-actions">
              <button className="primary" onClick={start}>
                Play Again ↗
              </button>
              <button onClick={() => setScreen("crew")}>
                Change Character
              </button>
              <button onClick={() => setScreen("base")}>Return to Base</button>
            </div>
          </section>
        )}
      </div>
      <footer>
        <span>✦ SMALL CREATURES. BIG ESCAPE ENERGY.</span>
        <div>
          <button onClick={() => setModal("settings")}>⚙ Settings</button>
          <button onClick={() => setModal("how")}>How to Play ↗</button>
          <span>
            FRONTEND PROTOTYPE <i>v1.0</i>
          </span>
        </div>
      </footer>
      {modal === "how" && (
        <Modal title="A crash course in chaos." onClose={() => setModal(null)}>
          <p>Escape Sector 07 before the 90-second timer runs out.</p>
          <div className="how-steps">
            <p>
              <b>01 · Gather the glow</b>Walk over all eight Energy Cores
              scattered around the lab.
            </p>
            <p>
              <b>02 · Stay in one piece</b>Robots patrol, detect, and chase.
              Break away to lose them. You have three health points and one
              second of protection after each hit.
            </p>
            <p>
              <b>03 · Make your exit</b>Once all cores are collected, reach the
              upper-right portal and press E. Lose all health or run out of time
              and the mission fails.
            </p>
          </div>
          <div className="control-list">
            <span>
              <kbd>WASD / ↑↓←→</kbd> Move
            </span>
            <span>
              <kbd>SPACE</kbd> Special ability
            </span>
            <span>
              <kbd>E</kbd> Interact with portal
            </span>
            <span>
              <kbd>ESC</kbd> Pause / resume
            </span>
          </div>
          <p>
            On mobile, rotate to landscape. Drag the left joystick to move; tap
            Interact, Ability, or the pause button.
          </p>
          <div className="ability-list">
            {CHARACTERS.map((c) => (
              <p key={c.id}>
                <b style={{ color: c.color }}>
                  {c.name} · {c.ability} ({c.cooldown}s)
                </b>
                {c.description}
              </p>
            ))}
          </div>
          <button
            className="primary"
            onClick={() => {
              setModal(null);
              start();
            }}
          >
            Got it. Let’s escape →
          </button>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Tune your mayhem." onClose={() => setModal(null)}>
          <p>Make yourself at home. Settings save automatically.</p>
          {[
            ["master", "Master volume"],
            ["music", "Music volume"],
            ["sfx", "Sound effects"],
          ].map(([k, label]) => (
            <label className="setting-row" key={k}>
              <span>{label}</span>
              <input
                aria-label={label}
                type="range"
                min="0"
                max="100"
                value={settings[k]}
                onChange={(e) => update(k, Number(e.target.value))}
              />
              <b>{settings[k]}%</b>
            </label>
          ))}
          <small className="muted">
            Synthesized effects are included. Music is reserved for a future
            soundtrack.
          </small>
          {[
            ["mute", "Mute all sound"],
            ["reducedMotion", "Reduced motion"],
            ["screenShake", "Screen shake"],
          ].map(([k, label]) => (
            <label className="setting-row" key={k}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[k]}
                onChange={(e) => update(k, e.target.checked)}
              />
            </label>
          ))}
          <button
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await document.documentElement.requestFullscreen();
              } catch {
                setModal("fullscreen");
              }
            }}
          >
            Toggle Fullscreen ↗
          </button>
        </Modal>
      )}
      {modal === "fullscreen" && (
        <Modal title="Fullscreen unavailable" onClose={() => setModal(null)}>
          <p>
            This browser doesn’t support fullscreen here. You can continue
            playing in the current view.
          </p>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Your lab record." onClose={() => setModal(null)}>
          <p>
            Level {1 + Math.floor(player.xp / 300)} · {player.xp} XP ·{" "}
            {player.balance} Energy Cores
          </p>
          <h3>Personal best: {missionService.best().toLocaleString()}</h3>
          <p className="eyebrow">LAST FIVE MISSIONS</p>
          {missionService.history().length ? (
            missionService.history().map((r) => (
              <div className="history-row" key={r.id}>
                <span>
                  {r.won ? "Escaped" : "Contained"} ·{" "}
                  {CHARACTERS.find((c) => c.id === r.character)?.name || "Mote"}
                </span>
                <b>{r.score} pts</b>
                <small>{r.elapsed.toFixed(1)}s</small>
              </div>
            ))
          ) : (
            <p>No missions yet. Your story starts in Sector 07.</p>
          )}
          <p className="muted">Progress is saved on this device.</p>
          <details>
            <summary>Future wallet UI preview · mock only</summary>
            <div className="wallet-states">
              {walletService.states.map((s) => (
                <div key={s}>
                  <b>{s}</b>
                  <small>
                    {walletService.getProfile(s).address ||
                      {
                        connecting: "Simulated connection in progress",
                        error: "Simulated connection error",
                        "wrong network": "Unsupported demo network",
                        disconnected: "No wallet required",
                      }[s]}
                  </small>
                </div>
              ))}
            </div>
          </details>
        </Modal>
      )}
    </div>
  );
}
