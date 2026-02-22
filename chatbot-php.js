// ChatBot s funkcí odesílání emailů
document.addEventListener('DOMContentLoaded', function() {
    // Konfigurace - hardcoded pro jistotu
    const config = {
        botName: "Jan Hezina AI Asistent",
        welcomeMessage: "Dobrý den! Jsem AI asistent Robotiservis. Jak vám mohu pomoci?",
        ui: {
            primaryColor: "#6C63FF",
            secondaryColor: "#FF57B9",
            darkMode: true
        }
    };
    
    // Globální proměnné pro uchování stavu
    let userName = '';
    let userEmail = '';
    let waitingForContactInfo = false;
    let lastUserMessage = '';
    
    // Inicializace chatbota
    initChatBot(config);
    
    function initChatBot(config) {
        // Vytvoření HTML struktury chatbota
        createChatBotUI(config);
        
        // Přidání ovládacích prvků
        setupChatBotControls(config);
    }

    function createChatBotUI(config) {
        // Vytvoření HTML struktury s formulářem pro email
        const chatbotHTML = `
            <div id="chatbot-container">
                <div class="chatbot-button">
                    <div class="chatbot-icon">💬</div>
                </div>
                <div class="chatbot-popup">
                    <div class="chatbot-header">
                        <div class="chatbot-title">${config.botName || 'AI Asistent'}</div>
                        <div class="chatbot-close">✕</div>
                    </div>
                    <div class="chatbot-messages"></div>
                    <div class="chatbot-contact-form" style="display:none;">
                        <div class="chatbot-contact-form-content">
                            <h3>Kontaktní údaje</h3>
                            <form id="chatbot-contact-form">
                                <div class="chatbot-form-group">
                                    <label for="chatbot-name">Jméno</label>
                                    <input type="text" id="chatbot-name" name="name" placeholder="Vaše jméno" required>
                                </div>
                                <div class="chatbot-form-group">
                                    <label for="chatbot-email">Email</label>
                                    <input type="email" id="chatbot-email" name="email" placeholder="Váš email" required>
                                </div>
                                <div class="chatbot-form-actions">
                                    <button type="button" class="chatbot-cancel-btn">Zrušit</button>
                                    <button type="submit" class="chatbot-submit-btn">Odeslat</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="chatbot-input-container">
                        <textarea class="chatbot-input" placeholder="Napište zprávu..."></textarea>
                        <button class="chatbot-send">Odeslat</button>
                    </div>
                </div>
            </div>
        `;
        
        // Vložení chatbota do stránky
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        
        // Přidání stylů
        addChatBotStyles(config);
        
        // Zobrazení úvodní zprávy
        if (config.welcomeMessage) {
            setTimeout(() => {
                addMessage(config.welcomeMessage, 'bot');
            }, 500);
        }
    }

    function addChatBotStyles(config) {
        // Získání barev z konfigurace nebo použití výchozích
        const primaryColor = config.ui?.primaryColor || '#6C63FF';
        const secondaryColor = config.ui?.secondaryColor || '#FF57B9';
        const isDarkMode = config.ui?.darkMode !== undefined ? config.ui.darkMode : true;
        
        // Definice barev dle režimu
        const textColor = isDarkMode ? '#F0F0FF' : '#333333';
        const backgroundColor = isDarkMode ? '#0F0F1A' : '#FFFFFF';
        const inputBgColor = isDarkMode ? 'rgba(15, 15, 30, 0.7)' : '#F5F5F5';
        const messageBgUser = isDarkMode ? '#E6E6FF' : '#E6F7FF';
        const messageBgBot = isDarkMode ? '#F0F0FF' : '#F5F5F5';
        
        // Vložení CSS stylů pro chatbota
        const style = document.createElement('style');
        style.textContent = `
            #chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: 'Inter', -apple-system, sans-serif;
            }
            
            .chatbot-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transition: transform 0.3s ease;
            }
            
            .chatbot-button:hover {
                transform: scale(1.05);
            }
            
            .chatbot-icon {
                font-size: 24px;
                color: white;
            }
            
            .chatbot-popup {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 350px;
                height: 500px;
                background: ${backgroundColor};
                border-radius: 15px;
                box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                display: none;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
            }
            
            .chatbot-popup.active {
                display: flex;
                opacity: 1;
                transform: translateY(0);
            }
            
            .chatbot-header {
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .chatbot-title {
                font-weight: bold;
                font-size: 18px;
            }
            
            .chatbot-close {
                cursor: pointer;
                font-size: 16px;
            }
            
            .chatbot-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .chatbot-message {
                max-width: 75%;
                padding: 10px 15px;
                border-radius: 20px;
                margin-bottom: 5px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .chatbot-message.user {
                align-self: flex-end;
                background: ${messageBgUser};
                color: #0F0F1A;
                border-bottom-right-radius: 5px;
            }
            
            .chatbot-message.bot {
                align-self: flex-start;
                background: ${messageBgBot};
                color: #0F0F1A;
                border-bottom-left-radius: 5px;
            }
            
            .chatbot-input-container {
                padding: 15px;
                background: ${isDarkMode ? '#191925' : '#F9F9FB'};
                display: flex;
                gap: 10px;
            }
            
            .chatbot-input {
                flex: 1;
                border: 1px solid ${isDarkMode ? '#333344' : '#E0E0E0'};
                border-radius: 20px;
                padding: 10px 15px;
                resize: none;
                outline: none;
                font-family: inherit;
                max-height: 100px;
                min-height: 40px;
                background: ${inputBgColor};
                color: ${textColor};
            }
            
            .chatbot-send {
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                color: white;
                border: none;
                border-radius: 20px;
                padding: 0 20px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .chatbot-send:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
            }
            
            .chatbot-typing {
                display: flex;
                align-items: center;
                gap: 5px;
                margin-top: 5px;
                margin-left: 10px;
                font-size: 12px;
                color: ${isDarkMode ? '#A9A9CC' : '#666'};
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                background: ${primaryColor};
                border-radius: 50%;
                animation: typingAnimation 1s infinite;
            }
            
            .typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typingAnimation {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); }
            }
            
            /* Styly pro formulář kontaktních údajů */
            .chatbot-contact-form {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: ${backgroundColor};
                z-index: 100;
                display: none;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease;
            }
            
            .chatbot-contact-form-content {
                width: 85%;
                background: ${isDarkMode ? 'rgba(30, 30, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                border: 1px solid ${isDarkMode ? 'rgba(108, 99, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
            }
            
            .chatbot-contact-form h3 {
                text-align: center;
                margin-bottom: 20px;
                color: ${textColor};
                font-size: 20px;
                font-weight: 600;
            }
            
            .chatbot-form-group {
                margin-bottom: 15px;
            }
            
            .chatbot-form-group label {
                display: block;
                margin-bottom: 5px;
                color: ${textColor};
                font-weight: 500;
            }
            
            .chatbot-form-group input {
                width: 100%;
                padding: 12px 15px;
                border-radius: 8px;
                border: 1px solid ${isDarkMode ? '#333344' : '#E0E0E0'};
                background: ${inputBgColor};
                color: ${textColor};
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            
            .chatbot-form-group input:focus {
                border-color: ${primaryColor};
                outline: none;
                box-shadow: 0 0 0 3px ${isDarkMode ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.1)'};
            }
            
            .chatbot-form-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            
            .chatbot-submit-btn, .chatbot-cancel-btn {
                padding: 10px 20px;
                border-radius: 50px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .chatbot-submit-btn {
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                color: white;
                flex-grow: 1;
            }
            
            .chatbot-cancel-btn {
                background: transparent;
                color: ${textColor};
                margin-right: 10px;
                border: 1px solid ${isDarkMode ? '#333344' : '#E0E0E0'};
            }
            
            .chatbot-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
            }
            
            .chatbot-cancel-btn:hover {
                background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
            }
            
            /* Responzivní design pro mobilní zařízení */
            @media (max-width: 768px) {
                .chatbot-popup {
                    width: calc(100vw - 40px);
                    height: 60vh;
                    bottom: 80px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    function setupChatBotControls(config) {
        const chatbotButton = document.querySelector('.chatbot-button');
        const chatbotPopup = document.querySelector('.chatbot-popup');
        const chatbotClose = document.querySelector('.chatbot-close');
        const chatbotInput = document.querySelector('.chatbot-input');
        const chatbotSend = document.querySelector('.chatbot-send');
        const contactForm = document.getElementById('chatbot-contact-form');
        const contactFormContainer = document.querySelector('.chatbot-contact-form');
        const cancelBtn = document.querySelector('.chatbot-cancel-btn');
        
        // Otevření/zavření chatbota
        chatbotButton.addEventListener('click', () => {
            chatbotPopup.classList.add('active');
            chatbotInput.focus();
        });
        
        chatbotClose.addEventListener('click', () => {
            chatbotPopup.classList.remove('active');
        });
        
        // Odeslání zprávy
        function sendMessage() {
            const message = chatbotInput.value.trim();
            if (message) {
                lastUserMessage = message; // Uložení zprávy pro případné odeslání emailu
                addMessage(message, 'user');
                chatbotInput.value = '';
                chatbotInput.style.height = 'auto';
                
                // Zobrazení "typing" indikátoru
                const typingIndicator = showTypingIndicator();
                
                // Jednoduché zpracování zprávy
                setTimeout(() => {
                    processMessage(message, typingIndicator);
                }, 1000);
            }
        }
        
        chatbotSend.addEventListener('click', sendMessage);
        
        chatbotInput.addEventListener('keydown', (e) => {
            // Odeslání zprávy po stisknutí Enter (bez Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
            
            // Auto-resize textového pole
            setTimeout(() => {
                chatbotInput.style.height = 'auto';
                chatbotInput.style.height = (chatbotInput.scrollHeight > 100 ? 100 : chatbotInput.scrollHeight) + 'px';
            }, 0);
        });
        
        // Zobrazení formuláře pro kontaktní údaje
        function showContactForm() {
            contactFormContainer.style.display = 'flex';
            
            // Vyplnění stávajících údajů, pokud existují
            if (userName) {
                document.getElementById('chatbot-name').value = userName;
            }
            if (userEmail) {
                document.getElementById('chatbot-email').value = userEmail;
            }
            
            // Zaměření na první prázdné pole
            if (!userName) {
                document.getElementById('chatbot-name').focus();
            } else if (!userEmail) {
                document.getElementById('chatbot-email').focus();
            }
        }
        
        // Skrytí formuláře pro kontaktní údaje
        function hideContactForm() {
            contactFormContainer.style.display = 'none';
        }
        
        // Zpracování formuláře s kontaktními údaji
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Získání údajů z formuláře
            userName = document.getElementById('chatbot-name').value.trim();
            userEmail = document.getElementById('chatbot-email').value.trim();
            
            // Skrytí formuláře
            hideContactForm();
            
            // Zobrazení potvrzení
            const typingIndicator = showTypingIndicator();
            
            // Zobrazení zadaných údajů uživateli
            if (waitingForContactInfo) {
                addMessage(`Děkuji, jmenuji se ${userName} a můj email je ${userEmail}`, 'user');
                
                // Sestavení zprávy pro email
                let emailMessage = lastUserMessage;
                if (emailMessage.length < 20) {
                    emailMessage = "Mám zájem o více informací o vašich službách.";
                }
                
                // Odeslání emailu přes PHP backend
                sendEmail(userName, userEmail, emailMessage, typingIndicator);
                
                waitingForContactInfo = false;
            }
        });
        
        // Zrušení formuláře
        cancelBtn.addEventListener('click', () => {
            hideContactForm();
        });
        
        // Přidání funkcí do globálního scope pro využití v jiných funkcích
        window.showContactForm = showContactForm;
        window.hideContactForm = hideContactForm;
    }

    function addMessage(text, sender) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chatbot-message', sender);
        messageElement.textContent = text;
        
        messagesContainer.appendChild(messageElement);
        
        // Scrollování na nejnovější zprávu
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const messagesContainer = document.querySelector('.chatbot-messages');
        
        // Vytvoření indikátoru psaní
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chatbot-typing');
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return typingIndicator;
    }

    // Odeslání emailu přes PHP backend
    async function sendEmail(name, email, message, typingIndicator) {
        try {
            const response = await fetch('send-email.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message
                })
            });
            
            const data = await response.json();
            
            // Odstranění indikátoru psaní
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            if (data.success) {
                // Úspěšné odeslání
                addMessage(`Děkuji, ${name}! Vaše zpráva byla úspěšně odeslána na můj email. Brzy vás budu kontaktovat na adrese ${email}. Můžete se mě zeptat na cokoliv dalšího.`, 'bot');
            } else {
                // Neúspěšné odeslání
                addMessage(`Omlouvám se, ${name}, ale vyskytl se problém při odesílání zprávy. Můžete mě prosím kontaktovat přímo na email hezina@gmail.com?`, 'bot');
            }
        } catch (error) {
            console.error('Chyba při odesílání emailu:', error);
            
            // Odstranění indikátoru psaní
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            // Zpráva o chybě
            addMessage(`Omlouvám se, ale vyskytl se problém při odesílání zprávy. Můžete mě prosím kontaktovat přímo na email hezina@gmail.com?`, 'bot');
        }
    }

    // Jednoduché zpracování zpráv s detekcí žádosti o kontakt
    function processMessage(message, typingIndicator) {
        // Detekce klíčových slov pro kontakt
        const contactKeywords = ['kontakt', 'email', 'spojit', 'spojení', 'zpráva', 'poslat', 'napsat', 'volat'];
        const needsContact = contactKeywords.some(word => message.toLowerCase().includes(word));
        
        // Odstranění indikátoru psaní
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Pokud uživatel žádá kontakt
        if (needsContact) {
            waitingForContactInfo = true;
            addMessage("Rád vám poskytnu další informace. Abych vás mohl kontaktovat, potřebuji znát vaše jméno a email. Můžete mi je prosím sdělit přes tento formulář?", 'bot');
            
            // Zobrazení formuláře pro kontaktní údaje
            setTimeout(() => {
                window.showContactForm();
            }, 500);
        } else {
            // Jinak standardní odpověď na základě obsahu zprávy
            let response = getSimpleResponse(message);
            addMessage(response, 'bot');
        }
    }

    // Jednoduché odpovědi na základě obsahu zprávy
    function getSimpleResponse(message) {
        message = message.toLowerCase();
        
        // Pozdravy
        if (message.includes('ahoj') || message.includes('dobrý den') || message.includes('zdravím')) {
            return "Dobrý den! Jak vám mohu pomoci?";
        }
        
        // Dotazy na kurzy
        if (message.includes('kurz') || message.includes('školení') || message.includes('výuka')) {
            if (message.includes('začátečník')) {
                return "Kurz AI pro začátečníky je ideální pro ty, kteří s umělou inteligencí teprve začínají. Naučíte se základní koncepty, terminologii a praktické využití AI nástrojů. Pokud máte zájem o více informací, rád vám je poskytnu na email.";
            } else if (message.includes('pokročil')) {
                return "Kurz AI pro pokročilé je určen těm, kteří již mají základní znalosti a chtějí se posunout dál. Pokud máte zájem o podrobnosti, mohu vás kontaktovat.";
            } else {
                return "Nabízím tři úrovně kurzů: AI pro začátečníky, AI pro pokročilé a Full Stack AI Development. O který konkrétně byste měl/a zájem?";
            }
        }
        
        // Dotazy na ceny
        if (message.includes('cena') || message.includes('stojí') || message.includes('kolik')) {
            return "Ceny kurzů se liší podle úrovně a rozsahu. Kurz pro začátečníky začíná na 4900 Kč, kurz pro pokročilé na 7900 Kč a Full Stack AI Development kurz na 12900 Kč. Mohu vám poslat detailní ceník na email?";
        }
        
        // Dotazy na termíny
        if (message.includes('termín') || message.includes('kdy') || message.includes('datum')) {
            return "Aktuální termíny kurzů pravidelně aktualizuji. Mohu vám poslat aktuální termíny emailem. Chcete, abych vás kontaktoval s detaily?";
        }
        
        // Dotazy na formu výuky
        if (message.includes('online') || message.includes('prezenčně') || message.includes('osobně')) {
            return "Kurzy nabízím jak online, tak prezenční formou v Praze. Online kurzy probíhají přes platformu Zoom s možností individuálních konzultací. Prezenční kurzy zahrnují praktické workshopy v malých skupinách. Jakou formu preferujete?";
        }
        
        // Obecné dotazy
        return "Děkuji za váš dotaz. Specializuji se na vzdělávání v oblasti umělé inteligence a nabízím kurzy pro začátečníky i pokročilé. Mohu vám pomoci s něčím konkrétním ohledně kurzů, konzultací nebo jiné spolupráce?";
    }
});