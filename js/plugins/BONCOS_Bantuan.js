//=============================================================================
// BONCOS_Bantuan.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Tombol "?" yang bisa diklik/disentuh untuk membuka jendela bantuan dan kontrol.
 * @author BONCOS
 *
 * @param judul
 * @text Judul Jendela
 * @type string
 * @default BANTUAN & KONTROL
 *
 * @param teksBantuan
 * @text Isi Bantuan
 * @type multiline_string
 * @desc Satu baris per baris teks. Baris yang isinya cuma --- akan jadi garis pemisah.
 * @default Gerak: tombol panah / WASD\nInteraksi: Z / Enter / Spasi\nBuka Aplikasi Pinjaman: Q\nTutup pesan/menu: X / Esc\n---\nJaga Energi dan Nilai kamu.\nAwas kalau Saldo sampai minus!
 *
 * @param posisiTombol
 * @text Posisi Tombol
 * @type select
 * @option Di Bawah Jendela Status (HUD)
 * @value bawahStatus
 * @option Kanan Bawah
 * @value kananBawah
 * @option Kiri Bawah
 * @value kiriBawah
 * @option Kanan Atas
 * @value kananAtas
 * @option Kiri Atas
 * @value kiriAtas
 * @default bawahStatus
 *
 * @param pintasanH
 * @text Pintasan Keyboard (tombol H)
 * @type boolean
 * @on Aktif
 * @off Nonaktif
 * @desc Kalau aktif, tombol H di keyboard juga membuka/menutup bantuan.
 * @default true
 *
 * @param switchAktif
 * @text ID Switch Penampil (0 = selalu tampil)
 * @type switch
 * @default 0
 *
 * @help
 * Plugin ini berdiri sendiri (tidak butuh BONCOS_HUD).
 *
 * Menampilkan tombol bulat bertanda "?" di salah satu sudut layar map.
 * Klik/sentuh tombol itu untuk membuka jendela bantuan di tengah layar.
 * Tutup dengan: klik tombol "?" lagi, klik di mana saja, tekan X / Esc /
 * Z / Enter, atau klik kanan.
 *
 * Selama jendela bantuan terbuka, karakter tidak bisa jalan dan menu
 * Esc tidak ikut terbuka.
 *
 * Tombol otomatis disembunyikan saat ada dialog atau event yang sedang
 * berjalan (supaya tidak bentrok dengan klik untuk lanjut dialog).
 *
 * Isi bantuan diatur lewat parameter "Isi Bantuan" di Plugin Manager.
 * Baris yang terlalu panjang otomatis dipecah ke baris berikutnya.
 *
 * POSISI TOMBOL: pilihan "Di Bawah Jendela Status (HUD)" menempelkan
 * tombol tepat di bawah kotak Status (Energi/Nilai) milik BONCOS_HUD,
 * rata dengan tepi kanannya. Posisinya dibaca langsung saat game jalan,
 * jadi urutan plugin tidak berpengaruh. Kalau BONCOS_HUD tidak aktif,
 * tombol otomatis pindah ke kanan bawah layar.
 */

(() => {
  const pluginName = "BONCOS_Bantuan";
  const params = PluginManager.parameters(pluginName);
  const judul = params["judul"] || "BANTUAN & KONTROL";
  const posisi = params["posisiTombol"] || "bawahStatus";
  const pakaiPintasanH = params["pintasanH"] !== "false";
  const switchAktif = Number(params["switchAktif"] || 0);

  // Teks multi-baris kadang tersimpan ter-escape (JSON). Coba urai dulu,
  // kalau gagal pakai apa adanya dan ubah "\n" literal jadi baris baru.
  const teksBantuan = (function () {
    const raw = params["teksBantuan"] || "";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
    } catch (e) {
      // bukan JSON, lanjut
    }
    return String(raw).replace(/\\n/g, "\n");
  })();

  if (pakaiPintasanH) {
    Input.keyMapper[72] = "boncosBantuan"; // tombol H
  }

  const state = { open: false, closedAt: -10 };

  function shouldShow() {
    if (switchAktif <= 0) return true;
    return $gameSwitches.value(switchAktif);
  }

  function bisaDibuka() {
    return (
      shouldShow() && !$gameMessage.isBusy() && !$gameMap.isEventRunning()
    );
  }

  //---------------------------------------------------------------------------
  // Tombol "?"
  //---------------------------------------------------------------------------
  class Sprite_BoncosBantuanButton extends Sprite_Clickable {
    initialize() {
      super.initialize();
      const size = 77;
      const r = size / 2;
      this.bitmap = new Bitmap(size, size);
      this.bitmap.drawCircle(r, r, r, "rgba(30,30,30,0.9)");
      this.bitmap.drawCircle(r, r, r - 3, "rgba(255,127,168,0.95)");
      this.bitmap.fontSize = 20;
      this.bitmap.textColor = "#ffffff";
      this.bitmap.drawText("Bantuan", 0, 0, size, size, "center");
      this.opacity = 220;
      this._size = size;
      this.posisikan();
    }

    posisikan() {
      const m = 8;
      const size = this._size;
      const scene = SceneManager._scene;
      const status = scene && scene._boncosBarsWindow;

      // Menempel tepat di bawah jendela Status (Energi/Nilai) milik HUD
      if (posisi === "bawahStatus" && status) {
        this.x = status.x + status.width - size;
        this.y = status.y + status.height + m;
        return;
      }

      // Sudut layar (juga jadi cadangan kalau jendela Status tidak ada)
      const W = Graphics.boxWidth;
      const H = Graphics.boxHeight;
      const kiri = posisi === "kiriBawah" || posisi === "kiriAtas";
      const atas = posisi === "kananAtas" || posisi === "kiriAtas";
      this.x = kiri ? m : W - size - m;
      this.y = atas ? m : H - size - m;
    }

    update() {
      super.update();
      this.posisikan();
      this.visible = state.open || bisaDibuka();
    }

    onMouseEnter() {
      this.opacity = 255;
    }

    onMouseExit() {
      this.opacity = 220;
    }

    onClick() {
      const scene = SceneManager._scene;
      if (scene && scene._boncosBantuanWindow) {
        scene._boncosBantuanWindow.toggle();
      }
    }
  }

  //---------------------------------------------------------------------------
  // Jendela bantuan
  //---------------------------------------------------------------------------
  class Window_BoncosBantuan extends Window_Base {
    initialize() {
      const width = Math.min(560, Graphics.boxWidth - 60);
      super.initialize(new Rectangle(0, 0, width, 120));
      this._rawLines = String(teksBantuan).split("\n");
      this.openness = 0;
      this.redraw();
    }

    wrapLine(line, maxWidth) {
      const words = line.split(" ");
      const out = [];
      let current = "";
      for (const word of words) {
        const test = current ? current + " " + word : word;
        if (current && this.textWidth(test) > maxWidth) {
          out.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      out.push(current);
      return out;
    }

    redraw() {
      const lh = this.lineHeight();
      const inner = this.width - this.padding * 2;

      const rows = [];
      this._rawLines.forEach((line) => {
        if (line.trim() === "---") {
          rows.push({ sep: true });
        } else {
          this.wrapLine(line, inner).forEach((t) => rows.push({ text: t }));
        }
      });

      const newHeight = this.padding * 2 + lh * (rows.length + 1);
      this.height = newHeight;
      this.x = Math.round((Graphics.boxWidth - this.width) / 2);
      this.y = Math.round((Graphics.boxHeight - newHeight) / 2);
      this.createContents();

      this.changeTextColor(ColorManager.textColor(14));
      this.drawText(judul, 0, 0, this.contents.width, "center");
      this.resetTextColor();

      rows.forEach((row, i) => {
        const y = lh * (i + 1);
        if (row.sep) {
          this.contents.fillRect(
            0,
            y + Math.round(lh / 2) - 1,
            this.contents.width,
            2,
            "rgba(255,255,255,0.35)"
          );
        } else {
          this.drawText(row.text, 0, y, this.contents.width, "left");
        }
      });
    }

    buka() {
      state.open = true;
      SoundManager.playOk();
      this.open();
    }

    tutup() {
      state.open = false;
      state.closedAt = Graphics.frameCount;
      SoundManager.playCancel();
      this.close();
    }

    toggle() {
      if (state.open) {
        this.tutup();
      } else if (bisaDibuka()) {
        this.buka();
      }
    }

    update() {
      super.update();
      const scene = SceneManager._scene;
      if (state.open) {
        const btn = scene && scene._boncosBantuanButton;
        const btnTersentuh = btn && btn.isBeingTouched();
        if (
          Input.isTriggered("cancel") ||
          Input.isTriggered("ok") ||
          Input.isTriggered("boncosBantuan") ||
          TouchInput.isCancelled() ||
          (TouchInput.isTriggered() && !btnTersentuh)
        ) {
          this.tutup();
        }
      } else if (
        pakaiPintasanH &&
        Input.isTriggered("boncosBantuan") &&
        scene &&
        scene.isActive()
      ) {
        this.toggle();
      }
    }
  }

  //---------------------------------------------------------------------------
  // Pasang ke Scene_Map
  //---------------------------------------------------------------------------
  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function () {
    _Scene_Map_createAllWindows.call(this);
    this._boncosBantuanWindow = new Window_BoncosBantuan();
    this.addWindow(this._boncosBantuanWindow);
    this._boncosBantuanButton = new Sprite_BoncosBantuanButton();
    this.addChild(this._boncosBantuanButton);
  };

  // Karakter tidak bisa jalan selama bantuan terbuka
  const _Game_Player_canMove = Game_Player.prototype.canMove;
  Game_Player.prototype.canMove = function () {
    if (state.open) return false;
    return _Game_Player_canMove.call(this);
  };

  // Menu Esc tidak ikut terbuka saat bantuan dibuka/ditutup
  const _Scene_Map_isMenuCalled = Scene_Map.prototype.isMenuCalled;
  Scene_Map.prototype.isMenuCalled = function () {
    if (state.open || Graphics.frameCount - state.closedAt <= 1) return false;
    return _Scene_Map_isMenuCalled.call(this);
  };

  // Klik di tombol "?" tidak ikut dianggap klik buat jalan di map
  const _Scene_Map_isMapTouchOk = Scene_Map.prototype.isMapTouchOk;
  Scene_Map.prototype.isMapTouchOk = function () {
    if (!_Scene_Map_isMapTouchOk.call(this)) return false;
    const btn = this._boncosBantuanButton;
    if (btn && btn.visible && btn.isBeingTouched()) return false;
    return true;
  };
})();