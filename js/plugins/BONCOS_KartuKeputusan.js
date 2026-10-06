//=============================================================================
// BONCOS_KartuKeputusan.js
//=============================================================================
/*~struct~Opsi:
 * @param label
 * @text Teks Pilihan
 * @type string
 * @desc Teks tombol pilihan, misal "Masuk kelas"
 * @default
 *
 * @param efek
 * @text Rincian Efek (preview)
 * @type string[]
 * @desc Baris-baris preview efek, misal "+10 Nilai" / "-10 Energi". Awali dengan + (hijau) atau - (merah).
 * @default []
 */
/*:
 * @target MZ
 * @plugindesc Kartu keputusan besar di tengah layar, menampilkan rincian efek tiap pilihan (preview, bukan otomatis diterapkan).
 * @author BONCOS
 *
 * @command ShowCard
 * @text Tampilkan Kartu Keputusan
 * @desc Menampilkan kartu besar di tengah layar dengan beberapa pilihan + preview efeknya.
 *
 * @arg judul
 * @text Judul / Narasi Singkat
 * @type multiline_string
 * @default Apa yang kamu lakukan?
 *
 * @arg opsi
 * @text Daftar Opsi
 * @type struct<Opsi>[]
 * @default []
 *
 * @arg variableHasil
 * @text Variable Hasil Pilihan
 * @type variable
 * @desc Pilihan pemain (1, 2, 3, dst — sesuai urutan di Daftar Opsi) disimpan di sini.
 *
 * @help
 * CARA PAKAI DI EVENT
 * 1. Insert command -> Plugin Command -> BONCOS_KartuKeputusan -> "Tampilkan
 *    Kartu Keputusan".
 * 2. Isi "Judul / Narasi Singkat" (boleh beberapa baris).
 * 3. Di "Daftar Opsi", klik tombol tambah untuk tiap pilihan. Tiap pilihan
 *    punya "Teks Pilihan" (nama tombolnya) dan "Rincian Efek" (list baris
 *    preview, misal "+10 Nilai", "-25000 Saldo", "-10 Energi"). Baris yang
 *    diawali "+" otomatis ditampilkan hijau, yang diawali "-" otomatis merah.
 * 4. Pilih "Variable Hasil Pilihan" -- variable ini akan terisi 1, 2, 3, dst
 *    sesuai urutan opsi yang dipilih pemain.
 * 5. SETELAH command ini, tambahkan Conditional Branch seperti biasa untuk
 *    tiap kemungkinan (Variable Hasil = 1, = 2, dst), dan di dalam tiap
 *    cabang itu barulah kamu pasang Control Variables (Saldo, Energi, Nilai,
 *    dst) yang BENERAN mengubah angkanya -- PENTING: rincian efek di kartu
 *    ini CUMA PREVIEW VISUAL, tidak otomatis mengubah variable apapun.
 *    Kamu tetap isi efek aslinya manual di Conditional Branch, persis
 *    seperti waktu pakai Show Choices biasa.
 *
 * Ini supaya efeknya tetap gampang dicek/diubah satu-satu di event,
 * tanpa plugin ini "menyembunyikan" logic di balik layar.
 */

(() => {
  const pluginName = "BONCOS_KartuKeputusan";

  function parseOpsi(raw) {
    return JSON.parse(raw || "[]").map((str) => {
      const o = JSON.parse(str);
      return {
        label: o.label || "",
        efek: JSON.parse(o.efek || "[]"),
      };
    });
  }

  class Window_BoncosKartuJudul extends Window_Base {
    initialize(rect, judul) {
      super.initialize(rect);
      this._judul = judul || "";
      this.refresh();
    }

    wrapText(text, maxTextWidth) {
      const paragraphs = String(text).split("\n");
      const lines = [];
      paragraphs.forEach((para) => {
        const words = para.split(" ");
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
        lines.push(current);
      });
      return lines;
    }

    refresh() {
      this.contents.clear();
      const lines = this.wrapText(this._judul, this.contents.width);
      const lh = this.lineHeight();
      lines.forEach((line, i) => {
        this.drawText(line, 0, i * lh, this.contents.width, "center");
      });
    }
  }

  class Window_BoncosKartu extends Window_Selectable {
    initialize(rect, opsiList) {
      this._opsiList = opsiList || [];
      const maxEfek = Math.max(
        1,
        ...this._opsiList.map((o) => (o.efek || []).length)
      );
      this._computedItemHeight = 36 + 10 + maxEfek * 22 + 10;
      super.initialize(rect);
      this.refresh();
      this.select(0);
      this.activate();
    }

    maxCols() {
      return 1;
    }

    maxItems() {
      return this._opsiList.length;
    }

    itemHeight() {
      return this._computedItemHeight;
    }

    drawItemBackground(index) {
      if (index === this.index()) {
        const rect = this.itemRect(index);
        this.contents.fillRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          "rgba(255,255,255,0.12)"
        );
      }
    }

    drawItem(index) {
      const opt = this._opsiList[index];
      if (!opt) return;
      const rect = this.itemRect(index);
      const padX = 14;

      this.resetTextColor();
      this.contents.fontSize = 24;
      this.drawText(
        opt.label,
        rect.x + padX,
        rect.y + 6,
        rect.width - padX * 2,
        "left"
      );

      const efek = opt.efek || [];
      this.contents.fontSize = 18;
      efek.forEach((line, i) => {
        const trimmed = String(line).trim();
        let color = "#e0e0e0";
        if (trimmed.startsWith("+")) color = "#4fcfa0";
        else if (trimmed.startsWith("-")) color = "#ff6b6b";
        this.changeTextColor(color);
        this.drawText(
          trimmed,
          rect.x + padX + 10,
          rect.y + 38 + i * 22,
          rect.width - padX * 2 - 10,
          "left"
        );
      });
      this.contents.fontSize = $gameSystem.mainFontSize
        ? $gameSystem.mainFontSize()
        : 26;
      this.resetTextColor();
    }
  }

  Scene_Map.prototype.boncosTampilkanKartu = function (judul, opsiList, varHasil) {
    this._boncosKartuActive = true;

    const judulLines = String(judul).split("\n").length + 1;
    const judulHeight = judulLines * 36 + 24;

    const maxEfek = Math.max(1, ...opsiList.map((o) => (o.efek || []).length));
    const itemHeight = 36 + 10 + maxEfek * 22 + 10;
    const listHeight = itemHeight * opsiList.length + 16;

    const width = Math.min(620, Graphics.boxWidth - 60);
    const totalHeight = judulHeight + listHeight + 12;
    const x = Math.round((Graphics.boxWidth - width) / 2);
    const y = Math.round((Graphics.boxHeight - totalHeight) / 2);

    this._boncosJudulWindow = new Window_BoncosKartuJudul(
      new Rectangle(x, y, width, judulHeight),
      judul
    );
    this.addWindow(this._boncosJudulWindow);

    this._boncosKartuWindow = new Window_BoncosKartu(
      new Rectangle(x, y + judulHeight + 8, width, listHeight),
      opsiList
    );
    this._boncosKartuWindow.setHandler("ok", () => {
      const index = this._boncosKartuWindow.index();
      $gameVariables.setValue(varHasil, index + 1);
      SoundManager.playOk();
      this._boncosJudulWindow.close();
      this._boncosKartuWindow.close();
      this._boncosKartuActive = false;
    });
    this.addWindow(this._boncosKartuWindow);
  };

  PluginManager.registerCommand(pluginName, "ShowCard", function (args) {
    const judul = args.judul || "";
    const opsiList = parseOpsi(args.opsi);
    const varHasil = Number(args.variableHasil);

    const scene = SceneManager._scene;
    scene.boncosTampilkanKartu(judul, opsiList, varHasil);
    this.setWaitMode("boncosKartu");
  });

  const _Game_Interpreter_updateWaitMode =
    Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function () {
    if (this._waitMode === "boncosKartu") {
      const scene = SceneManager._scene;
      const waiting = !!(scene && scene._boncosKartuActive);
      if (!waiting) {
        this._waitMode = "";
      }
      return waiting;
    }
    return _Game_Interpreter_updateWaitMode.call(this);
  };
})();
