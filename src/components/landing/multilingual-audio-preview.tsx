'use client';

import { useState } from 'react';
import { Volume2, Languages, Sparkles, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LANGUAGE_SAMPLES = [
  {
    code: 'en',
    lang: 'English',
    native: 'English',
    text: '"The bidder must demonstrate a minimum average annual turnover of ₹15.00 Crore over the last three financial years (2023, 2024, 2025)."',
    audioTranscript: 'Explanation: Audited turnover requirement verified against balance sheet.'
  },
  {
    code: 'hi',
    lang: 'Hindi',
    native: 'हिन्दी',
    text: '"बोलीदाता को पिछले तीन वित्तीय वर्षों में औसतन ₹15.00 करोड़ का न्यूनतम वार्षिक वित्तीय कारोबार प्रस्तुत करना होगा।"',
    audioTranscript: 'स्पष्टीकरण: बैलेंस शीट से सत्यापित टर्नओवर आवश्यकता।'
  },
  {
    code: 'bn',
    lang: 'Bengali',
    native: 'বাংলা',
    text: '"দরদাতাকে বিগত ৩ অর্থবর্ষে গড়ে ন্যূনতম ₹১৫.০০ কোটি টাকার বার্ষিক লেনদেনের প্রমাণ দাখিল করতে হবে।"',
    audioTranscript: 'ব্যাখ্যা: ব্যালেন্স শীট থেকে নিরীক্ষিত লেনদেনের যাচাই সম্পন্ন হয়েছে।'
  },
  {
    code: 'kn',
    lang: 'Kannada',
    native: 'ಕನ್ನಡ',
    text: '"ಬಿಡ್ಡರ್ ಕಳೆದ 3 ಹಣಕಾಸು ವರ್ಷಗಳಲ್ಲಿ ಸರಾಸರಿ ₹15.00 ಕೋಟಿ ಕನಿಷ್ಠ ವಾರ್ಷಿಕ ವಹಿವಾಟನ್ನು ತೋರಿಸಬೇಕು."',
    audioTranscript: 'ವಿವರಣೆ: ಬ್ಯಾಲೆನ್ಸ್ ಶೀಟ್‌ನಿಂದ ಲೆಕ್ಕಪರಿಶೋಧಿತ ವಹಿವಾಟನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.'
  },
  {
    code: 'mr',
    lang: 'Marathi',
    native: 'मराठी',
    text: '"बोलीदाराने मागील ३ आर्थिक वर्षांत सरासरी किमान ₹१५.०० कोटींची वार्षिक उलाढाल सिद्ध करणे आवश्यक आहे."',
    audioTranscript: 'स्पष्टीकरण: ताळेबंदातून तपासलेली उलाढाल अट.'
  },
  {
    code: 'ta',
    lang: 'Tamil',
    native: 'தமிழ்',
    text: '"ஏலதாரர் கடந்த 3 நிதியாண்டுகளில் சராசரியாக குறைந்தபட்சம் ₹15.00 கோடி ஆண்டு நிதி விற்றுமுதலைக் கொண்டிருக்க வேண்டும்."',
    audioTranscript: 'விளக்கம்: இருப்புநிலைக் குறிப்பிலிருந்து சரிபார்க்கப்பட்ட விற்றுமுதல் விவரம்.'
  },
  {
    code: 'te',
    lang: 'Telugu',
    native: 'తెలుగు',
    text: '"బిడ్డర్ గత 3 ఆర్థిక సంవత్సరాల్లో సగటున ₹15.00 కోట్ల వార్షಿಕ ఆర్థిక టర్నోవర్‌ను నిరూపించాలి."',
    audioTranscript: 'వివరణ: బ్యాలెన్స్ షీట్ నుండి ధృవీకరించబడిన టర్నోవర్.'
  }
];

export function MultilingualAudioPreview() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const current = LANGUAGE_SAMPLES.find(l => l.code === selectedLang) || LANGUAGE_SAMPLES[0];

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8 shadow-xs text-[#111111]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#555555] flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" /> 
              <span>Inclusive Procurement Accessibility</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-light tracking-tight text-[#111111] mt-1">
            Multilingual Intelligence & Audio Readout
          </h3>
          <p className="text-xs text-[#555555] mt-0.5">
            Empowering MSMEs and regional contractors across 11 Indian languages with voice explanations.
          </p>
        </div>

        {/* Audio Listen Pill */}
        <Button
          size="sm"
          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
          className={`gap-2 shrink-0 font-medium ${
            isPlayingAudio 
              ? 'bg-[#111111] text-white hover:bg-[#222222]' 
              : 'bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111] hover:bg-[#EAEAEA]'
          }`}
        >
          <Volume2 className="h-4 w-4" />
          <span>{isPlayingAudio ? 'Narration Active' : 'Listen Explanation'}</span>
        </Button>
      </div>

      {/* Language Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LANGUAGE_SAMPLES.map((lang) => {
          const isSelected = lang.code === selectedLang;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                isSelected 
                  ? 'bg-[#111111] text-white font-semibold' 
                  : 'bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#333333] border border-[#E5E5E5]'
              }`}
            >
              <span>{lang.native}</span>
              <span className="text-[10px] opacity-70">({lang.lang})</span>
            </button>
          );
        })}
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#555555]">
            <span className="flex items-center gap-1.5 font-semibold text-[#111111]">
              <Sparkles className="h-3.5 w-3.5" /> Instant Regional Translation Preview
            </span>
            <span className="text-[#555555] font-semibold">{current.lang}</span>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-[#111111] font-normal">
            {current.text}
          </p>

          {/* Audio Waveform */}
          {isPlayingAudio && (
            <div className="pt-3 border-t border-[#E5E5E5] flex items-center gap-3 text-xs font-mono text-[#111111]">
              <Radio className="h-4 w-4 text-[#111111]" />
              <span className="text-[#555555] truncate">{current.audioTranscript}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}