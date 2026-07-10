import * as genaiService from '../services/genaiService.js';
import { translateRequestSchema } from '../validators/index.js';

/**
 * Pre-built fallback translations for all 7 supported languages × 5 intents.
 * Used when the GenAI translation service is unavailable.
 *
 * @type {Record<string, Record<string, {translatedText: string, phonetic: string}>>}
 */
const MOCK_TRANSLATIONS = {
  spanish: {
    redirect: { translatedText: "Por favor, diríjase a otra puerta.", phonetic: "Por fah-vor, dee-ree-hah-se ah oh-trah pwer-tah" },
    medical_urgency: { translatedText: "¡Urgencia médica! Necesitamos ayuda aquí.", phonetic: "Oor-hen-syah meh-dee-cah! Ne-seh-see-tah-mos ah-yoo-dah ah-kee" },
    general_info: { translatedText: "Por favor, siga las instrucciones del personal.", phonetic: "Por fah-vor, see-gah lah eens-trooc-syoh-nes del per-so-nahl" },
    greeting: { translatedText: "¡Bienvenidos al estadio!", phonetic: "Byen-veh-nee-dos ahl es-tah-dyo" },
    emergency_evacuation: { translatedText: "Por favor, evacue con calma inmediatamente.", phonetic: "Por fah-vor, eh-vah-cooeh con cal-mah een-meh-dyah-tah-men-te" }
  },
  french: {
    redirect: { translatedText: "Veuillez vous diriger vers une autre porte.", phonetic: "Vuh-yay voo dee-ree-zhay ver oohn otre port" },
    medical_urgency: { translatedText: "Urgence médicale ! Besoin d'aide ici.", phonetic: "Oor-zhahns may-dee-cal ! Buh-zwan d'ayd ee-see" },
    general_info: { translatedText: "Veuillez suivre les consignes du personnel.", phonetic: "Vuh-yay swee-vruh lay cohn-seen-yuh doo pair-so-nel" },
    greeting: { translatedText: "Bienvenue au stade !", phonetic: "Byang-vuh-noo oh stahd" },
    emergency_evacuation: { translatedText: "Veuillez évacuer calmement immédiatement.", phonetic: "Vuh-yayz ay-vah-queer cal-muh-mahng ee-may-dyat-mahng" }
  },
  german: {
    redirect: { translatedText: "Bitte gehen Sie zu einem anderen Tor.", phonetic: "Bit-teh gay-en zee tsoo eye-nem an-deh-ren tore" },
    medical_urgency: { translatedText: "Medizinischer Notfall! Wir brauchen hier Hilfe.", phonetic: "Meh-dee-tsee-nish-er note-fal! Veer brow-khen heer hil-feh" },
    general_info: { translatedText: "Bitte folgen Sie den Anweisungen des Personals.", phonetic: "Bit-teh fol-gen zee dane an-vye-zoong-en des pair-so-nahls" },
    greeting: { translatedText: "Willkommen im Stadion!", phonetic: "Vil-kom-men im Shtah-dee-on" },
    emergency_evacuation: { translatedText: "Bitte evakuieren Sie den Bereich sofort und ruhig.", phonetic: "Bit-teh eh-vah-koo-ee-ren zee dane beh-ryekh zo-fort oond roo-hikh" }
  },
  japanese: {
    redirect: { translatedText: "別のゲートへ移動してください。", phonetic: "Betsu no gēto e idō shite kudasai" },
    medical_urgency: { translatedText: "医療緊急事態です！ここに助けが必要です。", phonetic: "Iryō kinkyū jitai desu! Koko ni tasuke ga hitsuyō desu" },
    general_info: { translatedText: "係員の指示に従ってください。", phonetic: "Kakariin no shiji ni shtagatte kudasai" },
    greeting: { translatedText: "スタジアムへようこそ！", phonetic: "Sutajiamu e yōkoso" },
    emergency_evacuation: { translatedText: "直ちに落ち着いて避難してください。", phonetic: "Tadachi ni ochitsuite hinan shite kudasai" }
  },
  portuguese: {
    redirect: { translatedText: "Por favor, dirija-se a outro portão.", phonetic: "Por fah-vor, dee-ree-zhah-se ah o-tro por-tah-oo" },
    medical_urgency: { translatedText: "Urgência médica! Precisamos de ajuda aqui.", phonetic: "Oor-zhen-syah meh-dee-cah! Pre-see-zah-mos de ah-zhoo-dah ah-kee" },
    general_info: { translatedText: "Por favor, siga as instruções dos funcionários.", phonetic: "Por fah-vor, see-gah ahs eens-troo-soys dos foo-syo-nah-ryos" },
    greeting: { translatedText: "Bem-vindo ao estádio!", phonetic: "Beng-veen-do ao es-tah-dyo" },
    emergency_evacuation: { translatedText: "Por favor, evacue com calma imediatamente.", phonetic: "Por fah-vor, eh-vah-cooeh cong cahl-mah ee-meh-dyah-tah-meng-te" }
  },
  hindi: {
    redirect: { translatedText: "कृपया दूसरे गेट पर जाएं।", phonetic: "Kripya doosre gate par jaayein" },
    medical_urgency: { translatedText: "चिकित्सा आपातकाल! यहाँ मदद की ज़रूरत है।", phonetic: "Chikitsa aapaatkal! Yahaan madad ki zaroorat hai" },
    general_info: { translatedText: "कृपया कर्मचारियों के निर्देशों का पालन करें।", phonetic: "Kripya karmachariyon ke nirdeshon ka paalan karein" },
    greeting: { translatedText: "स्टेडियम में आपका स्वागत है!", phonetic: "Stadium mein aapka swaagat hai" },
    emergency_evacuation: { translatedText: "कृपया तुरंत शांति से बाहर निकलें।", phonetic: "Kripya turant shaanti se baahar niklein" }
  },
  arabic: {
    redirect: { translatedText: "يرجى التوجه إلى بوابة أخرى.", phonetic: "Yurja al-tawajjuh ila bawwaba ukhra" },
    medical_urgency: { translatedText: "حالة طبية طارئة! نحتاج مساعدة هنا.", phonetic: "Hala tibbiya tari'a! Nahtaj musa'ada huna" },
    general_info: { translatedText: "يرجى اتباع تعليمات الموظفين.", phonetic: "Yurja ittiba' ta'leemat al-muwazzafeen" },
    greeting: { translatedText: "أهلاً بكم في الملعب!", phonetic: "Ahlan bikum fil-mal'ab" },
    emergency_evacuation: { translatedText: "يرجى الإخلاء بهدوء فوراً.", phonetic: "Yurja al-ikhla' bihudu' fawran" }
  }
};

/**
 * Handles translation requests from volunteers.
 * Attempts AI-powered contextual translation via GenAI, with fallback to the
 * pre-built MOCK_TRANSLATIONS dictionary for offline / rate-limit scenarios.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function translateText(request, reply) {
  const parsed = translateRequestSchema.parse(request.body);

  try {
    const result = await genaiService.translateText(
      parsed.text,
      parsed.targetLanguage,
      parsed.intent,
      parsed.urgent
    );
    return reply.send(result);
  } catch (err) {
    request.log.error(
      { msg: 'Translation GenAI failed, using fallback dictionary', lang: parsed.targetLanguage }
    );

    const lang = parsed.targetLanguage.toLowerCase();
    const intent = parsed.intent;

    let fallbackResult;
    if (MOCK_TRANSLATIONS[lang]?.[intent]) {
      fallbackResult = MOCK_TRANSLATIONS[lang][intent];
    } else {
      // Ultimate safety net: wrap original text with language label
      fallbackResult = {
        translatedText: `[${parsed.targetLanguage}] ${parsed.text}`,
        phonetic: `[Pronunciation guide for ${parsed.targetLanguage}]: ${parsed.text}`
      };
    }

    return reply.send(fallbackResult);
  }
}

export { translateText };