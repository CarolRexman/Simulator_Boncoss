//=============================================================================
// BONCOS_TalkSound.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Suara "blip" tiap karakter teks muncul (gaya Undertale).
 * @author BONCOS
 *
 * @param seName
 * @text Nama File SE
 * @type file
 * @dir audio/se/
 * @default Cursor2
 *
 * @param volume
 * @text Volume
 * @type number
 * @default 40
 * @min 0
 * @max 100
 *
 * @param pitchMin
 * @text Pitch Minimum
 * @type number
 * @default 90
 *
 * @param pitchMax
 * @text Pitch Maximum
 * @type number
 * @default 115
 *
 * @param charSkip
 * @text Bunyi Tiap Berapa Karakter
 * @type number
 * @default 1
 * @min 1
 *
 * @help
 * Memainkan efek suara pendek setiap beberapa karakter teks muncul di
 * jendela Show Text — mirip suara "gumaman"/blip khas Undertale.
 * Ini BUKAN dialog suara sungguhan, cuma bunyi klik/blip pendek yang
 * diulang-ulang dengan pitch acak biar terasa hidup dan tidak monoton.
 *
 * CARA PASANG:
 * 1. Siapkan file suara pendek (.ogg atau .m4a), taruh di folder
 *    audio/se/ project kamu. Bisa pakai SE bawaan RPG Maker (misal
 *    "Cursor2", "Book1", "Switch2" — coba-coba mana yang paling mirip
 *    "blip"), atau upload suara pendekmu sendiri ke folder itu.
 * 2. Taruh file plugin ini di js/plugins/.
 * 3. Tools > Plugin Manager > tambahkan "BONCOS_TalkSound", Status ON.
 * 4. Atur parameter:
 *    - Nama File SE: klik kotaknya, browse file suara yang mau dipakai.
 *    - Volume: makin kecil makin halus, jangan terlalu keras (40-an
 *      biasanya pas, tidak mengganggu).
 *    - Pitch Minimum/Maximum: rentang nada acak tiap bunyi, biar
 *      variatif (contoh 90-115). Rentang lebih lebar = lebih ramai.
 *    - Bunyi Tiap Berapa Karakter: isi 1 untuk bunyi di HAMPIR setiap
 *      huruf (paling mirip Undertale). Isi 2-3 kalau ingin lebih jarang
 *      dan tidak berisik.
 * 5. Ctrl+S, lalu test play — jalankan Show Text apapun, dengarkan.
 *
 * CATATAN: efek ini otomatis berlaku ke SEMUA Show Text di seluruh
 * game begitu plugin aktif — tidak perlu diatur manual di tiap event.
 */

(() => {
  const pluginName = "BONCOS_TalkSound";
  const params = PluginManager.parameters(pluginName);
  const seName = params["seName"] || "Cursor2";
  const volume = Number(params["volume"] || 40);
  const pitchMin = Number(params["pitchMin"] || 90);
  const pitchMax = Number(params["pitchMax"] || 115);
  const charSkip = Number(params["charSkip"] || 1);

  let charCounter = 0;

  const _Window_Message_processCharacter =
    Window_Message.prototype.processCharacter;
  Window_Message.prototype.processCharacter = function (textState) {
    const c = textState.text[textState.index];
    _Window_Message_processCharacter.call(this, textState);

    if (c && c !== " " && c !== "\n") {
      charCounter++;
      if (charCounter >= charSkip) {
        charCounter = 0;
        const pitch =
          pitchMin + Math.floor(Math.random() * (pitchMax - pitchMin + 1));
        AudioManager.playSe({
          name: seName,
          volume: volume,
          pitch: pitch,
          pan: 0,
        });
      }
    }
  };

  const _Window_Message_newPage = Window_Message.prototype.newPage;
  Window_Message.prototype.newPage = function (textState) {
    charCounter = 0;
    _Window_Message_newPage.call(this, textState);
  };
})();