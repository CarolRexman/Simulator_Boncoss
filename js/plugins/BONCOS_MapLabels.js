//=============================================================================
// BONCOS_MapLabels.js
//=============================================================================
/*~struct~Label:
 * @param mapId
 * @text ID Map
 * @type number
 * @desc Nomor map tempat label ini muncul (lihat angka di nama file map, misal MAP003 = 3)
 * @default 1
 *
 * @param x
 * @text Posisi X (tile)
 * @type number
 * @desc Koordinat X tile tempat pintu/gedung berada
 * @default 0
 *
 * @param y
 * @text Posisi Y (tile)
 * @type number
 * @desc Koordinat Y tile tempat pintu/gedung berada
 * @default 0
 *
 * @param text
 * @text Teks Label
 * @type string
 * @desc Nama gedung yang ditampilkan, misal "KOS" atau "KAMPUS"
 * @default KOS
 */
/*:
 * @target MZ
 * @plugindesc Menampilkan teks nama gedung di atas tile tertentu di map (ikut scroll kamera).
 * @author BONCOS
 *
 * @param labels
 * @text Daftar Label
 * @type struct<Label>[]
 * @desc Daftar semua label nama gedung di seluruh map project kamu
 * @default []
 *
 * @help
 * Menampilkan teks kecil melayang di atas tile tertentu (misal di atas
 * pintu), menunjukkan nama gedung/ruangan. Teksnya IKUT SCROLL KAMERA,
 * beda dari HUD yang nempel di layar.
 *
 * CARA PAKAI:
 * 1. Tools > Plugin Manager > tambahkan "BONCOS_MapLabels", Status ON.
 * 2. Klik plugin ini, buka parameter "Daftar Label".
 * 3. Klik tombol untuk tambah baris baru, isi:
 *    - ID Map: nomor map (cek di Map Properties atau nama filenya)
 *    - Posisi X / Y (tile): koordinat tile tempat pintu berada. Cara
 *      cepat cari koordinat: buka map di editor, arahkan mouse ke
 *      tile pintu, lihat pojok kanan bawah status bar — biasanya
 *      menampilkan koordinat X,Y saat itu juga.
 *    - Teks Label: nama yang mau ditampilkan, misal "KOS", "KAMPUS",
 *      "MARKETPLACE".
 * 4. Ulangi untuk tiap pintu/gedung yang mau dikasih label.
 * 5. Ctrl+S, lalu test play — label muncul otomatis saat kamu buka
 *    map yang sesuai, melayang tepat di atas tile yang kamu tentukan.
 *
 * Label otomatis mengikuti scroll kamera dan otomatis tersembunyi
 * kalau map yang sedang dibuka bukan map yang cocok dengan ID Map-nya.
 */

(() => {
  const pluginName = "BONCOS_MapLabels";
  const params = PluginManager.parameters(pluginName);
  const labelData = JSON.parse(params["labels"] || "[]").map((str) => {
    const obj = JSON.parse(str);
    return {
      mapId: Number(obj.mapId),
      x: Number(obj.x),
      y: Number(obj.y),
      text: obj.text,
    };
  });

  class Sprite_BoncosLabel extends Sprite {
    initialize(labelInfo) {
      super.initialize();
      this._labelInfo = labelInfo;
      this.bitmap = new Bitmap(200, 36);
      this.bitmap.fontSize = 20;
      this.bitmap.outlineWidth = 4;
      this.bitmap.outlineColor = "rgba(0, 0, 0, 0.8)";
      this.bitmap.textColor = "#ffffff";
      this.bitmap.drawText(labelInfo.text, 0, 0, 200, 36, "center");
      this.anchor.x = 0.5;
      this.anchor.y = 1;
    }

    update() {
      super.update();
      const tw = $gameMap.tileWidth();
      const th = $gameMap.tileHeight();
      this.x = Math.round(
        ($gameMap.adjustX(this._labelInfo.x) + 0.5) * tw
      );
      this.y = Math.round($gameMap.adjustY(this._labelInfo.y) * th);
    }
  }

  const _Spriteset_Map_createLowerLayer =
    Spriteset_Map.prototype.createLowerLayer;
  Spriteset_Map.prototype.createLowerLayer = function () {
    _Spriteset_Map_createLowerLayer.call(this);
    this.createBoncosLabels();
  };

  Spriteset_Map.prototype.createBoncosLabels = function () {
    this._boncosLabelSprites = [];
    const currentMapId = $gameMap.mapId();
    for (const info of labelData) {
      if (info.mapId === currentMapId) {
        const sprite = new Sprite_BoncosLabel(info);
        this._boncosLabelSprites.push(sprite);
        this._tilemap.addChild(sprite);
      }
    }
  };
})();
