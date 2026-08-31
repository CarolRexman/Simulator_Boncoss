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
 *
 * Cara pasang:
 * 1. Taruh file ini di folder js/plugins/ project kamu.
 * 2. Buka Tools > Plugin Manager di editor RPG Maker MZ.
 * 3. Klik baris kosong, pilih plugin "BONCOS_HUD", set Status ON.
 * 4. Di parameter plugin, cocokkan ID Variable dengan nomor Utang,
 *    Saldo, dan Objektif yang sudah kamu buat (cek di Control Variables).
 * 5. Kalau mau HUD Utang/Saldo cuma muncul mulai level tertentu, isi
 *    "ID Switch Penampil" dengan nomor switch itu. Kosongkan (0) untuk
 *    selalu tampil dari awal game. (Kotak Objektif SELALU tampil,
 *    tidak dipengaruhi switch ini.)
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
      const width = 260;
      const height = 76;
      // Persis di bawah box Utang/Saldo (box itu y=8, height=112)
      const x = 8;
      const y = 8 + 112 + 8;
      const rect = new Rectangle(x, y, width, height);
      super.initialize(rect);
      this.opacity = 200;
      this.refresh();
    }

    update() {
      super.update();
      this.refresh();
    }

    refresh() {
      this.contents.clear();
      const nilai = $gameVariables.value(varObjektif);
      const teks = nilai ? String(nilai) : "";

      this.changeTextColor(ColorManager.textColor(14));
      this.drawText("OBJEKTIF", 0, 0, this.contents.width, "left");
      this.resetTextColor();
      this.drawTextEx(teks, 0, this.lineHeight(), this.contents.width);
    }
  }

  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function () {
    _Scene_Map_createAllWindows.call(this);
    this._boncosHudWindow = new Window_BoncosHUD();
    this.addWindow(this._boncosHudWindow);
    this._boncosObjektifWindow = new Window_BoncosObjektif();
    this.addWindow(this._boncosObjektifWindow);
  };
})();