import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// HTML ساده برای تست
const HTML_FORM = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>پیرایشگر - ویرایشگر هوشمند</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .card {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 24px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #cbd5e1;
            font-weight: bold;
        }
        textarea, input, select {
            width: 100%;
            padding: 12px;
            background: #1e293b;
            border: 1px solid #334155;
            color: white;
            border-radius: 12px;
            font-size: 14px;
            font-family: inherit;
        }
        textarea:focus, input:focus, select:focus {
            outline: none;
            border-color: #10b981;
        }
        button {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .result-area {
            background: #0f172a;
            border-radius: 16px;
            padding: 20px;
            margin-top: 16px;
        }
        .keyword {
            display: inline-block;
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin: 4px;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #334155;
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
            padding: 16px;
            border-radius: 12px;
            margin-top: 16px;
        }
        .success {
            color: #10b981;
        }
        .api-status {
            font-size: 12px;
            padding: 8px;
            border-radius: 8px;
            margin-top: 8px;
        }
        .status-ok {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        .status-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        h2, h3 {
            color: #10b981;
            margin-bottom: 12px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖊️ پیرایشگر متن هوشمند</h1>
            <p style="color: #94a3b8; margin-top: 8px;">بازنویسی حرفه‌ای با هوش مصنوعی Gemini</p>
        </div>

        <div class="card">
            <label>🔑 کلید API Gemini</label>
            <input type="password" id="apiKey" placeholder="AIzaSy..." value="">
            <div id="apiStatus" class="api-status"></div>
            <small style="color: #64748b;">💡 از https://aistudio.google.com/apikey بگیر</small>
        </div>

        <div class="grid-2">
            <div class="card">
                <label>📝 متن ورودی</label>
                <textarea id="inputText" rows="8" placeholder="متن خبر، مقاله یا یادداشت خود را اینجا بنویسید..."></textarea>
                
                <label style="margin-top: 16px;">🎭 لحن نگارش</label>
                <select id="tone">
                    <option value="رسمی و خبری">رسمی و خبری</option>
                    <option value="تیتر زرد و جذاب">تیتر زرد و جذاب</option>
                    <option value="آموزشی و سئو شده">آموزشی و سئو شده</option>
                    <option value="موجز و شبکه‌های اجتماعی">موجز و شبکه‌های اجتماعی</option>
                </select>
                
                <button onclick="rewrite()" id="rewriteBtn" style="margin-top: 24px; width: 100%;">
                    🚀 بازنویسی هوشمند
                </button>
            </div>

            <div class="card">
                <label>✨ نتیجه بازنویسی</label>
                <div id="resultArea">
                    <div style="color: #64748b; text-align: center; padding: 40px;">
                        نتیجه بازنویسی اینجا نمایش داده می‌شود...
                    </div>
                </div>
            </div>
        </div>

        <div id="loading" class="loading">
            <div class="spinner"></div>
            <p style="color: #94a3b8;">در حال پردازش با هوش مصنوعی Gemini...</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 8px;">این فرآیند حدود 5-10 ثانیه طول می‌کشد</p>
        </div>
    </div>

    <script>
        // بررسی کلید API
        function checkApiKey() {
            const apiKey = document.getElementById('apiKey').value;
            const statusDiv = document.getElementById('apiStatus');
            if (apiKey && apiKey.startsWith('AIza')) {
                statusDiv.innerHTML = '✅ کلید API معتبر به نظر می‌رسد';
                statusDiv.className = 'api-status status-ok';
            } else if (apiKey) {
                statusDiv.innerHTML = '⚠️ فرمت کلید API صحیح نیست (باید با AIza شروع شود)';
                statusDiv.className = 'api-status status-error';
            } else {
                statusDiv.innerHTML = '⚠️ لطفاً کلید API خود را وارد کنید';
                statusDiv.className = 'api-status status-error';
            }
        }

        document.getElementById('apiKey').addEventListener('input', checkApiKey);
        
        // تابع اصلی بازنویسی
        async function rewrite() {
            const text = document.getElementById('inputText').value;
            const tone = document.getElementById('tone').value;
            const apiKey = document.getElementById('apiKey').value;
            
            if (!text.trim()) {
                alert('لطفاً متن خود را وارد کنید');
                return;
            }
            
            if (!apiKey || !apiKey.startsWith('AIza')) {
                alert('لطفاً یک کلید API معتبر از Google AI Studio وارد کنید');
                return;
            }
            
            // نمایش لودینگ
            document.getElementById('loading').style.display = 'block';
            document.getElementById('rewriteBtn').disabled = true;
            document.getElementById('resultArea').innerHTML = '<div style="color: #64748b; text-align: center; padding: 40px;">در حال بازنویسی...</div>';
            
            try {
                console.log('Sending request to /api/rewrite');
                
                const response = await fetch('/api/rewrite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        tone: tone,
                        apiKey: apiKey
                    })
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                console.log('Response data:', data);
                
                if (data.success) {
                    // نمایش نتیجه
                    let keywordsHtml = '';
                    if (data.data.keywords && data.data.keywords.length) {
                        keywordsHtml = '<div style="margin-top: 16px;"><strong>🔑 کلمات کلیدی:</strong><br>';
                        data.data.keywords.forEach(kw => {
                            keywordsHtml += `<span class="keyword">#${kw}</span>`;
                        });
                        keywordsHtml += '</div>';
                    }
                    
                    document.getElementById('resultArea').innerHTML = `
                        <h2>📰 ${data.data.title}</h2>
                        <div class="result-area">
                            ${data.data.content}
                        </div>
                        ${keywordsHtml}
                        <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
                            ✅ بازنویسی با موفقیت انجام شد
                        </div>
                    `;
                } else {
                    throw new Error(data.error || 'خطای ناشناخته');
                }
                
            } catch (error) {
                console.error('Rewrite error:', error);
                document.getElementById('resultArea').innerHTML = `
                    <div class="error">
                        ❌ خطا: ${error.message}<br><br>
                        <strong>راه‌حل:</strong><br>
                        1. مطمئن شوید کلید API معتبر است<br>
                        2. چند دقیقه صبر کنید و دوباره تلاش کنید<br>
                        3. از https://aistudio.google.com/apikey کلید جدید بگیرید
                    </div>
                `;
            } finally {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('rewriteBtn').disabled = false;
            }
        }
        
        // چک کردن اولیه
        checkApiKey();
    </script>
</body>
</html>
`;

// ========== اندپوینت بازنویسی ==========
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, tone, apiKey } = req.body;
        
        console.log('=' .repeat(50));
        console.log('📝 درخواست جدید دریافت شد');
        console.log('طول متن:', text?.length);
        console.log('لحن:', tone);
        console.log('کلید API:', apiKey ? `${apiKey.substring(0, 15)}...` : 'ندارد');
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'متن ورودی الزامی است' });
        }
        
        if (!apiKey) {
            return res.status(400).json({ error: 'کلید API الزامی است' });
        }
        
        // راه‌اندازی Gemini با جدیدترین نسخه
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // استفاده از مدل پایدار و تست شده
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `شما یک خبرنگار حرفه‌ای و متخصص سئو هستید. متن زیر را با لحن "${tone}" بازنویسی کنید.

متن اصلی:
${text}

قوانین:
1. عنوانی جذاب و سئو شده بنویسید
2. متن را با تگ‌های HTML ساده (p, h2, h3, strong) فرمت کنید
3. از نیم‌فاصله استفاده کنید
4. 3 کلمه کلیدی مرتبط استخراج کنید

خروجی را فقط در قالب JSON زیر برگردانید (هیچ متن اضافه‌ای خارج از JSON ننویسید):
{
    "title": "عنوان سئو شده",
    "content": "<p>متن بازنویسی شده با HTML</p>",
    "keywords": ["کلمه1", "کلمه2", "کلمه3"]
}`;

        console.log('🤖 ارسال به Gemini...');
        
        // تنظیم تایم‌اوت 30 ثانیه
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('مدت زمان درخواست بیش از حد مجاز')), 30000);
        });
        
        const apiPromise = model.generateContent(prompt);
        const result = await Promise.race([apiPromise, timeoutPromise]);
        
        const response = result.response;
        const rawText = response.text();
        
        console.log('📥 پاسخ دریافت شد:', rawText.substring(0, 200));
        
        // استخراج JSON
        let parsedData;
        try {
            // تلاش برای پیدا کردن JSON در متن
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                parsedData = JSON.parse(rawText);
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
            throw new Error('فرمت پاسخ نامعتبر است');
        }
        
        // اعتبارسنجی
        if (!parsedData.title || !parsedData.content) {
            throw new Error('پاسخ ناقص است');
        }
        
        // اطمینان از وجود keywords
        if (!parsedData.keywords || !Array.isArray(parsedData.keywords)) {
            parsedData.keywords = ['سئو', 'محتوا', 'بازنویسی'];
        }
        
        console.log('✅ بازنویسی موفقیت‌آمیز بود');
        console.log('عنوان:', parsedData.title);
        
        res.json({
            success: true,
            data: parsedData
        });
        
    } catch (error) {
        console.error('❌ خطا:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('API key')) {
            errorMessage = 'کلید API نامعتبر است. لطفاً از https://aistudio.google.com/apikey یک کلید جدید بگیرید.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'محدودیت استفاده از API. لطفاً چند دقیقه صبر کنید.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'مدت زمان درخواست طولانی شد. دوباره تلاش کنید.';
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// اندپوینت سلامت
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        time: new Date().toISOString(),
        message: 'سرور پیرایشگر فعال است'
    });
});

// صفحه اصلی
app.get('/', (req, res) => {
    res.send(HTML_FORM);
});

// شروع سرور
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 پیرایشگر روی پورت ${PORT} اجرا شد`);
    console.log(`📝 آدرس: http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
});