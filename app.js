(() => {
  "use strict";

  const ENDPOINT = "https://emtygujjgdhsorkgmwjn.supabase.co/functions/v1/early-access";
  const conversations = [
    { id: 1, name: "Nour Hassan", status: "risk", channel: "WhatsApp", time: "09:42", sla: "12m", subject: { en: "Order arrived incomplete", ar: "الطلب وصل غير مكتمل" }, messages: [
      { role: "customer", en: "One item was missing from the delivery I received today.", ar: "هناك منتج ناقص من طلب التوصيل الذي استلمته اليوم." },
      { role: "agent", en: "I’m sorry about that. I’m checking the order details now.", ar: "نأسف لذلك. أراجع تفاصيل الطلب الآن." }
    ]},
    { id: 2, name: "Omar Ali", status: "open", channel: "Email", time: "09:31", sla: "1h 18m", subject: { en: "Subscription renewal", ar: "تجديد الاشتراك" }, messages: [
      { role: "customer", en: "Can I switch from monthly billing to annual billing before renewal?", ar: "هل يمكنني التحويل من الدفع الشهري إلى السنوي قبل التجديد؟" }
    ]},
    { id: 3, name: "Mariam Adel", status: "closed", channel: "Web", time: "09:05", sla: "Met", subject: { en: "Account access", ar: "الوصول إلى الحساب" }, messages: [
      { role: "customer", en: "The password reset link expired before I could use it.", ar: "انتهت صلاحية رابط إعادة تعيين كلمة المرور قبل أن أستخدمه." },
      { role: "agent", en: "I sent a fresh link to the verified email address.", ar: "أرسلت رابطًا جديدًا إلى البريد الإلكتروني المؤكد." }
    ]}
  ];

  let lang = localStorage.getItem("scalecx-language") === "ar" ? "ar" : "en";
  let filter = "all";
  let selected = 1;

  const language = document.getElementById("language");
  const tickets = document.getElementById("tickets");
  const conversation = document.getElementById("conversation");
  const form = document.getElementById("waitlist");
  const status = document.getElementById("status");

  const t = (value) => typeof value === "string" ? value : value[lang];

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    language.textContent = lang === "ar" ? "English" : "العربية";
    document.querySelectorAll("[data-en]").forEach((element) => {
      element.textContent = element.dataset[lang];
    });
    renderTickets();
    renderConversation();
  }

  function visibleTickets() {
    if (filter === "all") return conversations;
    return conversations.filter((item) => item.status === filter);
  }

  function renderTickets() {
    tickets.innerHTML = visibleTickets().map((item) => `
      <button class="ticket ${selected === item.id ? "active" : ""}" data-id="${item.id}" type="button">
        <header><strong>${item.name}</strong><time>${item.time}</time></header>
        <p>${t(item.subject)}</p>
        <span class="badge">${item.channel}</span>
        ${item.status === "risk" ? `<span class="badge risk">${lang === "ar" ? "خطر SLA" : "SLA risk"}</span>` : ""}
      </button>
    `).join("") || `<div class="empty"><p>${lang === "ar" ? "لا توجد محادثات في هذا الطابور." : "No conversations in this queue."}</p></div>`;

    tickets.querySelectorAll(".ticket").forEach((button) => {
      button.addEventListener("click", () => {
        selected = Number(button.dataset.id);
        renderTickets();
        renderConversation();
      });
    });
  }

  function renderConversation() {
    const item = conversations.find((record) => record.id === selected);
    if (!item || !visibleTickets().some((record) => record.id === selected)) {
      conversation.innerHTML = `<div class="empty"><span>◇</span><p>${lang === "ar" ? "اختر محادثة لمعاينة مساحة العمل." : "Select a conversation to preview the workspace."}</p></div>`;
      return;
    }
    conversation.innerHTML = `
      <header class="conversation-head">
        <div><h3>${item.name} · ${t(item.subject)}</h3><p>${item.channel} · ${lang === "ar" ? "سجل خيالي" : "Fictional record"}</p></div>
        <span class="sla">${lang === "ar" ? "الوقت المتبقي" : "SLA remaining"}: ${item.sla}</span>
      </header>
      <div class="messages">
        ${item.messages.map((message) => `<div class="message ${message.role === "agent" ? "agent" : ""}">${message[lang]}</div>`).join("")}
      </div>
    `;
  }

  function attribution() {
    const params = new URLSearchParams(location.search);
    return {
      source: params.get("utm_source") || (document.referrer ? new URL(document.referrer).hostname : "direct"),
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || ""
    };
  }

  language.addEventListener("click", () => {
    lang = lang === "en" ? "ar" : "en";
    localStorage.setItem("scalecx-language", lang);
    applyLanguage();
  });

  document.querySelectorAll(".queue").forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll(".queue").forEach((item) => item.classList.toggle("active", item === button));
      const first = visibleTickets()[0];
      selected = first ? first.id : null;
      renderTickets();
      renderConversation();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "status";
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const payload = {
      name: values.get("name"),
      email: values.get("email"),
      company: values.get("company"),
      teamSize: values.get("teamSize"),
      website: values.get("website"),
      consent: values.get("consent") === "on",
      locale: lang,
      ...attribution()
    };

    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    status.textContent = lang === "ar" ? "جارٍ إرسال الطلب..." : "Submitting your request...";

    try {
      const result = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(body.error || "request_failed");
      form.reset();
      status.className = "status success";
      status.textContent = lang === "ar"
        ? "تم استلام طلبك. سنتواصل معك عند توفر مرحلة مناسبة."
        : "Your request was received. We’ll contact you when a suitable stage opens.";
    } catch (error) {
      status.className = "status error";
      const invalid = error.message === "invalid_submission";
      status.textContent = invalid
        ? (lang === "ar" ? "راجع البيانات والموافقة ثم حاول مرة أخرى." : "Check your details and consent, then try again.")
        : (lang === "ar" ? "الوصول المبكر غير متاح الآن. لم يتم حفظ بياناتك." : "Early access is not available yet. Your details were not stored.");
    } finally {
      submit.disabled = false;
    }
  });

  applyLanguage();
})();