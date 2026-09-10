import Phaser from "phaser";
import { GAME, WALLS, CORES } from "../config/constants";
import { cooldownRemaining } from "../../utils/logic";
export default class LabScene extends Phaser.Scene {
  constructor(character, bridge, settings, equipped) {
    super("lab");
    Object.assign(this, { character, bridge, settings, equipped });
  }
  create() {
    this.elapsed = 0;
    this.collected = 0;
    this.health = 3;
    this.damage = 0;
    this.uses = 0;
    this.lastAbility = -99999;
    this.lastHit = -99999;
    this.activeUntil = 0;
    this.ended = false;
    this.paused = false;
    this.inputVector = { x: 0, y: 0 };
    this.robots = [];
    this.physics.world.setBounds(28, 28, GAME.width - 56, GAME.height - 56);
    const g = this.add.graphics();
    g.fillStyle(0x101d2b);
    g.fillRect(0, 0, 1120, 680);
    g.lineStyle(1, 0x223449, 0.6);
    for (let x = 0; x < 1120; x += 40) g.lineBetween(x, 0, x, 680);
    for (let y = 0; y < 680; y += 40) g.lineBetween(0, y, 1120, y);
    g.lineStyle(16, 0x304353);
    g.strokeRoundedRect(18, 18, 1084, 644, 18);
    g.lineStyle(2, 0x75ddd1, 0.5);
    g.strokeRoundedRect(30, 30, 1060, 620, 8);
    this.add.text(65, 55, "SECTOR 07  /  CONTAINMENT LAB", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#67808f",
    });
    this.add.text(65, 620, "CAUTION: SMALL CREATURES. BIG IDEAS.", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#506579",
    });
    this.walls = this.physics.add.staticGroup();
    WALLS.forEach(([x, y, w, h], i) => {
      const block = this.add
        .rectangle(x, y, w, h, 0x293f50)
        .setStrokeStyle(3, 0x496374);
      this.physics.add.existing(block, true);
      this.walls.add(block);
      g.fillStyle(0x172734);
      g.fillRoundedRect(x - w / 2 + 7, y - h / 2 + 7, w - 14, h - 14, 4);
      g.lineStyle(3, i % 2 ? 0x9f89ce : 0x5ecbbb, 0.6);
      g.lineBetween(
        x - w / 2 + 12,
        y - h / 2 + 8,
        x + w / 2 - 12,
        y - h / 2 + 8,
      );
    });
    // Decorative machinery is separate from collision geometry.
    const detail = this.add.graphics();
    WALLS.forEach(([x, y, w, h], index) => {
      detail.fillStyle(0x172734);
      detail.fillRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 4);
      detail.lineStyle(3, index % 2 ? 0xa48bda : 0x67d5c4, 0.8);
      detail.lineBetween(
        x - w / 2 + 11,
        y - h / 2 + 9,
        x + w / 2 - 11,
        y - h / 2 + 9,
      );
      detail.fillStyle(0x8db4bb, 0.5);
      for (let j = 0; j < Math.floor(w / 24); j++)
        detail.fillRect(x - w / 2 + 12 + j * 22, y + h / 2 - 12, 10, 3);
      detail.fillStyle(0xb1f2ce);
      detail.fillCircle(x + w / 2 - 12, y - h / 2 + 15, 2);
      detail.lineStyle(1, 0x3a5360);
      detail.strokeRoundedRect(x - w / 2 - 7, y - h / 2 - 7, w + 14, h + 14, 7);
    });
    [
      [90, 555],
      [985, 210],
      [570, 105],
    ].forEach(([x, y]) => {
      detail.fillStyle(0x263e4a);
      detail.fillRoundedRect(x - 22, y - 25, 44, 50, 8);
      detail.fillStyle(0x6adebc, 0.2);
      detail.fillRoundedRect(x - 15, y - 18, 30, 35, 6);
      detail.lineStyle(2, 0x75c9bb, 0.65);
      detail.strokeRoundedRect(x - 15, y - 18, 30, 35, 6);
      detail.fillStyle(0xa4edc7);
      detail.fillRect(x - 8, y + 20, 16, 3);
    });
    detail.lineStyle(2, 0x73b7ab, 0.15);
    detail.strokeRoundedRect(65, 65, 460, 135, 15);
    detail.lineStyle(1, 0xa694d0, 0.15);
    detail.strokeRoundedRect(865, 435, 190, 175, 12);
    this.add.text(865, 615, "03 / REACTOR STORAGE", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#627689",
    });
    for (let i = 0; i < 8; i++) {
      detail.lineStyle(4, 0xc0b177, 0.32);
      detail.lineBetween(910 + i * 12, 48, 918 + i * 12, 58);
    }
    CORES.forEach(([x, y]) => {
      this.add.circle(x, y, 28, 0x78eac1, 0.035);
      this.add.circle(x, y, 21, 0x78eac1, 0.06);
    });
    this.portal = this.add.container(1015, 100, [
      this.add.circle(0, 0, 36, 0x8976db, 0.12).setStrokeStyle(2, 0x75678a),
      this.add.ellipse(0, 0, 35, 53, 0x20243b).setStrokeStyle(4, 0x75678a),
    ]);
    this.portalLabel = this.add
      .text(1015, 149, "EXIT LOCKED", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9588b0",
      })
      .setOrigin(0.5);
    if (!this.textures.exists("spark")) {
      const t = this.make.graphics({ x: 0, y: 0 });
      t.fillStyle(0xffffff);
      t.fillCircle(4, 4, 4);
      t.generateTexture("spark", 8, 8);
      t.destroy();
    }
    this.cores = this.physics.add.staticGroup();
    CORES.forEach(([x, y]) => {
      const c = this.add
        .star(x, y, 4, 9, 18, 0xb8ffe2)
        .setStrokeStyle(2, 0x5ee0c1);
      this.physics.add.existing(c, true);
      c.body.setCircle(19, -1, -1);
      this.cores.add(c);
      if (!this.settings.reducedMotion)
        this.tweens.add({
          targets: c,
          angle: 90,
          scale: 0.8,
          duration: 1300,
          yoyo: true,
          repeat: -1,
        });
    });
    const color = Phaser.Display.Color.HexStringToColor(
      this.equipped["Body colors"] ? "#76e5ba" : this.character.color,
    ).color;
    const body = this.add.graphics();
    body.fillStyle(color);
    if (this.character.id === "pip") body.fillTriangle(0, -23, -19, 19, 19, 19);
    else if (this.character.id === "glitch")
      body.fillPoints(
        [
          { x: 0, y: -25 },
          { x: 23, y: 0 },
          { x: 0, y: 24 },
          { x: -23, y: 0 },
        ],
        true,
      );
    else
      body.fillRoundedRect(
        -20,
        -23,
        40,
        45,
        this.character.id === "moss" ? 9 : 18,
      );
    body.fillStyle(0x111e30);
    body.fillRoundedRect(-18, -13, 36, 20, 8);
    body.fillStyle(0xa7fbff);
    body.fillRect(-10, -7, 5, 7);
    body.fillRect(6, -7, 5, 7);
    body.fillStyle(0x394e60);
    body.fillRoundedRect(-19, 17, 13, 10, 4);
    body.fillRoundedRect(6, 17, 13, 10, 4);
    if (this.equipped.Visors) {
      body.lineStyle(3, 0xbca6ff);
      body.lineBetween(-14, -11, 14, -11);
    }
    if (this.equipped["Back accessories"]) {
      body.lineStyle(3, 0xffd17d);
      body.lineBetween(17, -15, 23, -30);
    }
    this.player = this.add.container(95, 110, [body]).setDepth(10);
    this.playerArt = body;
    this.physics.add.existing(this.player);
    this.player.body.setCircle(18, -18, -18).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    const routes = [
      [
        [360, 240],
        [160, 250],
      ],
      [
        [620, 230],
        [800, 270],
      ],
      [
        [890, 470],
        [1020, 390],
      ],
      [
        [500, 530],
        [600, 420],
      ],
    ];
    routes.forEach((route, i) => {
      const robot = this.add.container(...route[0], [
        this.add.rectangle(0, 0, 29, 29, 0x455366).setStrokeStyle(2, 0x8593a1),
        this.add.rectangle(0, -3, 21, 8, 0xf78785),
        this.add.circle(-11, 17, 5, 0x1c2839),
        this.add.circle(11, 17, 5, 0x1c2839),
      ]);
      this.physics.add.existing(robot);
      robot.body.setCircle(17, -17, -17).setCollideWorldBounds(true);
      Object.assign(robot, {
        route,
        point: 1,
        stunUntil: 0,
        attackUntil: 0,
        state: "patrol",
      });
      this.physics.add.collider(robot, this.walls);
      this.robots.push(robot);
      this.physics.add.overlap(this.player, robot, () => this.hit(robot));
    });
    this.physics.add.overlap(this.player, this.cores, (_, core) => {
      if (!core.active || this.ended || this.paused) return;
      this.burst(core.x, core.y, 0x80f5c6);
      core.destroy();
      this.collected++;
      this.bridge.emit("core-collected", this.collected);
      this.beep(700, 0.07);
      if (this.collected === 8) {
        this.portal.list.forEach((p) => p.setStrokeStyle(4, 0x79f7cf));
        this.portalLabel.setText("E · ESCAPE").setColor("#91ffcc");
        this.bridge.emit("objective", "All cores secured. Get to the exit!");
      }
      this.sync();
    });
    this.keys = this.input.keyboard.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ESC",
    );
    this.input.keyboard.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.unsub = [
      this.bridge.on("command", (c) => {
        if (c === "pause") this.setPaused(true);
        if (c === "resume") this.setPaused(false);
        if (c === "ability") this.ability();
        if (c === "interact") this.interact();
      }),
      this.bridge.on("move", (v) => (this.inputVector = v)),
    ];
    this.events.once("shutdown", () => {
      this.unsub.forEach((f) => f());
      if (this.audio) this.audio.close().catch(() => {});
    });
    this.bridge.emit("game-started");
    this.sync();
  }
  beep(freq, duration) {
    if (this.settings.mute || !this.settings.master || !this.settings.sfx)
      return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const o = this.audio.createOscillator(),
        g = this.audio.createGain();
      o.connect(g);
      g.connect(this.audio.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(
        (((0.05 * this.settings.master) / 100) * this.settings.sfx) / 100,
        this.audio.currentTime,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        this.audio.currentTime + duration,
      );
      o.start();
      o.stop(this.audio.currentTime + duration);
    } catch {
      /* Audio is optional. */
    }
  }
  burst(x, y, color) {
    if (this.settings.reducedMotion) return;
    const p = this.add.particles(x, y, "spark", {
      speed: { min: 30, max: 130 },
      lifespan: 400,
      scale: { start: 0.8, end: 0 },
      tint: color,
      emitting: false,
    });
    p.explode(14);
    this.time.delayedCall(500, () => p.destroy());
  }
  setPaused(value) {
    if (this.ended) return;
    this.paused = value;
    this.inputVector = { x: 0, y: 0 };
    if (value) this.physics.pause();
    else this.physics.resume();
    this.bridge.emit("game-paused", value);
  }
  sync() {
    this.bridge.emit("hud", {
      health: this.health,
      cores: this.collected,
      time: Math.max(0, 90 - this.elapsed),
      cooldown: cooldownRemaining(
        this.lastAbility,
        this.elapsed * 1000,
        this.character.cooldown,
      ),
    });
  }
  hit(robot) {
    const now = this.elapsed * 1000;
    if (
      this.paused ||
      this.ended ||
      now < robot.stunUntil ||
      now < robot.attackUntil ||
      now - this.lastHit < GAME.invulnerability
    )
      return;
    this.lastHit = now;
    robot.attackUntil = now + 700;
    robot.body.stop();
    this.health--;
    this.damage++;
    this.bridge.emit("health-changed", this.health);
    this.burst(this.player.x, this.player.y, 0xff8e87);
    this.beep(150, 0.15);
    if (this.settings.screenShake && !this.settings.reducedMotion)
      this.cameras.main.shake(130, 0.003);
    this.sync();
    if (this.health <= 0) this.finish(false);
  }
  ability() {
    const now = this.elapsed * 1000;
    if (
      this.paused ||
      this.ended ||
      cooldownRemaining(this.lastAbility, now, this.character.cooldown) > 0
    )
      return;
    this.lastAbility = now;
    this.uses++;
    this.activeUntil = now + 3000;
    this.beep(420, 0.15);
    const { x, y } = this.player;
    const color = Phaser.Display.Color.HexStringToColor(
      this.character.color,
    ).color;
    const ring = this.add
      .circle(x, y, 22)
      .setStrokeStyle(4, this.equipped["Ability effects"] ? 0xe090f8 : color);
    this.tweens.add({
      targets: ring,
      radius: this.character.id === "pip" ? 50 : 180,
      alpha: 0,
      duration: this.settings.reducedMotion ? 100 : 600,
      onComplete: () => ring.destroy(),
    });
    this.burst(x, y, color);
    if (this.character.id === "glitch") {
      this.decoy?.destroy();
      this.decoy = this.add.container(x, y, [
        this.add.circle(0, 0, 22, 0xb49bfa, 0.45),
        this.add.text(-12, -12, "✧", { fontSize: "24px", color: "#ffffff" }),
      ]);
      this.decoyUntil = now + 4000;
    }
    if (["volt", "moss"].includes(this.character.id))
      this.robots.forEach((r) => {
        if (Phaser.Math.Distance.Between(x, y, r.x, r.y) < 190) {
          r.stunUntil = now + (this.character.id === "volt" ? 3000 : 2000);
          r.body.stop();
          if (this.character.id === "moss") {
            const angle = Phaser.Math.Angle.Between(x, y, r.x, r.y);
            r.body.setVelocity(Math.cos(angle) * 380, Math.sin(angle) * 380);
            r.pushUntil = now + 200;
          }
          this.burst(r.x, r.y, color);
        }
      });
    this.bridge.emit("ability-activated", this.character.ability);
    this.sync();
  }
  interact() {
    if (!this.paused && !this.ended) {
      if (
        Phaser.Math.Distance.Between(this.player.x, this.player.y, 1015, 100) <
        72
      ) {
        if (this.collected === 8) this.finish(true);
        else
          this.bridge.emit(
            "objective",
            `Portal locked. Find ${8 - this.collected} more cores.`,
          );
      } else
        this.bridge.emit(
          "objective",
          "Walk over cores to collect. Find the exit in the northeast.",
        );
    }
  }
  finish(won) {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.bridge.emit(won ? "mission-completed" : "mission-failed", {
      won,
      cores: this.collected,
      elapsed: this.elapsed,
      damage: this.damage,
      abilityUses: this.uses,
      character: this.character.id,
    });
  }
  update(_, delta) {
    if (!this.keys) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC))
      this.setPaused(!this.paused);
    if (this.paused || this.ended) return;
    this.elapsed += Math.min(delta, 100) / 1000;
    const now = this.elapsed * 1000;
    if (this.elapsed >= 90) {
      this.finish(false);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.ability();
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    let x = this.inputVector.x,
      y = this.inputVector.y;
    x +=
      (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) -
      (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0);
    y +=
      (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) -
      (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0);
    const v = new Phaser.Math.Vector2(x, y);
    if (v.length() > 1) v.normalize();
    this.player.body.setVelocity(
      v.x *
        this.character.speed *
        (this.character.id === "pip" && now < this.activeUntil ? 1.65 : 1),
      v.y *
        this.character.speed *
        (this.character.id === "pip" && now < this.activeUntil ? 1.65 : 1),
    );
    if (!this.settings.reducedMotion) {
      this.playerArt.y =
        Math.sin(now / (v.length() ? 70 : 250)) * (v.length() ? 2.5 : 1);
      this.playerArt.rotation = v.x * 0.09;
    }
    this.player.alpha =
      now - this.lastHit < 1100 ? (Math.sin(now / 55) > 0.0 ? 0.35 : 1) : 1;
    if (this.decoy && now > this.decoyUntil) {
      this.decoy.destroy();
      this.decoy = null;
    }
    this.robots.forEach((r) => {
      if (now < r.stunUntil) {
        if (now > (r.pushUntil || 0)) r.body.stop();
        r.alpha = 0.45;
        return;
      }
      r.alpha = 1;
      if (now < r.attackUntil) {
        r.body.stop();
        return;
      }
      const target = this.decoy || this.player;
      const d = Phaser.Math.Distance.Between(r.x, r.y, target.x, target.y);
      if (d < GAME.detection) r.state = "chase";
      else if (d > 260) r.state = "patrol";
      let tx, ty;
      if (r.state === "chase") {
        tx = target.x;
        ty = target.y;
      } else {
        [tx, ty] = r.route[r.point];
        if (Phaser.Math.Distance.Between(r.x, r.y, tx, ty) < 15)
          r.point = 1 - r.point;
      }
      const a = Phaser.Math.Angle.Between(r.x, r.y, tx, ty);
      r.body.setVelocity(
        Math.cos(a) * GAME.robotSpeed * (r.state === "chase" ? 1 : 0.65),
        Math.sin(a) * GAME.robotSpeed * (r.state === "chase" ? 1 : 0.65),
      );
      r.list[1].fillColor = r.state === "chase" ? 0xff665f : 0xf7ba7c;
    });
    this.bridge.emit(
      "cooldown-changed",
      cooldownRemaining(this.lastAbility, now, this.character.cooldown),
    );
    if (!this.nextSync || now > this.nextSync) {
      this.sync();
      this.nextSync = now + 100;
    }
  }
}
