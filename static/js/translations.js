/**
 * ArthSaathi - Internationalization (i18n) System
 * Supports: English, Hindi, Marathi, Spanish, French
 */

const TRANSLATIONS = {
    en: {
        // Sidebar Nav
        "nav.dashboard": "Dashboard",
        "nav.analytics": "Analytics",
        "nav.teamfin": "Team Fin AI",
        "nav.avatar": "AI Avatar",
        "nav.shopping": "Shopping Assistant",
        "nav.gst": "GST Advisor",
        "nav.stock": "Stock Analyzer",
        "nav.offline": "Offline Mode",
        "nav.help": "Help",
        "nav.logout": "Log out",

        // Dashboard View
        "dashboard.title": "Dashboard Data Hub",
        "dashboard.subtitle": "Upload your data to power the Analytics charts dynamically",
        "dashboard.upload.title": "Upload Files",
        "dashboard.upload.desc": "Select multiple documents containing your spending data (bank statements, receipts, texts).",
        "dashboard.upload.choose": "Choose Files",
        "dashboard.upload.parse": "Parse & Analyze Files",
        "dashboard.manual.title": "Manual Entry",
        "dashboard.manual.desc": "Paste or type your financial transactions directly to be analyzed.",
        "dashboard.manual.placeholder": "E.g., Spent $50 on Cafe this month, Rent is $1200...",
        "dashboard.manual.process": "Process Text",
        "dashboard.parsing": "Parsing your data using AI...",

        // Gamification
        "gami.title": "Your Achievement Progress",
        "gami.subtitle": "Set a spending goal, parse your data, and level up!",
        "gami.goal.title": "Monthly Goal Settings",
        "gami.goal.label": "Max Expense Target ($)",
        "gami.goal.placeholder": "e.g. 2000",
        "gami.goal.btn": "Set Goal",
        "gami.goal.current": "Current Goal: Not Set",
        "gami.rank.title": "Current Rank",
        "gami.rank.bronze": "Bronze Level",
        "gami.score": "Score: 0",
        "gami.achievement.title": "Achievement Status",
        "gami.status": "Awaiting Data",
        "gami.expenses.label": "Expenses Tracked / Goal",
        "gami.expenses.val": "$0 / Not Set",

        // Analytics View
        "analytics.title": "Analytics",
        "analytics.subtitle": "Detailed overview of your financial situation",
        "analytics.thismonth": "This month",
        "analytics.manage": "Manage widgets",
        "analytics.add": "Add new widget",
        "analytics.balance.title": "Total balance",
        "analytics.income.title": "Income",
        "analytics.expense.title": "Expense",
        "analytics.upload.hint": "Upload data to see insights",
        "analytics.chart.balance": "Total balance overview",
        "analytics.legend.thismonth": "This month",
        "analytics.legend.lastmonth": "Same period last month",
        "analytics.chart.stats": "Statistics",
        "analytics.chart.increase": "You have an increase of expenses in several categories this month",
        "analytics.chart.compare": "Comparing budget and expense",
        "analytics.legend.expense": "Expense",
        "analytics.legend.budget": "Budget",
        "analytics.thisyear": "This year",
        "analytics.donut.label": "This month expense",

        // Team Fin AI View
        "teamfin.title": "Team Fin AI Advisor",
        "teamfin.subtitle": "Intelligent multi-agent assistance for your financial goals",
        "teamfin.ready": "Advisor is ready",
        "teamfin.sources": "Sources",
        "teamfin.nosources": "No sources yet",
        "teamfin.agents": "Active Agents",
        "teamfin.greeting": "Hello! I'm your Team Fin AI assistant. I can consult our specialists in budgeting, savings, and investments to help you. What's on your mind today?",
        "teamfin.placeholder": "Ask about budgeting, investments, or savings...",

        // Avatar View
        "avatar.title": "Personal AI Financial Coach",
        "avatar.subtitle": "Interact with your life-like financial guide for personalized advice",
        "avatar.online": "AI Coach Online",
        "avatar.guide": "Financial Guide",
        "avatar.speak": "Speak naturally to get help with your financial journey",
        "avatar.listening": "Listening",
        "avatar.adaptive": "Adaptive AI",
        "avatar.pro.title": "Pro Insights",
        "avatar.pro.desc": "Unlock deeper financial analysis with our AI Expert.",
        "avatar.how": "How to use",
        "avatar.how1": "Click \"Join Agent\" to start",
        "avatar.how2": "Ask about specific goals",
        "avatar.how3": "Get instant visual feedback",
        "avatar.offer.title": "Special Offer",
        "avatar.offer.desc": "Premium users get 24/7 priority access to specialized avatars.",
        "avatar.upgrade": "Upgrade Now",

        // Stock Analyzer
        "stock.title": "Stock Analyzer",
        "stock.subtitle": "Real-time insights and AI-driven stock recommendations",
        "stock.select.label": "Select Predefined Asset",
        "stock.search.label": "Or Search Ticker",
        "stock.search.placeholder": "e.g. BTC",
        "stock.analyze": "Analyze",
        "stock.choose": "-- Select Stock --",
        "stock.popular": "Popular Stocks",
        "stock.commodities": "Commodities",
        "stock.chart.title": "Market Trend (Last 30 Days)",
        "stock.price": "Current Price",
        "stock.change": "Change",
        "stock.volume": "Volume",
        "stock.ai.title": "AI Analysis & Recommendation",

        // Header
        "header.search": "Search...",
        "header.chatbot.reply": "Reply to LeadBot...",

        // Shopping Assistant
        "shopping.newchat": "New chat",
        "shopping.conversations": "Your conversations",
        "shopping.clearall": "Clear All",
        "shopping.last7": "Last 7 Days",
        "shopping.settings": "Settings",
        "shopping.upgrade": "Upgrade to Pro",
        "shopping.online": "Online",
        "shopping.placeholder": "What's in your mind?",
        "shopping.greeting": "Hello! I'm your Smart Shopping Assistant. I can help you analyze if a purchase fits your budget and provide market insights. What are you looking to buy today?",

        // Chatbot
        "chatbot.online": "Online Now",
        "chatbot.greeting": "Hello! I'm ArthSaathi, your personal investment assistant. What's on your mind?",
        "chatbot.reply": "Reply to LeadBot...",
    },

    hi: {
        // Sidebar Nav
        "nav.dashboard": "डैशबोर्ड",
        "nav.analytics": "विश्लेषण",
        "nav.teamfin": "टीम फिन AI",
        "nav.avatar": "AI अवतार",
        "nav.shopping": "शॉपिंग सहायक",
        "nav.gst": "GST सलाहकार",
        "nav.stock": "स्टॉक विश्लेषक",
        "nav.offline": "ऑफलाइन मोड",
        "nav.help": "सहायता",
        "nav.logout": "लॉग आउट",

        "dashboard.title": "डैशबोर्ड डेटा हब",
        "dashboard.subtitle": "Analytics चार्ट को डायनामिक रूप से चलाने के लिए अपना डेटा अपलोड करें",
        "dashboard.upload.title": "फ़ाइलें अपलोड करें",
        "dashboard.upload.desc": "अपने खर्च डेटा (बैंक स्टेटमेंट, रसीदें, टेक्स्ट) वाले एकाधिक दस्तावेज़ चुनें।",
        "dashboard.upload.choose": "फ़ाइलें चुनें",
        "dashboard.upload.parse": "फ़ाइलें पार्स और विश्लेषण करें",
        "dashboard.manual.title": "मैन्युअल प्रविष्टि",
        "dashboard.manual.desc": "अपने वित्तीय लेनदेन सीधे पेस्ट या टाइप करें।",
        "dashboard.manual.placeholder": "उदा. इस महीने कैफे पर ₹500 खर्च किए, किराया ₹12000 है...",
        "dashboard.manual.process": "टेक्स्ट प्रोसेस करें",
        "dashboard.parsing": "AI का उपयोग करके आपका डेटा पार्स किया जा रहा है...",

        "gami.title": "आपकी उपलब्धि प्रगति",
        "gami.subtitle": "एक खर्च लक्ष्य निर्धारित करें, अपना डेटा पार्स करें, और लेवल अप करें!",
        "gami.goal.title": "मासिक लक्ष्य सेटिंग्स",
        "gami.goal.label": "अधिकतम व्यय लक्ष्य (₹)",
        "gami.goal.placeholder": "उदा. 20000",
        "gami.goal.btn": "लक्ष्य निर्धारित करें",
        "gami.goal.current": "वर्तमान लक्ष्य: निर्धारित नहीं",
        "gami.rank.title": "वर्तमान रैंक",
        "gami.rank.bronze": "ब्रॉन्ज लेवल",
        "gami.score": "स्कोर: 0",
        "gami.achievement.title": "उपलब्धि स्थिति",
        "gami.status": "डेटा की प्रतीक्षा है",
        "gami.expenses.label": "ट्रैक किए गए खर्च / लक्ष्य",
        "gami.expenses.val": "₹0 / निर्धारित नहीं",

        "analytics.title": "विश्लेषण",
        "analytics.subtitle": "आपकी वित्तीय स्थिति का विस्तृत अवलोकन",
        "analytics.thismonth": "इस महीने",
        "analytics.manage": "विजेट प्रबंधित करें",
        "analytics.add": "नया विजेट जोड़ें",
        "analytics.balance.title": "कुल बैलेंस",
        "analytics.income.title": "आय",
        "analytics.expense.title": "खर्च",
        "analytics.upload.hint": "इनसाइट देखने के लिए डेटा अपलोड करें",
        "analytics.chart.balance": "कुल बैलेंस अवलोकन",
        "analytics.legend.thismonth": "इस महीने",
        "analytics.legend.lastmonth": "पिछले महीने की समान अवधि",
        "analytics.chart.stats": "आंकड़े",
        "analytics.chart.increase": "इस महीने कई श्रेणियों में खर्च बढ़ा है",
        "analytics.chart.compare": "बजट और खर्च की तुलना",
        "analytics.legend.expense": "खर्च",
        "analytics.legend.budget": "बजट",
        "analytics.thisyear": "इस वर्ष",
        "analytics.donut.label": "इस महीने का खर्च",

        "teamfin.title": "टीम फिन AI सलाहकार",
        "teamfin.subtitle": "आपके वित्तीय लक्ष्यों के लिए बुद्धिमान मल्टी-एजेंट सहायता",
        "teamfin.ready": "सलाहकार तैयार है",
        "teamfin.sources": "स्रोत",
        "teamfin.nosources": "अभी कोई स्रोत नहीं",
        "teamfin.agents": "सक्रिय एजेंट",
        "teamfin.greeting": "नमस्ते! मैं आपका टीम फिन AI सहायक हूं। मैं बजटिंग, बचत और निवेश में आपकी सहायता के लिए विशेषज्ञों से परामर्श कर सकता हूं। आज आप क्या जानना चाहते हैं?",
        "teamfin.placeholder": "बजटिंग, निवेश, या बचत के बारे में पूछें...",

        "avatar.title": "व्यक्तिगत AI वित्तीय कोच",
        "avatar.subtitle": "व्यक्तिगत सलाह के लिए अपने जीवंत वित्तीय मार्गदर्शक से बात करें",
        "avatar.online": "AI कोच ऑनलाइन",
        "avatar.guide": "फाइनेंशियल गाइड",
        "avatar.speak": "अपनी वित्तीय यात्रा में सहायता के लिए स्वाभाविक रूप से बोलें",
        "avatar.listening": "सुन रहा है",
        "avatar.adaptive": "अनुकूली AI",
        "avatar.pro.title": "प्रो इनसाइट्स",
        "avatar.pro.desc": "हमारे AI एक्सपर्ट के साथ गहरा वित्तीय विश्लेषण अनलॉक करें।",
        "avatar.how": "उपयोग कैसे करें",
        "avatar.how1": "शुरू करने के लिए \"Join Agent\" क्लिक करें",
        "avatar.how2": "विशिष्ट लक्ष्यों के बारे में पूछें",
        "avatar.how3": "तत्काल दृश्य फ़ीडबैक प्राप्त करें",
        "avatar.offer.title": "विशेष ऑफर",
        "avatar.offer.desc": "प्रीमियम उपयोगकर्ताओं को विशेष अवतारों तक 24/7 प्राथमिकता पहुंच मिलती है।",
        "avatar.upgrade": "अभी अपग्रेड करें",

        "stock.title": "स्टॉक विश्लेषक",
        "stock.subtitle": "रियल-टाइम इनसाइट्स और AI-संचालित स्टॉक सिफारिशें",
        "stock.select.label": "पूर्वनिर्धारित संपत्ति चुनें",
        "stock.search.label": "या टिकर खोजें",
        "stock.search.placeholder": "उदा. BTC",
        "stock.analyze": "विश्लेषण करें",
        "stock.choose": "-- स्टॉक चुनें --",
        "stock.popular": "लोकप्रिय स्टॉक",
        "stock.commodities": "वस्तुएं",
        "stock.chart.title": "बाजार रुझान (पिछले 30 दिन)",
        "stock.price": "वर्तमान मूल्य",
        "stock.change": "परिवर्तन",
        "stock.volume": "मात्रा",
        "stock.ai.title": "AI विश्लेषण और सिफारिश",

        "header.search": "खोजें...",
        "shopping.newchat": "नई चैट",
        "shopping.conversations": "आपकी बातचीत",
        "shopping.clearall": "सब साफ करें",
        "shopping.last7": "पिछले 7 दिन",
        "shopping.settings": "सेटिंग्स",
        "shopping.upgrade": "प्रो में अपग्रेड करें",
        "shopping.online": "ऑनलाइन",
        "shopping.placeholder": "आपके मन में क्या है?",
        "shopping.greeting": "नमस्ते! मैं आपका स्मार्ट शॉपिंग सहायक हूं। मैं यह विश्लेषण करने में मदद कर सकता हूं कि कोई खरीदारी आपके बजट में फिट है या नहीं। आज आप क्या खरीदना चाहते हैं?",

        "chatbot.online": "अभी ऑनलाइन",
        "chatbot.greeting": "नमस्ते! मैं ArthSaathi हूं, आपका व्यक्तिगत निवेश सहायक। आपके मन में क्या है?",
        "chatbot.reply": "LeadBot को जवाब दें...",
    },

    mr: {
        // Sidebar Nav
        "nav.dashboard": "डॅशबोर्ड",
        "nav.analytics": "विश्लेषण",
        "nav.teamfin": "टीम फिन AI",
        "nav.avatar": "AI अवतार",
        "nav.shopping": "खरेदी सहाय्यक",
        "nav.gst": "GST सल्लागार",
        "nav.stock": "स्टॉक विश्लेषक",
        "nav.offline": "ऑफलाइन मोड",
        "nav.help": "मदत",
        "nav.logout": "लॉग आउट",

        "dashboard.title": "डॅशबोर्ड डेटा हब",
        "dashboard.subtitle": "Analytics चार्ट डायनामिकली चालवण्यासाठी तुमचा डेटा अपलोड करा",
        "dashboard.upload.title": "फाइल्स अपलोड करा",
        "dashboard.upload.desc": "तुमच्या खर्चाच्या डेटा असलेले एकाधिक दस्तऐवज निवडा (बँक स्टेटमेंट, पावत्या, टेक्स्ट).",
        "dashboard.upload.choose": "फाइल्स निवडा",
        "dashboard.upload.parse": "फाइल्स पार्स आणि विश्लेषण करा",
        "dashboard.manual.title": "मॅन्युअल नोंद",
        "dashboard.manual.desc": "तुमचे आर्थिक व्यवहार थेट पेस्ट किंवा टाइप करा.",
        "dashboard.manual.placeholder": "उदा. या महिन्यात कॅफेवर ₹500 खर्च केले, भाडे ₹12000 आहे...",
        "dashboard.manual.process": "मजकूर प्रक्रिया करा",
        "dashboard.parsing": "AI वापरून तुमचा डेटा पार्स केला जात आहे...",

        "gami.title": "तुमची उपलब्धी प्रगती",
        "gami.subtitle": "खर्चाचे लक्ष्य ठेवा, डेटा पार्स करा, आणि लेव्हल अप करा!",
        "gami.goal.title": "मासिक लक्ष्य सेटिंग्ज",
        "gami.goal.label": "कमाल खर्च लक्ष्य (₹)",
        "gami.goal.placeholder": "उदा. 20000",
        "gami.goal.btn": "लक्ष्य ठेवा",
        "gami.goal.current": "सध्याचे लक्ष्य: ठेवलेले नाही",
        "gami.rank.title": "सध्याचा रँक",
        "gami.rank.bronze": "ब्रॉन्झ लेव्हल",
        "gami.score": "गुण: 0",
        "gami.achievement.title": "उपलब्धी स्थिती",
        "gami.status": "डेटाची प्रतीक्षा आहे",
        "gami.expenses.label": "ट्रॅक केलेले खर्च / लक्ष्य",
        "gami.expenses.val": "₹0 / ठेवलेले नाही",

        "analytics.title": "विश्लेषण",
        "analytics.subtitle": "तुमच्या आर्थिक स्थितीचे सविस्तर अवलोकन",
        "analytics.thismonth": "या महिन्यात",
        "analytics.manage": "विजेट व्यवस्थापित करा",
        "analytics.add": "नवीन विजेट जोडा",
        "analytics.balance.title": "एकूण शिल्लक",
        "analytics.income.title": "उत्पन्न",
        "analytics.expense.title": "खर्च",
        "analytics.upload.hint": "अंतर्दृष्टी पाहण्यासाठी डेटा अपलोड करा",
        "analytics.chart.balance": "एकूण शिल्लक अवलोकन",
        "analytics.legend.thismonth": "या महिन्यात",
        "analytics.legend.lastmonth": "मागील महिन्याचा समान कालावधी",
        "analytics.chart.stats": "आकडेवारी",
        "analytics.chart.increase": "या महिन्यात अनेक श्रेणींमध्ये खर्च वाढला आहे",
        "analytics.chart.compare": "बजेट आणि खर्चाची तुलना",
        "analytics.legend.expense": "खर्च",
        "analytics.legend.budget": "बजेट",
        "analytics.thisyear": "या वर्षी",
        "analytics.donut.label": "या महिन्याचा खर्च",

        "teamfin.title": "टीम फिन AI सल्लागार",
        "teamfin.subtitle": "तुमच्या आर्थिक उद्दिष्टांसाठी बुद्धिमान मल्टी-एजंट सहाय्य",
        "teamfin.ready": "सल्लागार तयार आहे",
        "teamfin.sources": "स्रोत",
        "teamfin.nosources": "अद्याप कोणतेही स्रोत नाही",
        "teamfin.agents": "सक्रिय एजंट",
        "teamfin.greeting": "नमस्ते! मी तुमचा टीम फिन AI सहाय्यक आहे. मी बजेटिंग, बचत आणि गुंतवणूकीत मदत करण्यासाठी तज्ञांशी सल्लामसलत करू शकतो. आज तुम्हाला काय जाणून घ्यायचे आहे?",
        "teamfin.placeholder": "बजेटिंग, गुंतवणूक, किंवा बचतीबद्दल विचारा...",

        "avatar.title": "वैयक्तिक AI आर्थिक प्रशिक्षक",
        "avatar.subtitle": "वैयक्तिक सल्ल्यासाठी तुमच्या जिवंत आर्थिक मार्गदर्शकाशी संवाद साधा",
        "avatar.online": "AI प्रशिक्षक ऑनलाइन",
        "avatar.guide": "आर्थिक मार्गदर्शक",
        "avatar.speak": "तुमच्या आर्थिक प्रवासात मदतीसाठी स्वाभाविकपणे बोला",
        "avatar.listening": "ऐकत आहे",
        "avatar.adaptive": "अनुकूली AI",
        "avatar.pro.title": "प्रो अंतर्दृष्टी",
        "avatar.pro.desc": "आमच्या AI तज्ञासह सखोल आर्थिक विश्लेषण अनलॉक करा.",
        "avatar.how": "कसे वापरावे",
        "avatar.how1": "सुरू करण्यासाठी \"Join Agent\" क्लिक करा",
        "avatar.how2": "विशिष्ट उद्दिष्टांबद्दल विचारा",
        "avatar.how3": "तत्काळ व्हिज्युअल फीडबॅक मिळवा",
        "avatar.offer.title": "विशेष ऑफर",
        "avatar.offer.desc": "प्रीमियम वापरकर्त्यांना विशेष अवतारांपर्यंत 24/7 प्राधान्य प्रवेश मिळतो.",
        "avatar.upgrade": "आता अपग्रेड करा",

        "stock.title": "स्टॉक विश्लेषक",
        "stock.subtitle": "रीअल-टाइम अंतर्दृष्टी आणि AI-चालित स्टॉक शिफारसी",
        "stock.select.label": "पूर्वनिर्धारित मालमत्ता निवडा",
        "stock.search.label": "किंवा टिकर शोधा",
        "stock.search.placeholder": "उदा. BTC",
        "stock.analyze": "विश्लेषण करा",
        "stock.choose": "-- स्टॉक निवडा --",
        "stock.popular": "लोकप्रिय स्टॉक",
        "stock.commodities": "वस्तू",
        "stock.chart.title": "बाजार कल (मागील 30 दिवस)",
        "stock.price": "सध्याची किंमत",
        "stock.change": "बदल",
        "stock.volume": "व्हॉल्युम",
        "stock.ai.title": "AI विश्लेषण आणि शिफारस",

        "header.search": "शोधा...",
        "shopping.newchat": "नवीन चॅट",
        "shopping.conversations": "तुमच्या संभाषणे",
        "shopping.clearall": "सर्व साफ करा",
        "shopping.last7": "मागील 7 दिवस",
        "shopping.settings": "सेटिंग्ज",
        "shopping.upgrade": "प्रोमध्ये अपग्रेड करा",
        "shopping.online": "ऑनलाइन",
        "shopping.placeholder": "तुमच्या मनात काय आहे?",
        "shopping.greeting": "नमस्ते! मी तुमचा स्मार्ट खरेदी सहाय्यक आहे. एखादी खरेदी तुमच्या बजेटमध्ये बसेल का हे विश्लेषण करण्यात मी मदत करू शकतो. आज तुम्हाला काय विकत घ्यायचे आहे?",

        "chatbot.online": "आत्ता ऑनलाइन",
        "chatbot.greeting": "नमस्ते! मी ArthSaathi आहे, तुमचा वैयक्तिक गुंतवणूक सहाय्यक. तुमच्या मनात काय आहे?",
        "chatbot.reply": "LeadBot ला उत्तर द्या...",
    },

    es: {
        "nav.dashboard": "Tablero",
        "nav.analytics": "Analíticas",
        "nav.teamfin": "Equipo Fin IA",
        "nav.avatar": "Avatar IA",
        "nav.shopping": "Asistente de Compras",
        "nav.gst": "Asesor GST",
        "nav.stock": "Analizador de Acciones",
        "nav.offline": "Modo Sin Conexión",
        "nav.help": "Ayuda",
        "nav.logout": "Cerrar Sesión",

        "dashboard.title": "Centro de Datos del Tablero",
        "dashboard.subtitle": "Sube tus datos para potenciar los gráficos de Analíticas dinámicamente",
        "dashboard.upload.title": "Subir Archivos",
        "dashboard.upload.desc": "Selecciona múltiples documentos con tus datos de gastos (extractos bancarios, recibos, textos).",
        "dashboard.upload.choose": "Elegir Archivos",
        "dashboard.upload.parse": "Analizar Archivos",
        "dashboard.manual.title": "Entrada Manual",
        "dashboard.manual.desc": "Pega o escribe tus transacciones financieras directamente para ser analizadas.",
        "dashboard.manual.placeholder": "Ej., Gasté $50 en Café este mes, Renta es $1200...",
        "dashboard.manual.process": "Procesar Texto",
        "dashboard.parsing": "Analizando tus datos con IA...",

        "gami.title": "Tu Progreso de Logros",
        "gami.subtitle": "¡Establece una meta de gastos, analiza tus datos y sube de nivel!",
        "gami.goal.title": "Configuración de Meta Mensual",
        "gami.goal.label": "Objetivo Máximo de Gastos ($)",
        "gami.goal.placeholder": "ej. 2000",
        "gami.goal.btn": "Establecer Meta",
        "gami.goal.current": "Meta Actual: No Establecida",
        "gami.rank.title": "Rango Actual",
        "gami.rank.bronze": "Nivel Bronce",
        "gami.score": "Puntuación: 0",
        "gami.achievement.title": "Estado de Logros",
        "gami.status": "Esperando Datos",
        "gami.expenses.label": "Gastos Rastreados / Meta",
        "gami.expenses.val": "$0 / No Establecida",

        "analytics.title": "Analíticas",
        "analytics.subtitle": "Resumen detallado de tu situación financiera",
        "analytics.thismonth": "Este mes",
        "analytics.manage": "Gestionar widgets",
        "analytics.add": "Agregar nuevo widget",
        "analytics.balance.title": "Balance total",
        "analytics.income.title": "Ingresos",
        "analytics.expense.title": "Gastos",
        "analytics.upload.hint": "Sube datos para ver información",
        "analytics.chart.balance": "Resumen de balance total",
        "analytics.legend.thismonth": "Este mes",
        "analytics.legend.lastmonth": "Mismo período el mes pasado",
        "analytics.chart.stats": "Estadísticas",
        "analytics.chart.increase": "Tienes un aumento de gastos en varias categorías este mes",
        "analytics.chart.compare": "Comparando presupuesto y gastos",
        "analytics.legend.expense": "Gastos",
        "analytics.legend.budget": "Presupuesto",
        "analytics.thisyear": "Este año",
        "analytics.donut.label": "Gastos de este mes",

        "teamfin.title": "Asesor IA Equipo Fin",
        "teamfin.subtitle": "Asistencia multi-agente inteligente para tus objetivos financieros",
        "teamfin.ready": "El asesor está listo",
        "teamfin.sources": "Fuentes",
        "teamfin.nosources": "Sin fuentes aún",
        "teamfin.agents": "Agentes Activos",
        "teamfin.greeting": "¡Hola! Soy tu asistente IA Equipo Fin. Puedo consultar a nuestros especialistas en presupuestos, ahorros e inversiones para ayudarte. ¿En qué piensas hoy?",
        "teamfin.placeholder": "Pregunta sobre presupuestos, inversiones o ahorros...",

        "avatar.title": "Coach Financiero IA Personal",
        "avatar.subtitle": "Interactúa con tu guía financiero realista para consejos personalizados",
        "avatar.online": "Coach IA en Línea",
        "avatar.guide": "Guía Financiero",
        "avatar.speak": "Habla naturalmente para obtener ayuda en tu camino financiero",
        "avatar.listening": "Escuchando",
        "avatar.adaptive": "IA Adaptativa",
        "avatar.pro.title": "Perspectivas Pro",
        "avatar.pro.desc": "Desbloquea análisis financiero más profundo con nuestro Experto IA.",
        "avatar.how": "Cómo usar",
        "avatar.how1": "Haz clic en \"Unirse al Agente\" para comenzar",
        "avatar.how2": "Pregunta sobre metas específicas",
        "avatar.how3": "Obtén retroalimentación visual instantánea",
        "avatar.offer.title": "Oferta Especial",
        "avatar.offer.desc": "Los usuarios premium tienen acceso prioritario 24/7 a avatares especializados.",
        "avatar.upgrade": "Actualizar Ahora",

        "stock.title": "Analizador de Acciones",
        "stock.subtitle": "Perspectivas en tiempo real y recomendaciones de acciones impulsadas por IA",
        "stock.select.label": "Seleccionar Activo Predefinido",
        "stock.search.label": "O Buscar Ticker",
        "stock.search.placeholder": "ej. BTC",
        "stock.analyze": "Analizar",
        "stock.choose": "-- Seleccionar Acción --",
        "stock.popular": "Acciones Populares",
        "stock.commodities": "Materias Primas",
        "stock.chart.title": "Tendencia del Mercado (Últimos 30 Días)",
        "stock.price": "Precio Actual",
        "stock.change": "Cambio",
        "stock.volume": "Volumen",
        "stock.ai.title": "Análisis y Recomendación IA",

        "header.search": "Buscar...",
        "shopping.newchat": "Nueva conversación",
        "shopping.conversations": "Tus conversaciones",
        "shopping.clearall": "Limpiar todo",
        "shopping.last7": "Últimos 7 días",
        "shopping.settings": "Configuración",
        "shopping.upgrade": "Actualizar a Pro",
        "shopping.online": "En Línea",
        "shopping.placeholder": "¿En qué estás pensando?",
        "shopping.greeting": "¡Hola! Soy tu Asistente de Compras Inteligente. Puedo ayudarte a analizar si una compra se ajusta a tu presupuesto. ¿Qué quieres comprar hoy?",

        "chatbot.online": "En Línea Ahora",
        "chatbot.greeting": "¡Hola! Soy ArthSaathi, tu asistente personal de inversiones. ¿En qué piensas?",
        "chatbot.reply": "Responder a LeadBot...",
    },

    fr: {
        "nav.dashboard": "Tableau de Bord",
        "nav.analytics": "Analytiques",
        "nav.teamfin": "Équipe Fin IA",
        "nav.avatar": "Avatar IA",
        "nav.shopping": "Assistant Achats",
        "nav.gst": "Conseiller GST",
        "nav.stock": "Analyseur d'Actions",
        "nav.offline": "Mode Hors Ligne",
        "nav.help": "Aide",
        "nav.logout": "Déconnexion",

        "dashboard.title": "Hub de Données du Tableau de Bord",
        "dashboard.subtitle": "Téléchargez vos données pour alimenter les graphiques Analytiques dynamiquement",
        "dashboard.upload.title": "Télécharger des Fichiers",
        "dashboard.upload.desc": "Sélectionnez plusieurs documents contenant vos données de dépenses (relevés bancaires, reçus, textes).",
        "dashboard.upload.choose": "Choisir des Fichiers",
        "dashboard.upload.parse": "Analyser les Fichiers",
        "dashboard.manual.title": "Saisie Manuelle",
        "dashboard.manual.desc": "Collez ou tapez vos transactions financières directement pour analyse.",
        "dashboard.manual.placeholder": "Ex., Dépensé 50€ au Café ce mois, Loyer est 1200€...",
        "dashboard.manual.process": "Traiter le Texte",
        "dashboard.parsing": "Analyse de vos données avec l'IA en cours...",

        "gami.title": "Votre Progression d'Accomplissement",
        "gami.subtitle": "Fixez un objectif de dépenses, analysez vos données et montez de niveau!",
        "gami.goal.title": "Paramètres d'Objectif Mensuel",
        "gami.goal.label": "Objectif de Dépenses Maximum (€)",
        "gami.goal.placeholder": "ex. 2000",
        "gami.goal.btn": "Fixer l'Objectif",
        "gami.goal.current": "Objectif Actuel: Non Fixé",
        "gami.rank.title": "Rang Actuel",
        "gami.rank.bronze": "Niveau Bronze",
        "gami.score": "Score: 0",
        "gami.achievement.title": "Statut d'Accomplissement",
        "gami.status": "En Attente de Données",
        "gami.expenses.label": "Dépenses Suivies / Objectif",
        "gami.expenses.val": "€0 / Non Fixé",

        "analytics.title": "Analytiques",
        "analytics.subtitle": "Vue d'ensemble détaillée de votre situation financière",
        "analytics.thismonth": "Ce mois-ci",
        "analytics.manage": "Gérer les widgets",
        "analytics.add": "Ajouter un widget",
        "analytics.balance.title": "Solde total",
        "analytics.income.title": "Revenus",
        "analytics.expense.title": "Dépenses",
        "analytics.upload.hint": "Téléchargez des données pour voir les insights",
        "analytics.chart.balance": "Aperçu du solde total",
        "analytics.legend.thismonth": "Ce mois-ci",
        "analytics.legend.lastmonth": "Même période le mois dernier",
        "analytics.chart.stats": "Statistiques",
        "analytics.chart.increase": "Vous avez une augmentation des dépenses dans plusieurs catégories ce mois-ci",
        "analytics.chart.compare": "Comparaison budget et dépenses",
        "analytics.legend.expense": "Dépenses",
        "analytics.legend.budget": "Budget",
        "analytics.thisyear": "Cette année",
        "analytics.donut.label": "Dépenses de ce mois",

        "teamfin.title": "Conseiller IA Équipe Fin",
        "teamfin.subtitle": "Assistance multi-agents intelligente pour vos objectifs financiers",
        "teamfin.ready": "Le conseiller est prêt",
        "teamfin.sources": "Sources",
        "teamfin.nosources": "Aucune source encore",
        "teamfin.agents": "Agents Actifs",
        "teamfin.greeting": "Bonjour! Je suis votre assistant IA Équipe Fin. Je peux consulter nos spécialistes en budgétisation, épargne et investissements pour vous aider. À quoi pensez-vous aujourd'hui?",
        "teamfin.placeholder": "Posez des questions sur le budget, les investissements ou l'épargne...",

        "avatar.title": "Coach Financier IA Personnel",
        "avatar.subtitle": "Interagissez avec votre guide financier réaliste pour des conseils personnalisés",
        "avatar.online": "Coach IA en Ligne",
        "avatar.guide": "Guide Financier",
        "avatar.speak": "Parlez naturellement pour obtenir de l'aide dans votre parcours financier",
        "avatar.listening": "À l'écoute",
        "avatar.adaptive": "IA Adaptative",
        "avatar.pro.title": "Insights Pro",
        "avatar.pro.desc": "Débloquez une analyse financière plus approfondie avec notre Expert IA.",
        "avatar.how": "Comment utiliser",
        "avatar.how1": "Cliquez sur \"Rejoindre l'Agent\" pour commencer",
        "avatar.how2": "Posez des questions sur des objectifs spécifiques",
        "avatar.how3": "Obtenez un retour visuel instantané",
        "avatar.offer.title": "Offre Spéciale",
        "avatar.offer.desc": "Les utilisateurs premium ont un accès prioritaire 24/7 aux avatars spécialisés.",
        "avatar.upgrade": "Mettre à Niveau Maintenant",

        "stock.title": "Analyseur d'Actions",
        "stock.subtitle": "Insights en temps réel et recommandations d'actions pilotées par IA",
        "stock.select.label": "Sélectionner un Actif Prédéfini",
        "stock.search.label": "Ou Rechercher un Ticker",
        "stock.search.placeholder": "ex. BTC",
        "stock.analyze": "Analyser",
        "stock.choose": "-- Sélectionner une Action --",
        "stock.popular": "Actions Populaires",
        "stock.commodities": "Matières Premières",
        "stock.chart.title": "Tendance du Marché (30 Derniers Jours)",
        "stock.price": "Prix Actuel",
        "stock.change": "Variation",
        "stock.volume": "Volume",
        "stock.ai.title": "Analyse et Recommandation IA",

        "header.search": "Rechercher...",
        "shopping.newchat": "Nouvelle conversation",
        "shopping.conversations": "Vos conversations",
        "shopping.clearall": "Tout effacer",
        "shopping.last7": "7 Derniers Jours",
        "shopping.settings": "Paramètres",
        "shopping.upgrade": "Passer à Pro",
        "shopping.online": "En Ligne",
        "shopping.placeholder": "À quoi pensez-vous?",
        "shopping.greeting": "Bonjour! Je suis votre Assistant d'Achats Intelligent. Je peux vous aider à analyser si un achat correspond à votre budget. Que souhaitez-vous acheter aujourd'hui?",

        "chatbot.online": "En Ligne Maintenant",
        "chatbot.greeting": "Bonjour! Je suis ArthSaathi, votre assistant personnel en investissements. À quoi pensez-vous?",
        "chatbot.reply": "Répondre à LeadBot...",
    }
};

// ——————————————————————————————————————
// i18n Engine
// ——————————————————————————————————————

const I18N = {
    currentLang: localStorage.getItem('as_lang') || 'en',

    t(key) {
        const lang = TRANSLATIONS[this.currentLang] || TRANSLATIONS['en'];
        return lang[key] || TRANSLATIONS['en'][key] || key;
    },

    setLang(lang) {
        if (!TRANSLATIONS[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('as_lang', lang);
        this.applyAll();
        this.updateDropdownUI();
    },

    applyAll() {
        // Apply all data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = val;
            } else {
                el.textContent = val;
            }
        });

        // Apply data-i18n-placeholder separately if needed
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
        });

        // Update html lang attribute
        document.documentElement.lang = this.currentLang;
    },

    updateDropdownUI() {
        const langBtn = document.getElementById('lang-selected-label');
        const langFlag = document.getElementById('lang-selected-flag');
        if (!langBtn) return;
        const opt = document.querySelector(`.lang-option[data-lang="${this.currentLang}"]`);
        if (opt) {
            langFlag.textContent = opt.querySelector('.lang-flag').textContent;
            langBtn.textContent = opt.querySelector('.lang-name').textContent;
        }
    },

    init() {
        this.applyAll();
        this.updateDropdownUI();
        this.setupDropdown();
    },

    setupDropdown() {
        const trigger = document.getElementById('lang-switcher-btn');
        const dropdown = document.getElementById('lang-dropdown');
        if (!trigger || !dropdown) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
            trigger.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
            trigger.classList.remove('active');
        });

        dropdown.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = opt.getAttribute('data-lang');
                this.setLang(lang);

                // Mark selected
                dropdown.querySelectorAll('.lang-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                dropdown.classList.remove('open');
                trigger.classList.remove('active');
            });
        });

        // Mark current lang as selected
        const current = dropdown.querySelector(`.lang-option[data-lang="${this.currentLang}"]`);
        if (current) current.classList.add('selected');
    }
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    I18N.init();
});
