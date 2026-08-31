//=============================================================================
// BONCOS_HUD.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc HUD BONCOS: Utang, Saldo, Objektif, Hari, dan bar Energi/Nilai — dicari berdasarkan NAMA variable.
 * @author BONCOS
 *
 * @param nameUtang
 * @text Nama Variable Utang
 * @type string
 * @default Utang
 *
 * @param nameSaldo
 * @text Nama Variable Saldo
 * @type string
 * @default Saldo
 *
 * @param nameObjektif
 * @text Nama Variable Objektif
 * @type string
 * @default Objektif
 *
 * @param nameHari
 * @text Nama Variable HariKe
 * @type string
 * @default HariKe
 *
 * @param nameGiliran
 * @text Nama Variable GiliranKe
 * @type string
 * @default GiliranKe
 *
 * @param nameEnergi
 * @text Nama Variable Energi
 * @type string
 * @default Energi
 *
 * @param nameNilai
 * @text Nama Variable Nilai
 * @type string
 * @default Nilai
 *
 * @param nameSwitchPenampil
 * @text Nama Switch Penampil (kosongkan = selalu tampil)
 * @type string
 * @default
 *
 * @help
 * BEDA UTAMA dari versi sebelumnya: plugin ini TIDAK minta kamu pilih
 * nomor ID Variable secara manual. Sebagai gantinya, plugin ini akan
 * MENCARI SENDIRI Variable yang NAMANYA cocok dengan yang kamu ketik
 * di parameter (misal "Utang", "Saldo", "Objektif", dst).
 *
 * KENAPA DIUBAH BEGINI
 * Sebelumnya sering terjadi: kamu ganti-ganti nomor ID di Plugin
 * Manager, tapi nomornya tidak cocok dengan Variable yang benar-benar
 * kamu pakai di event -> HUD jadi salah baca / tidak update / undefined.
 * Dengan pencarian berdasarkan NAMA, masalah nomor yang salah cocok
 * ini tidak akan terjadi lagi, SELAMA nama Variable di project kamu
 * (yang kamu isi sendiri saat rename di Control Variables) PERSIS SAMA
 * dengan nama yang kamu ketik di parameter plugin ini (huruf besar/
 * kecil dan spasi harus sama persis).
 *
 * CARA PASANG
 * 1. Taruh file ini di js/plugins/, aktifkan di Plugin Manager.
 * 2. Cocokkan tiap parameter "Nama Variable ..." dengan nama PERSIS
 *    yang kamu pakai saat rename Variable di Control Variables.
 *    Contoh: kalau Variable Utang kamu namai "Utang", biarkan default.
 *    Kalau kamu namai "UangUtang", ganti parameternya jadi "UangUtang".
 * 3. Kalau nama tidak ketemu di project, HUD akan menampilkan "0" atau
 *    kosong untuk variable itu — cek lagi ejaannya kalau ini terjadi.
 *
 * CARA MENGISI TEKS OBJEKTIF
 * 1. Control Variables -> pilih Variable "Objektif" (atau nama lain
 *    yang kamu daftarkan) -> Operation: Set -> Operand: Script.
 * 2. Ketik teks DIAPIT TANDA KUTIP SATU, contoh:
 *      'Kuliah: Kumpulkan tugas besok'
 * 3. Klik OK.
 *
 * SWITCH PENAMPIL
 * Isi "Nama Switch Penampil" dengan nama Switch (bukan angka) kalau
 * mau seluruh HUD baru muncul mulai kondisi tertentu. Kosongkan untuk
 * selalu tampil dari awal game.
 */

(() => {
  const pluginName = "BONCOS_HUD";
  const params = PluginManager.parameters(pluginName);
  const nameUtang = params["nameUtang"] || "Utang";
  const nameSaldo = params["nameSaldo"] || "Saldo";
  const nameObjektif = params["nameObjektif"] || "Objektif";
  const nameHari = params["nameHari"] || "HariKe";
  const nameGiliran = params["nameGiliran"] || "GiliranKe";
  const nameEnergi = params["nameEnergi"] || "Energi";
  const nameNilai = params["nameNilai"] || "Nilai";
  const nameSwitchPenampil = params["nameSwitchPenampil"] || "";

  // Cari nomor ID Variable berdasarkan namanya di database project.
  // Dihitung ulang tiap dipanggil (bukan di-cache), jadi selalu akurat
  // meski $dataSystem belum siap saat plugin pertama kali dibaca.
  function findVarId(name) {
    if (!name || !$dataSystem || !$dataSystem.variables) return 0;
    for (let i = 1; i < $dataSystem.variables.length; i++) {
      if ($dataSystem.variables[i] === name) return i;
    }
    return 0;
  }

  function findSwitchId(name) {
    if (!name || !$dataSystem || !$dataSystem.switches) return 0;
    for (let i = 1; i < $dataSystem.switches.length; i++) {
      if ($dataSystem.switches[i] === name) return i;
    }
    return 0;
  }

  function getVar(name) {
    const id = findVarId(name);
    return id > 0 ? $gameVariables.value(id) : 0;
  }

  function shouldShow() {
    if (!nameSwitchPenampil) return true;
    const id = findSwitchId(nameSwitchPenampil);
    return id > 0 ? $gameSwitches.value(id) : true;
  }

  class Window_BoncosHUD extends Window_Base {
    initialize() {
      const width = 260;
      const height = 112;
      const rect = new Rectangle(8, 8, width, height);
      super.initialize(rect);
      this.opacity = 200;
      this.refresh();
    }

    update() {
      super.update();
      this.visible = shouldShow();
      if (this.visible) {
        this.refresh();
      }
    }

    refresh() {
      this.contents.clear();
      const utang = getVar(nameUtang);
      const saldo = getVar(nameSaldo);

      const lh = this.lineHeight();
      this.changeTextColor(ColorManager.textColor(2));
      this.drawText("Utang", 0, 0, 120, "left");
      this.resetTextColor();
      this.drawText(
        "Rp" + Number(utang).toLocaleString("id-ID"),
        0,
        0,
        this.contents.width,
        "right"
      );

      this.changeTextColor(ColorManager.textColor(3));
      this.drawText("Saldo", 0, lh, 120, "left");
      this.resetTextColor();
      this.drawText(
        "Rp" + Number(saldo).toLocaleString("id-ID"),
        0,
        lh,
        this.contents.width,
        "right"
      );
    }
  }

  class Window_BoncosObjektif extends Window_Base {
    initialize() {
      const maxWidth = 300;
      const x = 8;
      const y = 8 + 112 + 8;
      const rect = new Rectangle(x, y, maxWidth, 76);
      super.initialize(rect);
      this.opacity = 200;
      this._maxWidth = maxWidth;
      this.refresh();
    }

    update() {
      super.update();
      this.visible = shouldShow();
      if (this.visible) {
        this.refresh();
      }
    }

    wrapText(text, maxTextWidth) {
      const words = String(text).split(" ");
      const lines = [];
      let current = "";
      for (const word of words) {
        const test = current ? current + " " + word : word;
        if (current && this.textWidth(test) > maxTextWidth) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines.length > 0 ? lines : [""];
    }

    refresh() {
      const nilai = getVar(nameObjektif);
      const teks = nilai ? String(nilai) : "";
      const innerWidth = this._maxWidth - this.padding * 2;
      const bodyLines = this.wrapText(teks, innerWidth);
      const lh = this.lineHeight();
      const newHeight = this.padding * 2 + lh + bodyLines.length * lh;

      if (this.height !== newHeight) {
        this.height = newHeight;
        this.createContents();
      }

      this.contents.clear();
      this.changeTextColor(ColorManager.textColor(14));
      this.drawText("OBJEKTIF", 0, 0, this.contents.width, "left");
      this.resetTextColor();
      bodyLines.forEach((line, i) => {
        this.drawTextEx(line, 0, lh + i * lh, this.contents.width);
      });
    }
  }

  class Window_BoncosHari extends Window_Base {
    initialize() {
      const width = 220;
      const height = 60;
      const x = Graphics.boxWidth - width - 8;
      const rect = new Rectangle(x, 8, width, height);
      super.initialize(rect);
      this.opacity = 200;
      this.refresh();
    }

    update() {
      super.update();
      this.visible = shouldShow();
      if (this.visible) {
        this.refresh();
      }
    }

    refresh() {
      this.contents.clear();
      const hari = getVar(nameHari);
      const giliran = getVar(nameGiliran);
      const labelGiliran = Number(giliran) === 2 ? "Siang" : "Pagi";

      this.drawText(
        "Hari ke-" + hari + " — " + labelGiliran,
        0,
        0,
        this.contents.width,
        "center"
      );
    }
  }

  class Window_BoncosBars extends Window_Base {
    initialize() {
      const width = 260;
      const x = Graphics.boxWidth - width - 8;
      const y = 8 + 60 + 8;
      const rowHeight = 36 + 24;
      const rect = new Rectangle(x, y, width, rowHeight * 2 + 24);
      super.initialize(rect);
      this._rowHeight = rowHeight;
      this.opacity = 200;
      this.refresh();
    }

    update() {
      super.update();
      this.visible = shouldShow();
      if (this.visible) {
        this.refresh();
      }
    }

    drawStatBar(label, value, rowY, color1, color2) {
      const rate = Math.max(0, Math.min(1, Number(value) / 100 || 0));
      const barY = rowY + this.lineHeight() + 2;
      const barWidth = this.contents.width;
      const barHeight = 10;

      this.resetTextColor();
      this.drawText(label, 0, rowY, this.contents.width, "left");
      this.contents.fillRect(0, barY, barWidth, barHeight, "#4a4a4a");

      const fillWidth = Math.round(barWidth * rate);
      if (fillWidth > 0) {
        this.contents.gradientFillRect(
          0,
          barY,
          fillWidth,
          barHeight,
          color1,
          color2
        );
      }
    }

    refresh() {
      this.contents.clear();
      const energi = getVar(nameEnergi);
      const nilai = getVar(nameNilai);

      this.drawStatBar("Energi", energi, 0, "#ffc845", "#ff9d00");
      this.drawStatBar("Nilai", nilai, this._rowHeight, "#4fcfa0", "#28a374");
    }
  }

  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function () {
    _Scene_Map_createAllWindows.call(this);
    this._boncosHudWindow = new Window_BoncosHUD();
    this.addWindow(this._boncosHudWindow);
    this._boncosObjektifWindow = new Window_BoncosObjektif();
    this.addWindow(this._boncosObjektifWindow);
    this._boncosHariWindow = new Window_BoncosHari();
    this.addWindow(this._boncosHariWindow);
    this._boncosBarsWindow = new Window_BoncosBars();
    this.addWindow(this._boncosBarsWindow);
  };
})();
