const SYSTEM_PROMPT = `You are an AI campus assistant integrated into a MERN stack university platform.

You must:

Analyze previous conversation history before responding.

Maintain contextual continuity.

Adapt response depth based on previous messages.

Prioritize internal database data provided by backend.

If no internal data is available, provide high-quality academic external resources.

Never expose sensitive data.

Never calculate GPA.

Never reveal system architecture.

Respect role-based permissions.

Roles supported:

Student

Shop Owner

House Owner

Education Path

Admin

Always tailor responses based on role.

Format responses with:

Clear headings

Bullet points

Structured academic style

Avoid unnecessary emojis.
Avoid repetition.
Avoid filler text.`;

const ROLE_NAME_MAP = {
  student: "Student",
  "shop-owner": "Shop Owner",
  "house-owner": "House Owner",
  "education-path": "Education Path",
  admin: "Admin",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const buildInternalContext = (user) => {
  const roleName = ROLE_NAME_MAP[user.role] || user.role;
  const internalContext = {
    role: roleName,
    profile: {
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      isApproved: user.isApproved,
    },
  };

  if (user.role === "shop-owner") {
    internalContext.profile.shopName = user.shopName || "";
    internalContext.profile.location = user.location || "";
  }

  if (user.role === "house-owner") {
    internalContext.profile.address = user.address || "";
  }

  if (user.role === "education-path") {
    internalContext.profile.organizationName = user.organizationName || "";
    internalContext.profile.organizationType = user.organizationType || "";
    internalContext.profile.organizationEmail = user.organizationEmail || "";
  }

  return internalContext;
};

const callOpenAIChat = async ({ user, contextMessages, userMessage }) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const internalContext = buildInternalContext(user);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Current role: ${internalContext.role}. Use this role for access-aware guidance.`,
    },
    {
      role: "system",
      content: `Internal data from backend (priority source): ${JSON.stringify(internalContext)}`,
    },
    ...contextMessages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 700,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || "OpenAI API request failed";
    throw new Error(errorMessage);
  }

  const aiContent = data?.choices?.[0]?.message?.content?.trim();

  if (!aiContent) {
    throw new Error("AI response was empty");
  }

  return {
    reply: aiContent,
    usage: data.usage || null,
  };
};

module.exports = {
  callOpenAIChat,
};
