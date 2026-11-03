// Use native global fetch available in Node 18+

const sendResetEmail = async (email, token) => {
  try {
    const apiUrl = process.env.EMAIL_API_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api/sendEmail` : "http://localhost:5173/api/sendEmail");

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email via Vercel API");
    }

    console.log("✅ EMAIL SUCCESSFULLY GAYI VIA VERCEL! Message ID:", data.messageId);
    return data;
  } catch (error) {
    console.error("❌ Error while sending mail via Vercel:", error.message);
    throw error;
  }
};

module.exports = sendResetEmail;