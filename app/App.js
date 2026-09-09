import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { LANGS, langMeta, translate, craftName } from './i18n';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
} from '@expo-google-fonts/mukta';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API = 'http://192.168.1.80:8000';

const { width: SCREEN_W } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Design tokens
//
// Two grounds, taken from the Ajrakh dyeing process itself:
//   "cloth"  = undyed cotton. Artisan-facing screens. Maximum legibility.
//   "indigo" = the dyed cloth. Buyer-facing screens. Quiet and editorial.
// The app moves from one to the other as the listing comes into being.
// ---------------------------------------------------------------------------

const C = {
  cloth: '#EFE7D8',
  clothSunk: '#E4D9C4',
  clothEdge: '#D3C4A8',
  ink: '#191713',
  inkSoft: '#5F584B',

  indigo: '#15243F',
  indigoLift: '#1E3157',
  indigoEdge: '#2C4573',
  resist: '#F0E7D6',
  resistSoft: '#A8B3C6',

  madder: '#9C3B2E',
  brass: '#B08C4F',
  leaf: '#4A6B52',
};

const T = {
  display: 'Fraunces_600SemiBold',
  displayLight: 'Fraunces_400Regular',
  body: 'Mukta_400Regular',
  bodyMed: 'Mukta_500Medium',
  bodyBold: 'Mukta_600SemiBold',
};

// ---------------------------------------------------------------------------
// Voice prompts. Each step speaks its instruction in Hindi on entry.
// Every spoken instruction also has a visible control, so the flow never
// depends on the microphone winning against a noisy room.
// ---------------------------------------------------------------------------

// Onboarding is three beats; text now comes from the strings table (ob1_*,
// ob2_*, ob3_*), this just holds the visual mark and which keys to read.
const ONBOARDING = [
  { mark: '◐', titleKey: 'ob1_title', bodyKey: 'ob1_body' },
  { mark: '◑', titleKey: 'ob2_title', bodyKey: 'ob2_body' },
  { mark: '●', titleKey: 'ob3_title', bodyKey: 'ob3_body' },
];

// The six crafts the classifier knows. The `en` value is the exact string
// the backend expects (pricing + listing key off it); `hi` is what the
// artisan sees. When we add more languages this becomes a per-language map.
const CRAFTS = [
  { id: 'ajrakh', en: 'Ajrakh block print', hi: 'अजरक छपाई' },
  { id: 'madhubani', en: 'Madhubani painting', hi: 'मधुबनी चित्रकला' },
  { id: 'channapatna', en: 'Channapatna toys', hi: 'चन्नपटना खिलौने' },
  { id: 'pattachitra', en: 'Pattachitra', hi: 'पट्टचित्र' },
  { id: 'bidri', en: 'Bidri', hi: 'बिदरी कारीगरी' },
  { id: 'phulkari', en: 'Phulkari', hi: 'फुलकारी' },
];

// Detected craft string -> our canonical craft object (loose match, since the
// classifier label and our en string may differ in spacing/case).
function matchCraft(detected) {
  if (!detected) return null;
  const d = detected.toLowerCase();
  return (
    CRAFTS.find((c) => d.includes(c.id)) ||
    CRAFTS.find((c) => c.en.toLowerCase() === d) ||
    null
  );
}

// The Chhaap marketplace needs to look alive on day one. These are curated
// placeholder listings shown behind whatever the artisan publishes live.
// `swatch` gives each a fabric-swatch cover in the absence of a photo.
const SEED_PRODUCTS = [
  { id: 'seed_1', craft: 'Madhubani painting', title: 'Fish & Lotus, natural pigment on handmade paper', price: 2400, swatch: '#7A2E2A', seed: true },
  { id: 'seed_2', craft: 'Phulkari', title: 'Bagh Phulkari dupatta, silk floss on khaddar', price: 3600, swatch: '#B0472F', seed: true },
  { id: 'seed_3', craft: 'Channapatna toys', title: 'Lacquered spinning top set, ivory-wood', price: 640, swatch: '#5A6E3A', seed: true },
  { id: 'seed_4', craft: 'Bidri', title: 'Bidriware vase, silver inlay on blackened alloy', price: 5200, swatch: '#2B2B33', seed: true },
  { id: 'seed_5', craft: 'Pattachitra', title: 'Tree of Life scroll, mineral colour on tussar', price: 4100, swatch: '#8A5A20', seed: true },
];

// Illustrative reach figures, stable per product (not live channel data).
function makeReach(id) {
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (salt, lo, hi) =>
    lo + (((seed * 9301 + salt * 49297) % 233280) % (hi - lo));
  return {
    ondc: { label: 'ONDC', views: pick(1, 60, 240), live: true },
    gem: { label: 'GeM', views: pick(2, 10, 60), live: true },
    whatsapp: { label: 'WhatsApp', views: pick(3, 4, 22), live: true },
    chhaap: { label: 'Chhaap', views: pick(4, 30, 150), live: true },
  };
}

function speak(text, tts = 'hi-IN') {
  Speech.stop();
  Speech.speak(text, { language: tts, rate: 0.92 });
}

// Spoken yes/no. Kept deliberately generous — artisans will not say
// a clean "haan" every time.
const YES = ['हाँ', 'हां', 'जी', 'ठीक', 'सही', 'भेज', 'हा', 'बिलकुल', 'ok', 'yes'];
const NO = ['नहीं', 'नही', 'रुक', 'गलत', 'बदल', 'no'];

function readIntent(transcript) {
  const t = (transcript || '').toLowerCase();
  if (NO.some((w) => t.includes(w))) return 'no';
  if (YES.some((w) => t.includes(w))) return 'yes';
  return 'unclear';
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Ground({ dyed, children }) {
  return (
    <View style={[s.ground, { backgroundColor: dyed ? C.indigo : C.cloth }]}>
      <StatusBar barStyle={dyed ? 'light-content' : 'dark-content'} />
      {children}
    </View>
  );
}

function StepMark({ step, dyed }) {
  // The block-printer's mark, repeated: one stamp per completed step.
  const total = 5;
  return (
    <View style={s.stepMark}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.stamp,
            {
              borderColor: dyed ? C.indigoEdge : C.clothEdge,
              backgroundColor:
                i < step ? (dyed ? C.brass : C.madder) : 'transparent',
            },
          ]}
        />
      ))}
    </View>
  );
}

function BigButton({ label, sub, onPress, disabled, tone = 'ink' }) {
  const bg =
    tone === 'ink' ? C.ink : tone === 'madder' ? C.madder : C.brass;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.bigBtn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={s.bigBtnLabel}>{label}</Text>
      {sub ? <Text style={s.bigBtnSub}>{sub}</Text> : null}
    </Pressable>
  );
}

function QuietButton({ label, onPress, dyed, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.quietBtn,
        {
          borderColor: dyed ? C.indigoEdge : C.clothEdge,
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        style={[s.quietBtnLabel, { color: dyed ? C.resistSoft : C.inkSoft }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SpeakAgain({ text, tts, label, dyed }) {
  return (
    <Pressable onPress={() => speak(text, tts)} style={s.speakAgain}>
      <Text
        style={[s.speakAgainLabel, { color: dyed ? C.resistSoft : C.inkSoft }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Working({ label, dyed }) {
  return (
    <View style={s.working}>
      <ActivityIndicator color={dyed ? C.brass : C.madder} />
      <Text style={[s.workingLabel, { color: dyed ? C.resistSoft : C.inkSoft }]}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
  });

  const [step, setStep] = useState('language');
  const [lang, setLang] = useState('hi');
  const [mode, setMode] = useState(null); // 'voice' | 'form'

  // login (mocked for the demo — no real auth backend)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [artisanName, setArtisanName] = useState('');

  // onboarding
  const [obSlide, setObSlide] = useState(0);

  const [photoUri, setPhotoUri] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [bgNote, setBgNote] = useState(null);
  const [craft, setCraft] = useState(null);
  const [craftConf, setCraftConf] = useState(null);

  const [transcript, setTranscript] = useState(null);
  const [listing, setListing] = useState(null);

  const [materialInr, setMaterialInr] = useState('');
  const [labourHours, setLabourHours] = useState('');
  const [pricing, setPricing] = useState(null);

  const [published, setPublished] = useState(null);

  // distribution section
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [distTab, setDistTab] = useState('reach');
  const [adLang, setAdLang] = useState('hi');
  const adCardRef = useRef(null);

  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const spokenFor = useRef(null);

  // Speak each step's instruction once, on entry, in voice mode.
  // login + onboarding narrate regardless, since mode isn't chosen yet.
  useEffect(() => {
    const preFlow = step === 'login' || step === 'onboarding' || step === 'mode';
    if (mode !== 'voice' && !preFlow) return;
    if (spokenFor.current === step) return;
    spokenFor.current = step;
    const promptKey = {
      login: 'p_login',
      mode: 'p_mode',
      capture: 'p_capture',
      describe: 'p_describe',
      listing: 'p_listing',
      price: 'p_price',
      publish: 'p_publish',
    }[step];
    let line = promptKey ? t(promptKey) : null;
    if (step === 'confirm') line = t(craft ? 'p_confirm' : 'p_confirm_none');
    if (step === 'onboarding') line = t('ob1_body');
    if (line) setTimeout(() => speak(line, tts), 450);
  }, [step, mode]);

  useEffect(() => {
    (async () => {
      await AudioModule.requestRecordingPermissionsAsync();
    })();
  }, []);

  if (!fontsLoaded) {
    return (
      <Ground dyed={false}>
        <View style={s.center}>
          <ActivityIndicator color={C.madder} />
        </View>
      </Ground>
    );
  }

  // -- language helpers ----------------------------------------------------

  const meta = langMeta(lang);
  const tts = meta.tts;
  const t = (key, vars) => translate(lang, key, vars);
  const say = (key, vars) => speak(t(key, vars), tts);

  // -- network -------------------------------------------------------------

  async function upload(path, uri, fieldName, parameters) {
    const res = await FileSystem.uploadAsync(`${API}${path}`, uri, {
      fieldName,
      httpMethod: 'POST',
      uploadType: 1,
      parameters: parameters || undefined,
    });
    if (res.status >= 400) throw new Error(`${path} failed (${res.status})`);
    return JSON.parse(res.body);
  }

  async function postJson(path, body) {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} failed (${res.status})`);
    return res.json();
  }

  // -- actions -------------------------------------------------------------

  async function takePhoto() {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(t('err_cam'));
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (shot.canceled) return;

    const uri = shot.assets[0].uri;
    setPhotoUri(uri);
    setBusy(t('work_reading'));

    try {
      const [cls, enh] = await Promise.all([
        upload('/v1/vision/classify', uri, 'image'),
        upload('/v1/vision/enhance', uri, 'image'),
      ]);
      const top = cls.candidates[0];
      const detected = top.craft ?? top.label ?? top.name;
      const matched = matchCraft(detected);
      setCraft(matched ? matched.en : null); // only trust it if it's one of our six
      setCraftConf(top.score ?? top.confidence);
      setEnhanced(`data:image/jpeg;base64,${enh.image_base64}`);
      setBgNote(enh.background);
      setStep('confirm');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function startRecording() {
    setError(null);
    Speech.stop();
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }

  async function stopRecording() {
    setRecording(false);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setError(t('err_rec'));
      return;
    }
    setBusy(t('work_listening'));
    try {
      const whisper = meta.whisper || 'hi'; // Odia has no Whisper model -> fallback
      const tr = await upload('/v1/listing/transcribe', uri, 'audio', {
        language: whisper,
      });
      setTranscript(tr.transcript);

      setBusy(t('work_preparing'));
      const lst = await postJson('/v1/listing/generate', {
        transcript: tr.transcript,
        craft,
        target_lang: meta.en, // e.g. "Tamil" — backend writes the local listing in this
      });
      setListing(lst);

      if (lst.cost?.material_inr != null)
        setMaterialInr(String(lst.cost.material_inr));
      if (lst.cost?.labour_hours != null)
        setLabourHours(String(lst.cost.labour_hours));

      setStep('listing');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function getPrice() {
    setError(null);
    setBusy(t('work_pricing'));
    try {
      const p = await postJson('/v1/pricing/estimate', {
        description: listing.en.title,
        material_inr: Number(materialInr) || 0,
        labour_hours: Number(labourHours) || 0,
      });
      setPricing(p);
      setStep('price');
      if (mode === 'voice') {
        setTimeout(
          () => speak(t('p_price_say', { price: p.recommended_inr }), tts),
          600
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setError(null);
    setBusy(t('work_sending'));
    try {
      const pid = `prd_${Date.now()}`;
      const out = await postJson('/v1/publish', {
        product_id: pid,
        listing,
        price_inr: pricing.recommended_inr,
        craft,
        image_url: 'https://chhaap.local/placeholder.jpg',
      });
      setPublished(out);

      // add the live product to the marketplace, newest first
      const product = {
        id: pid,
        craft,
        title: listing.en.title,
        titleHi: (listing.local || listing.hi)?.title,
        story: listing.en.story,
        storyHi: (listing.local || listing.hi)?.story,
        price: pricing.recommended_inr,
        image: enhanced,
        reach: makeReach(pid),
        qr: out.qr_base64,
        microsite: out.microsite_url,
        mine: true,
      };
      setProducts((prev) => [product, ...prev]);

      setStep('publish');
      if (mode === 'voice') setTimeout(() => speak(t('p_done'), tts), 500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const myProduct = products.find((p) => p.mine) || null;

  async function shareAd() {
    setError(null);
    try {
      const uri = await captureRef(adCardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        setError(t('err_share'));
      }
    } catch (e) {
      setError(t('err_share'));
    }
  }

  function restart() {
    Speech.stop();
    spokenFor.current = null;
    setStep('capture');
    setPhotoUri(null);
    setEnhanced(null);
    setCraft(null);
    setCraftConf(null);
    setTranscript(null);
    setListing(null);
    setMaterialInr('');
    setLabourHours('');
    setPricing(null);
    setPublished(null);
    setError(null);
  }

  const dyed = ['listing', 'price', 'publish'].includes(step);
  const stepIndex = { mode: 0, capture: 0, confirm: 1, describe: 1, listing: 2, price: 3, publish: 5 }[step];

  // -- screens -------------------------------------------------------------

  function ErrorNote() {
    if (!error) return null;
    return (
      <View style={[s.errorNote, { borderColor: dyed ? C.madder : C.madder }]}>
        <Text style={[s.errorText, { color: dyed ? C.resist : C.ink }]}>{error}</Text>
      </View>
    );
  }

  if (step === 'language') {
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.langHead}>
            <Text style={s.wordmark}>Chhaap</Text>
            <Text style={s.wordmarkHi}>छाप</Text>
          </View>
          <Text style={s.langTitle}>अपनी भाषा चुनिए</Text>
          <Text style={s.langTitleEn}>Choose your language</Text>

          <View style={s.langGrid}>
            {LANGS.map((l) => {
              const selected = lang === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    setLang(l.code);
                    speak(translate(l.code, 'pick_title'), l.tts);
                  }}
                  style={({ pressed }) => [
                    s.langTile,
                    {
                      borderColor: selected ? C.madder : C.clothEdge,
                      backgroundColor: selected ? C.madder : C.clothSunk,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[s.langNative, { color: selected ? C.cloth : C.ink }]}>
                    {l.native}
                  </Text>
                  <Text
                    style={[
                      s.langEn,
                      { color: selected ? C.cloth : C.inkSoft },
                    ]}
                  >
                    {l.en}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 8 }} />
          <BigButton
            label={translate(lang, 'login_next')}
            tone="ink"
            onPress={() => {
              spokenFor.current = null;
              setStep('login');
            }}
          />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'login') {
    const phoneOk = phone.replace(/\D/g, '').length === 10;
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.loginTop}>
            <Text style={s.wordmark}>Chhaap</Text>
            <Text style={s.wordmarkHi}>छाप</Text>
            <Text style={s.wordmarkNote}>{t('tagline')}</Text>
          </View>

          {!otpSent ? (
            <View style={s.loginBlock}>
              <Text style={s.loginLabel}>{t('login_enter_phone')}</Text>
              <View style={s.phoneRow}>
                <Text style={s.phonePrefix}>+91</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="00000 00000"
                  placeholderTextColor={C.clothEdge}
                  style={s.phoneInput}
                />
              </View>
              <View style={{ height: 20 }} />
              <BigButton
                label={t('login_next')}
                tone="ink"
                disabled={!phoneOk}
                onPress={() => {
                  setOtpSent(true);
                  Speech.stop();
                }}
              />
              <Text style={s.loginFine}>{t('login_terms')}</Text>
            </View>
          ) : (
            <View style={s.loginBlock}>
              <Text style={s.loginLabel}>
                {t('login_enter_otp', { phone: `+91 ${phone}` })}
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="— — — —"
                placeholderTextColor={C.clothEdge}
                style={s.otpInput}
              />
              <View style={{ height: 20 }} />
              <BigButton
                label={t('login_confirm')}
                tone="ink"
                disabled={otp.replace(/\D/g, '').length < 4}
                onPress={() => {
                  spokenFor.current = null;
                  setStep('onboarding');
                }}
              />
              <Pressable onPress={() => setOtpSent(false)}>
                <Text style={s.loginFine}>{t('login_change')}</Text>
              </Pressable>
              <Text style={[s.loginFine, { color: C.brass }]}>
                {t('login_demo')}
              </Text>
            </View>
          )}

          {mode !== 'form' ? (
            <Pressable onPress={() => say('p_login')} style={s.speakAgain}>
              <Text style={[s.speakAgainLabel, { color: C.inkSoft }]}>
                {t('speak_again')}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'onboarding') {
    const slide = ONBOARDING[obSlide];
    const last = obSlide === ONBOARDING.length - 1;
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.obTop}>
            <Pressable
              onPress={() => {
                Speech.stop();
                spokenFor.current = null;
                setStep('mode');
              }}
            >
              <Text style={s.obSkip}>{t('ob_skip')}</Text>
            </Pressable>
          </View>

          <View style={s.obBody}>
            <Text style={s.obMark}>{slide.mark}</Text>
            <Text style={s.obTitle}>{t(slide.titleKey)}</Text>
            <Text style={s.obText}>{t(slide.bodyKey)}</Text>
          </View>

          <View style={s.obDots}>
            {ONBOARDING.map((_, i) => (
              <View
                key={i}
                style={[
                  s.obDot,
                  { backgroundColor: i === obSlide ? C.madder : C.clothEdge },
                ]}
              />
            ))}
          </View>

          <BigButton
            label={last ? t('ob_start') : t('ob_next')}
            tone="ink"
            onPress={() => {
              if (last) {
                Speech.stop();
                spokenFor.current = null;
                setStep('mode');
              } else {
                const next = obSlide + 1;
                setObSlide(next);
                say(ONBOARDING[next].bodyKey);
              }
            }}
          />

          <Pressable onPress={() => say(slide.bodyKey)}>
            <Text style={[s.speakAgainLabel, { color: C.inkSoft, textAlign: 'center', marginTop: 22 }]}>
              {t('speak_again')}
            </Text>
          </Pressable>
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'mode') {
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.wordmarkBlock}>
            <Text style={s.wordmark}>Chhaap</Text>
            <Text style={s.wordmarkHi}>छाप</Text>
            <Text style={s.wordmarkNote}>{t('tagline')}</Text>
          </View>

          <View style={s.modeBlock}>
            <Text style={s.askBig}>{t('mode_ask')}</Text>

            <BigButton
              label={t('mode_voice')}
              sub={t('mode_voice_sub')}
              tone="ink"
              onPress={() => {
                setMode('voice');
                setStep('capture');
              }}
            />
            <View style={{ height: 14 }} />
            <BigButton
              label={t('mode_form')}
              sub={t('mode_form_sub')}
              tone="brass"
              onPress={() => {
                Speech.stop();
                setMode('form');
                setStep('capture');
              }}
            />

            <SpeakAgain text={t('p_mode')} tts={tts} label={t('speak_again')} dyed={false} />
          </View>
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'capture') {
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={stepIndex} dyed={false} />
          <Text style={s.headingCloth}>{t('cap_title')}</Text>
          <Text style={s.subCloth}>{t('cap_sub')}</Text>

          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.plate} />
          ) : (
            <View style={s.plateEmpty}>
              <Text style={s.plateEmptyMark}>◻</Text>
            </View>
          )}

          {busy ? (
            <Working label={busy} dyed={false} />
          ) : (
            <BigButton label={t('cap_btn')} onPress={takePhoto} tone="ink" />
          )}

          {mode === 'voice' ? (
            <SpeakAgain text={t('p_capture')} tts={tts} label={t('speak_again')} dyed={false} />
          ) : null}
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'confirm') {
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={stepIndex} dyed={false} />

          {enhanced ? (
            <Image source={{ uri: enhanced }} style={s.confirmPhoto} />
          ) : photoUri ? (
            <Image source={{ uri: photoUri }} style={s.confirmPhoto} />
          ) : null}

          {craft ? (
            <>
              <Text style={s.confirmKicker}>{t('conf_kicker_yes')}</Text>
              <Text style={s.confirmGuess}>{craftName(lang, craft)}</Text>
              <Text style={s.subCloth}>{t('conf_sub_yes')}</Text>
            </>
          ) : (
            <>
              <Text style={s.confirmKicker}>{t('conf_kicker_no')}</Text>
              <Text style={s.headingCloth}>{t('conf_title_no')}</Text>
              <Text style={s.subCloth}>{t('conf_sub_no')}</Text>
            </>
          )}

          <View style={s.craftGrid}>
            {CRAFTS.map((c) => {
              const selected = craft === c.en;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCraft(c.en);
                    Speech.stop();
                  }}
                  style={({ pressed }) => [
                    s.craftTile,
                    {
                      borderColor: selected ? C.madder : C.clothEdge,
                      backgroundColor: selected ? C.madder : C.clothSunk,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.craftTileText,
                      { color: selected ? C.cloth : C.ink },
                    ]}
                  >
                    {craftName(lang, c.en)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 8 }} />
          <BigButton
            label={t('conf_yes')}
            tone="ink"
            disabled={!craft}
            onPress={() => setStep('describe')}
          />

          {mode === 'voice' ? (
            <SpeakAgain
              text={t(craft ? 'p_confirm' : 'p_confirm_none')}
              tts={tts}
              label={t('speak_again')}
              dyed={false}
            />
          ) : null}
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'describe') {
    return (
      <Ground dyed={false}>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={stepIndex} dyed={false} />

          <View style={s.pairRow}>
            <View style={s.pairItem}>
              <Text style={s.pairLabel}>{t('desc_your')}</Text>
              <Image source={{ uri: photoUri }} style={s.pairImg} />
            </View>
            <View style={s.pairItem}>
              <Text style={s.pairLabel}>{t('desc_ready')}</Text>
              {enhanced ? (
                <Image source={{ uri: enhanced }} style={s.pairImg} />
              ) : (
                <View style={[s.pairImg, { backgroundColor: C.clothSunk }]} />
              )}
            </View>
          </View>

          {craft ? (
            <View style={s.craftChip}>
              <Text style={s.craftChipLabel}>{t('desc_detected')}</Text>
              <Text style={s.craftChipValue}>{craftName(lang, craft)}</Text>
            </View>
          ) : null}

          <Text style={s.headingCloth}>{t('desc_title')}</Text>
          <Text style={s.subCloth}>{t('desc_sub')}</Text>

          {busy ? (
            <Working label={busy} dyed={false} />
          ) : recording ? (
            <BigButton
              label={t('desc_stop')}
              sub={t('desc_stop_sub')}
              tone="madder"
              onPress={stopRecording}
            />
          ) : (
            <BigButton
              label={t('desc_start')}
              sub={t('desc_start_sub')}
              tone="ink"
              onPress={startRecording}
            />
          )}

          {mode === 'voice' ? (
            <SpeakAgain text={t('p_describe')} tts={tts} label={t('speak_again')} dyed={false} />
          ) : null}
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'listing') {
    const en = listing?.en;
    const local = listing?.local || listing?.hi; // backend returns `local`; hi is the legacy fallback
    const showLocal = local && lang !== 'en';
    return (
      <Ground dyed>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={stepIndex} dyed />

          {enhanced ? <Image source={{ uri: enhanced }} style={s.hero} /> : null}

          <Text style={s.craftLine}>{craftName(lang, craft)}</Text>
          <Text style={s.titleDisplay}>{en?.title}</Text>
          <View style={s.rule} />

          {en?.bullets?.map((b, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletMark}>—</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}

          <Text style={s.story}>{en?.story}</Text>

          {showLocal ? (
            <View style={s.hiBlock}>
              <Text style={s.hiTitle}>{local?.title}</Text>
              <Text style={s.hiStory}>{local?.story}</Text>
            </View>
          ) : null}

          {transcript ? (
            <View style={s.transcriptBlock}>
              <Text style={s.transcriptLabel}>{t('lst_you_said')}</Text>
              <Text style={s.transcriptText}>{transcript}</Text>
            </View>
          ) : null}

          <View style={{ height: 18 }} />
          {busy ? (
            <Working label={busy} dyed />
          ) : (
            <>
              <BigButton label={t('lst_ok_price')} tone="brass" onPress={getPrice} />
              <View style={{ height: 12 }} />
              <QuietButton label={t('lst_respeak')} dyed onPress={() => setStep('describe')} />
            </>
          )}

          {mode === 'voice' ? (
            <SpeakAgain
              text={local?.story || t('p_listing')}
              tts={tts}
              label={t('speak_again')}
              dyed
            />
          ) : null}
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'price') {
    const conf = pricing?.confidence;
    const confLabel =
      conf === 'strong'
        ? t('pr_conf_strong')
        : conf === 'fair'
        ? t('pr_conf_fair')
        : t('pr_conf_floor');
    return (
      <Ground dyed>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={stepIndex} dyed />

          <Text style={s.priceLabel}>{t('pr_label')}</Text>
          <Text style={s.priceBig}>₹{pricing?.recommended_inr}</Text>
          <Text style={s.priceConf}>{t('pr_conf')} — {confLabel}</Text>

          <View style={s.rule} />

          <Text style={s.sectionHead}>{t('pr_how')}</Text>

          <View style={s.floorRow}>
            <Text style={s.floorLabel}>{t('pr_your_cost')}</Text>
            <Text style={s.floorValue}>₹{pricing?.cost_floor_inr}</Text>
          </View>
          <Text style={s.floorNote}>
            {t('pr_cost_note', { m: materialInr || 0, h: labourHours || 0 })}
          </Text>

          {pricing?.comparables?.length ? (
            <>
              <Text style={s.sectionHead}>{t('pr_market')}</Text>
              {pricing.comparables.slice(0, 5).map((c, i) => (
                <View key={i} style={s.compRow}>
                  <Text style={s.compTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={s.compPrice}>₹{c.price_inr}</Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={s.editBlock}>
            <Text style={s.sectionHead}>{t('pr_you_said')}</Text>
            <View style={s.editRow}>
              <Text style={s.editLabel}>{t('pr_material')}</Text>
              <TextInput
                value={materialInr}
                onChangeText={setMaterialInr}
                keyboardType="numeric"
                style={s.editInput}
                placeholderTextColor={C.resistSoft}
                placeholder="—"
              />
            </View>
            <View style={s.editRow}>
              <Text style={s.editLabel}>{t('pr_hours')}</Text>
              <TextInput
                value={labourHours}
                onChangeText={setLabourHours}
                keyboardType="numeric"
                style={s.editInput}
                placeholderTextColor={C.resistSoft}
                placeholder="—"
              />
            </View>
            <QuietButton label={t('pr_recompute')} dyed onPress={getPrice} />
          </View>

          <View style={{ height: 20 }} />
          {busy ? (
            <Working label={busy} dyed />
          ) : (
            <BigButton
              label={t('pr_send')}
              sub={t('pr_send_sub')}
              tone="brass"
              onPress={publish}
            />
          )}

          {mode === 'voice' ? (
            <SpeakAgain
              text={t('p_price')}
              tts={tts}
              label={t('speak_again')}
              dyed
            />
          ) : null}
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'publish') {
    return (
      <Ground dyed>
        <ScrollView contentContainerStyle={s.scroll}>
          <StepMark step={5} dyed />

          <Text style={s.doneHead}>{t('pub_done')}</Text>
          <Text style={s.doneSub}>{t('pub_done_sub')}</Text>

          <View style={s.channelList}>
            {[
              ['ONDC', t('pub_ondc_note')],
              ['GeM', t('pub_gem_note')],
              ['WhatsApp', t('pub_wa_note')],
            ].map(([name, note]) => (
              <View key={name} style={s.channelRow}>
                <Text style={s.channelName}>{name}</Text>
                <Text style={s.channelNote}>{note}</Text>
              </View>
            ))}
          </View>

          {published?.qr_base64 ? (
            <View style={s.qrBlock}>
              <View style={s.qrPlate}>
                <Image
                  source={{ uri: `data:image/png;base64,${published.qr_base64}` }}
                  style={s.qr}
                />
              </View>
              <Text style={s.qrNote}>{t('pub_qr_note')}</Text>
              <Text style={s.qrUrl}>{published.microsite_url}</Text>
            </View>
          ) : null}

          <View style={{ height: 24 }} />
          <BigButton
            label={t('pub_see_reach')}
            tone="brass"
            onPress={() => {
              Speech.stop();
              setDistTab('reach');
              setStep('distribution');
            }}
          />
          <View style={{ height: 12 }} />
          <QuietButton label={t('pub_next')} dyed onPress={restart} />
          <ErrorNote />
        </ScrollView>
      </Ground>
    );
  }

  if (step === 'distribution') {
    const p = myProduct || products[0];
    const tabs = [
      ['reach', t('tab_reach')],
      ['ad', t('tab_ad')],
      ['market', t('tab_market')],
    ];
    const reach = p.reach || makeReach(p.id);
    const chNote = { ondc: 'pub_ondc_note', gem: 'pub_gem_note', whatsapp: 'pub_wa_note', chhaap: 'reach_total_note' };
    return (
      <Ground dyed>
        <View style={s.distHeader}>
          <Pressable
            onPress={() => {
              Speech.stop();
              setStep('publish');
            }}
          >
            <Text style={s.distBack}>‹ {t('dist_back')}</Text>
          </Pressable>
          <Text style={s.distHome} onPress={restart}>
            {t('dist_home')}
          </Text>
        </View>

        <View style={s.tabBar}>
          {tabs.map(([id, label]) => (
            <Pressable key={id} onPress={() => setDistTab(id)} style={s.tab}>
              <Text style={[s.tabLabel, { color: distTab === id ? C.resist : C.resistSoft }]}>
                {label}
              </Text>
              <View
                style={[
                  s.tabUnderline,
                  { backgroundColor: distTab === id ? C.brass : 'transparent' },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.distScroll}>
          {/* ---- REACH ---- */}
          {distTab === 'reach' ? (
            <>
              <Text style={s.reachTotal}>
                {Object.values(reach).reduce((a, c) => a + c.views, 0)}
              </Text>
              <Text style={s.reachTotalNote}>{t('reach_total_note')}</Text>
              <Text style={s.reachDisclaimer}>{t('reach_disclaimer')}</Text>

              <View style={{ height: 20 }} />
              {Object.entries(reach).map(([k, ch]) => (
                <View key={k} style={s.channelCard}>
                  <View style={{ flex: 1 }}>
                    <View style={s.channelTop}>
                      <Text style={s.channelName}>{ch.label}</Text>
                      <View style={s.liveDot} />
                      <Text style={s.liveLabel}>{t('live')}</Text>
                    </View>
                    <Text style={s.channelNote}>
                      {k === 'ondc'
                        ? t('pub_ondc_note')
                        : k === 'gem'
                        ? t('pub_gem_note')
                        : k === 'whatsapp'
                        ? t('pub_wa_note')
                        : t('market_note')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.channelViews}>{ch.views}</Text>
                    <Text style={s.channelViewsNote}>
                      {k === 'whatsapp' ? t('reach_unit_wa') : t('reach_unit')}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {/* ---- AD CREATIVE ---- */}
          {distTab === 'ad' ? (
            <>
              <Text style={s.sectionHead}>{t('ad_head')}</Text>
              <Text style={s.adHint}>{t('ad_hint')}</Text>

              <View style={s.langToggle}>
                {[[lang, meta.native], ['en', 'English']]
                  .filter((v, i, arr) => arr.findIndex((x) => x[0] === v[0]) === i)
                  .map(([id, label]) => (
                    <Pressable
                      key={id}
                      onPress={() => setAdLang(id)}
                      style={[
                        s.langChip,
                        {
                          backgroundColor: adLang === id ? C.brass : 'transparent',
                          borderColor: adLang === id ? C.brass : C.indigoEdge,
                        },
                      ]}
                    >
                      <Text style={[s.langChipText, { color: adLang === id ? C.indigo : C.resistSoft }]}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
              </View>

              {/* the poster itself — captured on share, screenshot-safe */}
              <View ref={adCardRef} collapsable={false} style={s.adCard}>
                {p.image ? (
                  <Image source={{ uri: p.image }} style={s.adImage} />
                ) : (
                  <View style={[s.adImage, { backgroundColor: p.swatch || C.indigoLift }]} />
                )}
                <View style={s.adCardBody}>
                  <Text style={s.adCraft}>
                    {adLang === 'en' ? p.craft : craftName(adLang, p.craft)}
                  </Text>
                  <Text style={s.adTitle}>
                    {adLang === 'en' ? p.title : p.titleHi || p.title}
                  </Text>
                  <View style={s.adRule} />
                  <View style={s.adFoot}>
                    <View>
                      <Text style={s.adPriceLabel}>{translate(adLang, 'ad_price')}</Text>
                      <Text style={s.adPrice}>₹{p.price}</Text>
                    </View>
                    {p.qr ? (
                      <View style={s.adQrPlate}>
                        <Image source={{ uri: `data:image/png;base64,${p.qr}` }} style={s.adQr} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.adMark}>छाप · Chhaap</Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
              <BigButton label={t('ad_share')} tone="brass" onPress={shareAd} />
            </>
          ) : null}

          {/* ---- MARKETPLACE ---- */}
          {distTab === 'market' ? (
            <>
              <Text style={s.marketTitle}>{t('market_title')}</Text>
              <Text style={s.marketNote}>{t('market_note')}</Text>
              <View style={s.grid}>
                {products.map((prod) => (
                  <View key={prod.id} style={s.gridCard}>
                    {prod.image ? (
                      <Image source={{ uri: prod.image }} style={s.gridImg} />
                    ) : (
                      <View style={[s.gridImg, { backgroundColor: prod.swatch }]}>
                        <Text style={s.gridSwatchText}>{craftName(lang, prod.craft)}</Text>
                      </View>
                    )}
                    {prod.mine ? (
                      <View style={s.mineTag}>
                        <Text style={s.mineTagText}>{t('mine')}</Text>
                      </View>
                    ) : null}
                    <Text style={s.gridCraft}>{prod.craft}</Text>
                    <Text style={s.gridName} numberOfLines={2}>
                      {prod.title}
                    </Text>
                    <Text style={s.gridPrice}>₹{prod.price}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <ErrorNote />
          <View style={{ height: 40 }} />
        </ScrollView>
      </Ground>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  ground: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingTop: 64, paddingBottom: 56 },

  // wordmark ---------------------------------------------------------------
  wordmarkBlock: { marginTop: 40, marginBottom: 56 },
  wordmark: {
    fontFamily: T.display,
    fontSize: 52,
    color: C.ink,
    letterSpacing: -1.2,
  },
  wordmarkHi: {
    fontFamily: T.bodyMed,
    fontSize: 30,
    color: C.madder,
    marginTop: -4,
  },
  wordmarkNote: {
    fontFamily: T.body,
    fontSize: 17,
    color: C.inkSoft,
    marginTop: 14,
    lineHeight: 26,
  },

  modeBlock: { marginTop: 8 },

  // language picker --------------------------------------------------------
  langHead: { marginTop: 50, marginBottom: 28, alignItems: 'flex-start' },
  langTitle: { fontFamily: T.display, fontSize: 30, color: C.ink, letterSpacing: -0.6 },
  langTitleEn: { fontFamily: T.body, fontSize: 17, color: C.inkSoft, marginTop: 2, marginBottom: 8 },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
  },
  langTile: {
    width: (SCREEN_W - 48 - 10) / 2,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    minHeight: 74,
    justifyContent: 'center',
  },
  langNative: { fontFamily: T.bodyBold, fontSize: 21 },
  langEn: { fontFamily: T.body, fontSize: 13, marginTop: 2 },

  // login ------------------------------------------------------------------
  loginTop: { marginTop: 60, marginBottom: 64 },
  loginBlock: { marginTop: 8 },
  loginLabel: {
    fontFamily: T.bodyMed,
    fontSize: 20,
    color: C.ink,
    marginBottom: 20,
    lineHeight: 30,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: C.clothEdge,
    paddingBottom: 8,
  },
  phonePrefix: { fontFamily: T.bodyMed, fontSize: 26, color: C.inkSoft, marginRight: 12 },
  phoneInput: {
    flex: 1,
    fontFamily: T.bodyMed,
    fontSize: 26,
    color: C.ink,
    letterSpacing: 1,
    paddingVertical: 4,
  },
  otpInput: {
    fontFamily: T.display,
    fontSize: 40,
    color: C.ink,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: C.clothEdge,
    paddingBottom: 10,
  },
  loginFine: {
    fontFamily: T.body,
    fontSize: 14,
    color: C.inkSoft,
    textAlign: 'center',
    marginTop: 18,
  },

  // onboarding -------------------------------------------------------------
  obTop: { alignItems: 'flex-end', marginTop: 8, marginBottom: 20 },
  obSkip: { fontFamily: T.bodyMed, fontSize: 16, color: C.inkSoft },
  obBody: { marginTop: 60, marginBottom: 40 },
  obMark: { fontSize: 56, color: C.madder, marginBottom: 32 },
  obTitle: {
    fontFamily: T.display,
    fontSize: 38,
    color: C.ink,
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: 18,
  },
  obText: {
    fontFamily: T.body,
    fontSize: 19,
    color: C.inkSoft,
    lineHeight: 31,
  },
  obDots: { flexDirection: 'row', gap: 8, marginBottom: 36 },
  obDot: { width: 9, height: 9, borderRadius: 5 },
  askBig: {
    fontFamily: T.bodyBold,
    fontSize: 26,
    color: C.ink,
    marginBottom: 24,
    lineHeight: 36,
  },

  // step mark --------------------------------------------------------------
  stepMark: { flexDirection: 'row', gap: 7, marginBottom: 28 },
  stamp: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 2 },

  // cloth-ground type ------------------------------------------------------
  headingCloth: {
    fontFamily: T.bodyBold,
    fontSize: 25,
    color: C.ink,
    lineHeight: 34,
    marginBottom: 8,
  },
  subCloth: {
    fontFamily: T.body,
    fontSize: 17,
    color: C.inkSoft,
    lineHeight: 27,
    marginBottom: 24,
  },

  // plates -----------------------------------------------------------------
  plate: {
    width: '100%',
    height: SCREEN_W * 0.9,
    borderRadius: 3,
    marginBottom: 28,
    backgroundColor: C.clothSunk,
  },
  plateEmpty: {
    width: '100%',
    height: SCREEN_W * 0.9,
    borderRadius: 3,
    marginBottom: 28,
    backgroundColor: C.clothSunk,
    borderWidth: 1,
    borderColor: C.clothEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateEmptyMark: { fontSize: 40, color: C.clothEdge },

  pairRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pairItem: { flex: 1 },
  pairLabel: {
    fontFamily: T.bodyMed,
    fontSize: 14,
    color: C.inkSoft,
    marginBottom: 6,
  },
  pairImg: {
    width: '100%',
    height: 150,
    borderRadius: 3,
    backgroundColor: C.clothSunk,
  },

  confirmPhoto: {
    width: '100%',
    height: SCREEN_W * 0.62,
    borderRadius: 3,
    marginBottom: 24,
    backgroundColor: C.clothSunk,
  },
  confirmKicker: {
    fontFamily: T.body,
    fontSize: 16,
    color: C.inkSoft,
    marginBottom: 2,
  },
  confirmGuess: {
    fontFamily: T.display,
    fontSize: 32,
    color: C.ink,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  craftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
    marginBottom: 24,
  },
  craftTile: {
    width: (SCREEN_W - 48 - 10) / 2,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 74,
  },
  craftTileText: {
    fontFamily: T.bodyBold,
    fontSize: 18,
    textAlign: 'center',
  },

  craftChip: {
    borderLeftWidth: 3,
    borderLeftColor: C.madder,
    paddingLeft: 12,
    marginBottom: 28,
  },
  craftChipLabel: { fontFamily: T.body, fontSize: 14, color: C.inkSoft },
  craftChipValue: { fontFamily: T.bodyBold, fontSize: 20, color: C.ink },

  // buttons ----------------------------------------------------------------
  bigBtn: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 3,
    alignItems: 'center',
  },
  bigBtnLabel: { fontFamily: T.bodyBold, fontSize: 22, color: C.cloth },
  bigBtnSub: {
    fontFamily: T.body,
    fontSize: 15,
    color: C.cloth,
    opacity: 0.75,
    marginTop: 3,
  },

  quietBtn: {
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 3,
    alignItems: 'center',
  },
  quietBtnLabel: { fontFamily: T.bodyMed, fontSize: 17 },

  speakAgain: { marginTop: 22, alignItems: 'center' },
  speakAgainLabel: {
    fontFamily: T.bodyMed,
    fontSize: 16,
    textDecorationLine: 'underline',
  },

  working: { alignItems: 'center', paddingVertical: 26, gap: 12 },
  workingLabel: { fontFamily: T.body, fontSize: 17 },

  errorNote: {
    marginTop: 22,
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
  },
  errorText: { fontFamily: T.body, fontSize: 16, lineHeight: 24 },

  // indigo-ground type -----------------------------------------------------
  hero: {
    width: '100%',
    height: SCREEN_W * 0.78,
    borderRadius: 3,
    marginBottom: 26,
    backgroundColor: C.indigoLift,
  },
  craftLine: {
    fontFamily: T.bodyMed,
    fontSize: 15,
    color: C.brass,
    marginBottom: 6,
  },
  titleDisplay: {
    fontFamily: T.display,
    fontSize: 33,
    color: C.resist,
    lineHeight: 41,
    letterSpacing: -0.5,
  },
  rule: {
    height: 1,
    backgroundColor: C.indigoEdge,
    marginVertical: 24,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  bulletMark: { fontFamily: T.body, fontSize: 16, color: C.brass, lineHeight: 26 },
  bulletText: {
    flex: 1,
    fontFamily: T.body,
    fontSize: 16,
    color: C.resist,
    lineHeight: 26,
  },
  story: {
    fontFamily: T.displayLight,
    fontSize: 18,
    color: C.resist,
    lineHeight: 30,
    marginTop: 18,
    opacity: 0.92,
  },
  hiBlock: {
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: C.indigoEdge,
  },
  hiTitle: { fontFamily: T.bodyBold, fontSize: 21, color: C.resist, lineHeight: 31 },
  hiStory: {
    fontFamily: T.body,
    fontSize: 16,
    color: C.resistSoft,
    lineHeight: 27,
    marginTop: 10,
  },
  transcriptBlock: {
    marginTop: 28,
    backgroundColor: C.indigoLift,
    padding: 16,
    borderRadius: 3,
  },
  transcriptLabel: { fontFamily: T.bodyMed, fontSize: 14, color: C.brass },
  transcriptText: {
    fontFamily: T.body,
    fontSize: 15,
    color: C.resistSoft,
    lineHeight: 25,
    marginTop: 6,
  },

  // price ------------------------------------------------------------------
  priceLabel: { fontFamily: T.bodyMed, fontSize: 16, color: C.brass },
  priceBig: {
    fontFamily: T.display,
    fontSize: 64,
    color: C.resist,
    letterSpacing: -2,
    marginTop: 2,
  },
  priceConf: { fontFamily: T.body, fontSize: 16, color: C.resistSoft, marginTop: 2 },

  sectionHead: {
    fontFamily: T.bodyBold,
    fontSize: 18,
    color: C.resist,
    marginBottom: 12,
    marginTop: 22,
  },
  floorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  floorLabel: { fontFamily: T.body, fontSize: 17, color: C.resist },
  floorValue: { fontFamily: T.bodyBold, fontSize: 17, color: C.resist },
  floorNote: { fontFamily: T.body, fontSize: 15, color: C.resistSoft, marginTop: 4 },

  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoEdge,
    gap: 14,
  },
  compTitle: { flex: 1, fontFamily: T.body, fontSize: 15, color: C.resistSoft },
  compPrice: { fontFamily: T.bodyMed, fontSize: 15, color: C.resist },

  editBlock: {
    marginTop: 30,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.indigoEdge,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  editLabel: { fontFamily: T.body, fontSize: 16, color: C.resistSoft },
  editInput: {
    fontFamily: T.bodyMed,
    fontSize: 18,
    color: C.resist,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoEdge,
    minWidth: 90,
    textAlign: 'right',
    paddingVertical: 6,
  },

  // publish ----------------------------------------------------------------
  doneHead: {
    fontFamily: T.display,
    fontSize: 40,
    color: C.resist,
    letterSpacing: -1,
  },
  doneSub: {
    fontFamily: T.body,
    fontSize: 17,
    color: C.resistSoft,
    marginTop: 6,
    lineHeight: 27,
  },
  channelList: { marginTop: 30 },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoEdge,
  },
  channelName: { fontFamily: T.bodyBold, fontSize: 19, color: C.resist },
  channelNote: { fontFamily: T.body, fontSize: 15, color: C.resistSoft },

  qrBlock: { alignItems: 'center', marginTop: 36 },
  qrPlate: { backgroundColor: C.resist, padding: 16, borderRadius: 3 },
  qr: { width: 168, height: 168 },
  qrNote: {
    fontFamily: T.body,
    fontSize: 16,
    color: C.resistSoft,
    marginTop: 16,
  },
  qrUrl: { fontFamily: T.body, fontSize: 14, color: C.brass, marginTop: 4 },

  // distribution -----------------------------------------------------------
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 8,
  },
  distBack: { fontFamily: T.bodyMed, fontSize: 17, color: C.resistSoft },
  distHome: { fontFamily: T.bodyMed, fontSize: 16, color: C.brass },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoEdge,
  },
  tab: { marginRight: 28, paddingVertical: 12 },
  tabLabel: { fontFamily: T.bodyBold, fontSize: 18 },
  tabUnderline: { height: 2, marginTop: 8, borderRadius: 1 },

  distScroll: { padding: 24, paddingBottom: 40 },

  // reach
  reachTotal: {
    fontFamily: T.display,
    fontSize: 60,
    color: C.resist,
    letterSpacing: -2,
    marginTop: 8,
  },
  reachTotalNote: { fontFamily: T.body, fontSize: 16, color: C.resistSoft, marginTop: 2 },
  reachDisclaimer: { fontFamily: T.body, fontSize: 13, color: C.brass, marginTop: 8 },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoEdge,
  },
  channelTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  channelName: { fontFamily: T.bodyBold, fontSize: 19, color: C.resist },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.leaf },
  liveLabel: { fontFamily: T.bodyMed, fontSize: 13, color: C.leaf },
  channelNote: { fontFamily: T.body, fontSize: 14, color: C.resistSoft, marginTop: 3 },
  channelViews: { fontFamily: T.display, fontSize: 26, color: C.resist },
  channelViewsNote: { fontFamily: T.body, fontSize: 12, color: C.resistSoft },

  // ad creative
  adHint: { fontFamily: T.body, fontSize: 15, color: C.resistSoft, marginTop: -6, marginBottom: 16 },
  langToggle: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  langChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  langChipText: { fontFamily: T.bodyMed, fontSize: 15 },
  adCard: { backgroundColor: C.resist, borderRadius: 4, overflow: 'hidden' },
  adImage: { width: '100%', height: SCREEN_W * 0.9, backgroundColor: C.clothSunk },
  adCardBody: { padding: 22 },
  adCraft: { fontFamily: T.bodyMed, fontSize: 14, color: C.madder, letterSpacing: 0.5 },
  adTitle: {
    fontFamily: T.display,
    fontSize: 26,
    color: C.ink,
    lineHeight: 33,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  adRule: { height: 1, backgroundColor: C.clothEdge, marginVertical: 18 },
  adFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  adPriceLabel: { fontFamily: T.body, fontSize: 13, color: C.inkSoft },
  adPrice: { fontFamily: T.display, fontSize: 34, color: C.ink, letterSpacing: -1 },
  adQrPlate: { backgroundColor: C.cloth, padding: 6, borderRadius: 3 },
  adQr: { width: 64, height: 64 },
  adMark: {
    fontFamily: T.bodyBold,
    fontSize: 15,
    color: C.brass,
    marginTop: 20,
    letterSpacing: 1,
  },

  // marketplace
  marketTitle: { fontFamily: T.display, fontSize: 30, color: C.resist, letterSpacing: -0.8 },
  marketNote: { fontFamily: T.body, fontSize: 15, color: C.resistSoft, marginTop: 2, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: (SCREEN_W - 48 - 14) / 2, marginBottom: 26 },
  gridImg: {
    width: '100%',
    height: (SCREEN_W - 48 - 14) / 2,
    borderRadius: 3,
    backgroundColor: C.indigoLift,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  gridSwatchText: { fontFamily: T.bodyBold, fontSize: 16, color: C.resist, textAlign: 'center', opacity: 0.9 },
  mineTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.brass,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  mineTagText: { fontFamily: T.bodyBold, fontSize: 12, color: C.indigo },
  gridCraft: { fontFamily: T.bodyMed, fontSize: 12, color: C.brass },
  gridName: { fontFamily: T.body, fontSize: 14, color: C.resist, lineHeight: 20, marginTop: 2 },
  gridPrice: { fontFamily: T.bodyBold, fontSize: 16, color: C.resist, marginTop: 4 },
});
