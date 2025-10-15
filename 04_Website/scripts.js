/**
 * SparKing — Royal Website Scripts
 * Created by: AnLoMinus
 * Date: 15.10.2025
 */

// ============================================
// Smooth Scroll for Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ============================================
// Scroll Animation — Fade In Elements
// ============================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Apply fade-in to sections
document.querySelectorAll("section").forEach((section) => {
  section.style.opacity = "0";
  section.style.transform = "translateY(30px)";
  section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(section);
});

// ============================================
// Header Scroll Effect — Add Shadow on Scroll
// ============================================
window.addEventListener("scroll", () => {
  const header = document.querySelector(".main-header");
  if (window.scrollY > 100) {
    header.style.boxShadow = "0 4px 30px rgba(255, 215, 0, 0.5)";
  } else {
    header.style.boxShadow = "0 4px 20px rgba(255, 215, 0, 0.3)";
  }
});

// ============================================
// Card Hover Sound Effect (Optional)
// ============================================
// Uncomment if you want to add sound effects
/*
const hoverSound = new Audio('assets/sounds/hover.mp3');
document.querySelectorAll('.card-preview').forEach(card => {
    card.addEventListener('mouseenter', () => {
        hoverSound.currentTime = 0;
        hoverSound.play();
    });
});
*/

// ============================================
// Royal Sparkle Effect on Mouse Move
// ============================================
document.addEventListener("mousemove", (e) => {
  // Create sparkle every few pixels moved
  if (Math.random() > 0.95) {
    createSparkle(e.clientX, e.clientY);
  }
});

function createSparkle(x, y) {
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 5px;
        height: 5px;
        background: #FFD700;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 10px #FFD700;
        animation: sparkleAnimation 1s ease-out forwards;
    `;

  document.body.appendChild(sparkle);

  setTimeout(() => {
    sparkle.remove();
  }, 1000);
}

// Add sparkle animation to CSS dynamically
const style = document.createElement("style");
style.textContent = `
    @keyframes sparkleAnimation {
        0% {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
        100% {
            transform: scale(0) translateY(-50px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// Console Welcome Message
// ============================================
console.log(
  "%c👑 ברוך הבא ל-SparKing! 👑",
  "font-size: 24px; color: #FFD700; font-weight: bold; text-shadow: 0 0 10px #FFD700;"
);
console.log(
  '%c"כל אדם הוא מלך בממלכת נשמתו" ✨',
  "font-size: 16px; color: #FFF4CC; font-style: italic;"
);
console.log(
  "%cנוצר על ידי AnLoMinus | 2025",
  "font-size: 12px; color: #0033A0;"
);

// ============================================
// Page Load Animation
// ============================================
window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s ease";
    document.body.style.opacity = "1";
  }, 100);
});

// ============================================
// Mobile Menu Toggle (if needed in future)
// ============================================
// Placeholder for mobile menu functionality
function toggleMobileMenu() {
  const navMenu = document.querySelector(".nav-menu");
  navMenu.classList.toggle("active");
}

// ============================================
// Easter Egg — Royal Blessing
// ============================================
let clickCount = 0;
document.querySelector(".logo").addEventListener("click", () => {
  clickCount++;
  if (clickCount === 7) {
    showRoyalBlessing();
    clickCount = 0;
  }
});

function showRoyalBlessing() {
  const blessing = document.createElement("div");
  blessing.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(0, 51, 160, 0.95), rgba(106, 13, 173, 0.95));
        color: #FFD700;
        padding: 3rem;
        border-radius: 20px;
        border: 3px solid #FFD700;
        box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
        z-index: 10000;
        text-align: center;
        font-size: 1.5rem;
        font-family: 'Frank Ruhl Libre', serif;
        animation: fadeInScale 0.5s ease;
    `;

  blessing.innerHTML = `
        <h2 style="margin-bottom: 1rem; font-size: 2rem;">👑 ברכת המלך 👑</h2>
        <p style="margin-bottom: 1rem;">
            "תהיה מבורך במלכותך הפנימית<br>
            תמלוך בחכמה, באהבה ובעוצמה<br>
            הכתר שלך יזהיר לנצח"
        </p>
        <button onclick="this.parentElement.remove()" style="
            background: #FFD700;
            color: #000;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
        ">אמן ✨</button>
    `;

  document.body.appendChild(blessing);

  // Add scale animation
  const scaleStyle = document.createElement("style");
  scaleStyle.textContent = `
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
    `;
  document.head.appendChild(scaleStyle);
}

// ============================================
// Accessibility — Keyboard Navigation
// ============================================
document.addEventListener("keydown", (e) => {
  // Press '?' to show keyboard shortcuts
  if (e.key === "?") {
    showKeyboardShortcuts();
  }
});

function showKeyboardShortcuts() {
  console.log(
    "%cקיצורי מקלדת:",
    "font-size: 18px; font-weight: bold; color: #FFD700;"
  );
  console.log("? — הצג קיצורים אלה");
  console.log("Esc — סגור חלונות קופצים");
  console.log("Tab — נווט בין אלמנטים");
}

// ============================================
// End of Scripts
// ============================================
console.log(
  "%c✅ כל הסקריפטים נטענו בהצלחה!",
  "color: #4CAF50; font-weight: bold;"
);
