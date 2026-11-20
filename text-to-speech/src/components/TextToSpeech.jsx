import { useEffect, useState } from "react";

function TextToSpeech() {

  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ml");

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);

  // Available languages

  const languages = [
    { name: "English", code: "en", speech: "en-US" },
    { name: "Malayalam", code: "ml", speech: "ml-IN" },
    { name: "Hindi", code: "hi", speech: "hi-IN" },
    { name: "Tamil", code: "ta", speech: "ta-IN" },
    { name: "Arabic", code: "ar", speech: "ar-SA" },
    { name: "French", code: "fr", speech: "fr-FR" },
    { name: "Spanish", code: "es", speech: "es-ES" },
    { name: "German", code: "de", speech: "de-DE" },
  ];

  const selectedLanguage = languages.find(
    (lang) => lang.code === targetLang
  );

  // Load available voices

  useEffect(() => {

    const loadVoices = () => {
      const availableVoices =
        window.speechSynthesis.getVoices();

      setVoices(availableVoices);
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };

  }, []);

  // Get voices for selected language

  const filteredVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(
      selectedLanguage.speech.split("-")[0].toLowerCase()
    )
  );

  // Translate text

  const translateText = async () => {

    if (!text.trim()) {
      alert("Please enter some text!");
      return;
    }

    if (sourceLang === targetLang) {
      setTranslatedText(text);
      setStatus("Translation not required");
      return;
    }

    // MyMemory allows up to 500 bytes per request

    const byteLength = new TextEncoder().encode(text).length;

    if (byteLength > 500) {
      alert("Please enter shorter text (maximum 500 bytes).");
      return;
    }

    setLoading(true);
    setStatus("Translating...");
    setTranslatedText("");

    window.speechSynthesis.cancel();

    try {

      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLang}|${targetLang}`,
        mt: "1"
      });

      const response = await fetch(
        `https://api.mymemory.translated.net/get?${params}`
      );

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();

      if (data.responseStatus !== 200) {
        throw new Error(
          data.responseDetails || "Translation unavailable"
        );
      }

      // Decode HTML entities

      const decodedText = new DOMParser()
        .parseFromString(
          data.responseData.translatedText,
          "text/html"
        )
        .documentElement.textContent;

      setTranslatedText(decodedText);
      setStatus("Translation completed");

    } catch (error) {

      console.error(error);
      setStatus("Translation failed");
      alert(error.message);

    } finally {

      setLoading(false);

    }

  };

  // Speak translated text

  const speakText = () => {

    if (!translatedText.trim()) {
      alert("Please translate your text first!");
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
      translatedText
    );

    speech.lang = selectedLanguage.speech;
    speech.rate = Number(speed);
    speech.pitch = Number(pitch);

    const voice = voices.find(
      (v) => v.voiceURI === selectedVoice
    );

    if (voice) {
      speech.voice = voice;
    }

    speech.onstart = () => setStatus("Speaking");

    speech.onend = () => setStatus("Finished");

    speech.onerror = () => setStatus("Speech error");

    window.speechSynthesis.speak(speech);

  };

  // Pause

  const pauseSpeech = () => {

    window.speechSynthesis.pause();
    setStatus("Paused");

  };

  // Resume

  const resumeSpeech = () => {

    window.speechSynthesis.resume();
    setStatus("Speaking");

  };

  // Stop

  const stopSpeech = () => {

    window.speechSynthesis.cancel();
    setStatus("Stopped");

  };

  // Clear

  const clearText = () => {

    window.speechSynthesis.cancel();

    setText("");
    setTranslatedText("");
    setStatus("Ready");

  };

  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">

        <h1 className="text-3xl font-bold text-center text-slate-800">
          Multilingual Text to Speech
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Translate your text and convert it into speech.
        </p>

        {/* Input */}

        <label className="font-semibold">
          Enter Your Text
        </label>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setTranslatedText("");
          }}
          placeholder="Enter your text here..."
          rows="5"
          className="w-full border rounded-xl p-4 mt-2 mb-5"
        />

        {/* Source Language */}

        <label className="font-semibold">
          Translate From
        </label>

        <select
          value={sourceLang}
          onChange={(e) => {
            setSourceLang(e.target.value);
            setTranslatedText("");
          }}
          className="w-full border rounded-lg p-3 mt-2 mb-5"
        >

          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}

        </select>

        {/* Target Language */}

        <label className="font-semibold">
          Translate To
        </label>

        <select
          value={targetLang}
          onChange={(e) => {
            setTargetLang(e.target.value);
            setSelectedVoice("");
            setTranslatedText("");
          }}
          className="w-full border rounded-lg p-3 mt-2 mb-5"
        >

          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}

        </select>

        {/* Translate Button */}

        <button
          onClick={translateText}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Translating..." : "Translate Text"}
        </button>

        {/* Translated Text */}

        {translatedText && (

          <div className="mt-6">

            <label className="font-semibold">
              Translated Text
            </label>

            <div className="bg-blue-50 border rounded-xl p-4 mt-2">

              <p className="text-lg">
                {translatedText}
              </p>

            </div>

          </div>

        )}

        {/* Voice Selection */}

        <div className="mt-6">

          <label className="font-semibold">
            Select Voice
          </label>

          <select
            value={selectedVoice}
            onChange={(e) =>
              setSelectedVoice(e.target.value)
            }
            className="w-full border rounded-lg p-3 mt-2"
          >

            <option value="">
              Default language voice
            </option>

            {filteredVoices.map((voice) => (

              <option
                key={voice.voiceURI}
                value={voice.voiceURI}
              >
                {voice.name} ({voice.lang})
              </option>

            ))}

          </select>

          {filteredVoices.length === 0 && (
            <p className="text-sm text-orange-600 mt-2">
              No matching voice is installed on your device.
            </p>
          )}

        </div>

        {/* Speed */}

        <div className="mt-6">

          <div className="flex justify-between">
            <label className="font-semibold">
              Speaking Speed
            </label>

            <span>{Number(speed).toFixed(1)}x</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full mt-3"
          />

        </div>

        {/* Pitch */}

        <div className="mt-5">

          <div className="flex justify-between">
            <label className="font-semibold">
              Voice Pitch
            </label>

            <span>{Number(pitch).toFixed(1)}</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="w-full mt-3"
          />

        </div>

        {/* Speech Controls */}

        <div className="grid grid-cols-2 gap-3 mt-7">

          <button
            onClick={speakText}
            className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            ▶ Speak
          </button>

          <button
            onClick={pauseSpeech}
            className="bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600"
          >
            ⏸ Pause
          </button>

          <button
            onClick={resumeSpeech}
            className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            ▶ Resume
          </button>

          <button
            onClick={stopSpeech}
            className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700"
          >
            ■ Stop
          </button>

        </div>

        <button
          onClick={clearText}
          className="w-full border py-3 rounded-lg mt-3 hover:bg-gray-100"
        >
          Clear All
        </button>

        {/* Status */}

        <div className="text-center mt-6">

          <p className="font-semibold text-gray-600">
            Status: {status}
          </p>

        </div>

      </div>

    </div>

  );

}

export default TextToSpeech;