const hamburgerBtn = document.getElementById("hamburgerBtn");
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

let bool = false;

function hamburgerBtnToggle() {
  bool = !bool;
  if (bool) {
	hamburger.style.transform = "scale(1,1)";
	hamburger.style.visibility = "visible";
	hamburger.style.opacity = "100%";
	hamburger.style.top = "64px";
    hamburgerBtn.style.borderBottomLeftRadius = "0px";
    hamburgerBtn.style.borderBottomRightRadius = "0px";
    hamburgerBtn.style.borderBottom = "none";
    hamburgerBtn.style.backgroundColor = "white";
	hamburgerBtn.style.color="#e23a6b";
    
	
  } else {
	hamburger.style.transform = "scale(0,0)";
	hamburger.style.visibility = "hidden";
	hamburger.style.opacity = "0%";
	hamburger.style.top = "50px";
    hamburgerBtn.style.borderBottomLeftRadius = "100%";
    hamburgerBtn.style.borderBottomRightRadius = "100%";
    hamburgerBtn.style.borderBottom = "2px solid #e23a6b";
    hamburgerBtn.style.backgroundColor = "#e23a6b";
	hamburgerBtn.style.color="white";
  }
}

hamburgerBtn.onclick = hamburgerBtnToggle;

const carousel = document.getElementById('carousel');

    function scrollCarousel(direction) {
      const itemWidth = carousel.querySelector('.carousel-item').offsetWidth + 15;
      carousel.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    }


// Dictionary of translations
const translations = {
  en: {
    label_store: "STORE",
    label_contactUs: "CONTACT US",
    label_intro: "A group of web-gen animators. We're a discord community of animators all striving to improve.",
    label_checkAnim: "Check out our animations!",
    label_wishJoin: "Wish to join our community?",
    label_readInfo: "Read this information",
    label_wantWork: "Want to work with us?",
    label_knownAs: "Our community is known as <b>Zettai Absolute</b><br>While our studio goes by the name <b>Zettai Beyond</b>",
    label_sendEmail: "Send us an email!"
  },
  jp: {
    label_store: "店",
    label_contactUs: "お問い合わせ",
    label_intro: "ウェブ制作アニメーターのグループです。向上心旺盛なアニメーターたちが集うDiscordコミュニティです。",
    label_checkAnim: "のアニメーションをチェックしてください!",
    label_wishJoin: "のコミュニティに参加したいですか?",
    label_readInfo: "この情報を読む",
    label_wantWork: "と一緒に働いてみませんか?",
    label_knownAs: "のコミュニティは<b>「Zettai Absolute」</b>として知られていますが<br>のスタジオは<b>「Zettai Beyond」</b>という名前で知られています",
    label_sendEmail: "メールをお送りください！"
  }
};

// Function to switch language
function switchLanguage(lang) {
  for (const [id, text] of Object.entries(translations[lang])) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = text;
  }
  // Update URL parameter
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

// Detect language from URL or default to 'en'
function detectLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get("lang") || "en";
  switchLanguage(lang);
}

// Event listeners for buttons
document.getElementById("btn-en").addEventListener("click", () => switchLanguage("en"));
document.getElementById("btn-jp").addEventListener("click", () => switchLanguage("jp"));

// Run on page load
window.addEventListener("DOMContentLoaded", detectLanguage);
