//=============================================================================
// BONCOS_HUD.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc HUD sederhana menampilkan Utang dan Saldo di layar map.
 * @author BONCOS
 *
 * @param varUtang
 * @text ID Variable Utang
 * @type variable
 * @default 2
 *
 * @param varSaldo
 * @text ID Variable Saldo
 * @type variable
 * @default 1
 *
 * @param varObjektif
 * @text ID Variable Objektif
 * @type variable
 * @default 5
 *
 * @param varHari
 * @text ID Variable HariKe
 * @type variable
 * @default 11
 *
 * @param varGiliran
 * @text ID Variable GiliranKe
 * @type variable
 * @default 12
 *
 * @param varEnergi
 * @text ID Variable Energi
 * @type variable
 * @default 13
 *
 * @param varNilai
 * @text ID Variable Nilai
 * @type variable
 * @default 15
 *
 * @param switchAktif
 * @text ID Switch Penampil (kosongkan = selalu tampil)
 * @type switch
 * @default 0
 *
 * @help
 * Menampilkan kotak kecil di pojok kiri atas layar map berisi:
 * Utang dan Saldo — otomatis update tiap nilai variable berubah.
 * Di bawahnya, ada kotak Objektif — isinya TEKS (bukan angka) yang
 * bisa kamu ganti-ganti sesuai jalan cerita.
 * Di pojok KANAN atas, ada indikator "Hari ke-N — Pagi/Siang".
 * Di bawahnya, ada 2 BAR (bukan angka): Energi dan Nilai — otomatis
 * mengisi/mengosong sesuai persentase (nilai variable dianggap 0-100).
 *
 * Cara pasang:
 * 1. Taruh file ini di folder js/plugins/ project kamu.
 * 2. Buka Tools > Plugin Manager di editor RPG Maker MZ.
 * 3. Klik baris kosong, pilih plugin "BONCOS_HUD", set Status ON.
 * 4. Di parameter plugin, cocokkan ID Variable dengan nomor Utang,
 *    Saldo, dan Objektif yang sudah kamu buat (cek di Control Variables).
 * 5. Kalau mau HUD Utang/Saldo/Objektif cuma muncul mulai level tertentu,
 *    isi "ID Switch Penampil" dengan nomor switch itu — ini berlaku
 *    untuk KETIGA kotak sekaligus. Kosongkan (0) untuk selalu tampil
 *    dari awal game.
 *
 * CARA MENGISI TEKS OBJEKTIF (beda dari variable angka biasa):
 * 1. Di event, tambahkan command Control Variables.
 * 2. Pilih Variable "Objektif" (nomor 5, atau sesuai yang kamu set).
 * 3. Operation: Set.
 * 4. Operand: pilih "Script" (bukan Constant).
 * 5. Di kotak script, ketik teksnya DIAPIT TANDA KUTIP SATU, contoh:
 *      'Kuliah: Kumpulkan tugas besok'
 *    atau
 *      'Servis laptop yang rusak'
 * 6. Klik OK. Setiap kali kamu ganti isi Variable ini, kotak Objektif
 *    otomatis berubah.
 */

(() => {
  const pluginName = "BONCOS_HUD";
  const params = PluginManager.parameters(pluginName);
  const varUtang = Number(params["varUtang"] || 2);
  const varSaldo = Number(params["varSaldo"] || 1);
  const varObjektif = Number(params["varObjektif"] || 5);
  const varHari = Number(params["varHari"] || 11);
  const varGiliran = Number(params["varGiliran"] || 12);
  const varEnergi = Number(params["varEnergi"] || 13);
  const varNilai = Number(params["varNilai"] || 15);
  const switchAktif = Number(params["switchAktif"] || 0);

  function shouldShow() {
    if (switchAktif <= 0) return true;
    return $gameSwitches.value(switchAktif);
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
      const utang = $gameVariables.value(varUtang);
      const saldo = $gameVariables.value(varSaldo);

      const lineHeight = this.lineHeight();
      this.changeTextColor(ColorManager.textColor(2));
      this.drawText("Utang", 0, 0 * lineHeight, 120, "left");
      this.resetTextColor();
      this.drawText(
        "Rp" + utang.toLocaleString("id-ID"),
        0,
        0 * lineHeight,
        this.contents.width,
        "right"
      );

      this.changeTextColor(ColorManager.textColor(3));
      this.drawText("Saldo", 0, 1 * lineHeight, 120, "left");
      this.resetTextColor();
      this.drawText(
        "Rp" + saldo.toLocaleString("id-ID"),
        0,
        1 * lineHeight,
        this.contents.width,
        "right"
      );
    }
  }

  class Window_BoncosObjektif extends Window_Base {
    initialize() {
      const maxWidth = 300;
      // Persis di bawah box Utang/Saldo (box itu y=8, height=112)
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
      const words = text.split(" ");
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
      const nilai = $gameVariables.value(varObjektif);
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
      const hari = $gameVariables.value(varHari);
      const giliran = $gameVariables.value(varGiliran);
      const labelGiliran = giliran === 2 ? "Siang" : "Pagi";

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
      // Persis di bawah box Hari (box itu y=8, height=60)
      const x = Graphics.boxWidth - width - 8;
      const y = 8 + 60 + 8;
      const lh = this.lineHeight ? this.lineHeight() : 36;
      const rowHeight = lh + 24;
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
      const barX = 0;
      const barY = rowY + this.lineHeight() + 2;
      const barWidth = this.contents.width;
      const barHeight = 10;

      this.resetTextColor();
      this.drawText(label, 0, rowY, this.contents.width, "left");

      // Latar bar (kosong)
      this.contents.fillRect(barX, barY, barWidth, barHeight, "#4a4a4a");
      // Isi bar sesuai persentase
      const fillWidth = Math.round(barWidth * rate);
      if (fillWidth > 0) {
        this.contents.gradientFillRect(
          barX,
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
      const energi = $gameVariables.value(varEnergi);
      const nilai = $gameVariables.value(varNilai);

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
