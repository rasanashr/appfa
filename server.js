import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ========== HTML ساده برای تست ==========
const HTML_FORM = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>پیرایشگر - تست API</title>
    <style>
        body { font-family: tahoma; background: #0f172a; color: white; padding: 2rem; }
        textarea { width: 100%; background: #1e293b; border: 1px solid #334155; color: white; padding: 1rem; border-radius: 1rem; }
        button { background: #10b981; color: #0f172a; padding: 0.75rem 2rem; border: none; border-radius: 1rem; font-weight: bold; cursor: pointer; margin-top: 1rem; }
        pre { background: #1e293b; padding: 1rem; border-radius: 1rem; overflow-x: auto; margin-top: 1rem; }
        .error { color: #ef4444; }
        .success { color: #10b981; }
        .api-key-input { width: 100%; background: #1e293b; border: 1px solid #334155; color: white; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem; }
        .card { background: #1e293b; padding: 1.5rem; border-radius: 1.5rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div style="max-width: 800px; margin: 0 auto;">
        <h1>🖊️ پیرایشگر متن</h1>
        
        <div class="card">
            <label>🔑 کلید API (اختیاری - می‌تونی اینجا وارد کنی):</label>
            <input type="text" id="apiKey" class="api-key-input" placeholder="AIzaSy..." value="">
            <small style="color: #94a3b8;">اگه خالی بذاری، از کلید سرور استفاده میشه</small>
        </div>
        
        <div class="card">
            <label>📝 متن خود را وارد کن:</label>
            <textarea id="text" rows="5" placeholder="متن خبر یا یادداشت خود را اینجا بنویس..."></textarea>
            
            <select id="tone" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: white; padding: 0.75rem; border-radius: 0.75rem; margin-top: 1rem;">
                <option value="formal">رسمی و تحلیلی</option>
                <option value="sensational">تیتر زرد و جذاب</option>
                <option value="educational">آموزشی و سئو شده</option>
            </select>
            
            <button onclick="rewrite()">🚀 شروع بازنویسی</button>
        </div>
        
        <div id="loading" style="display: none; text-align: center; padding: 2rem;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #10b981; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p>در حال پردازش با هوش مصنوعی...</p>
        </div>
        
        <div id="result" style="display: none;" class="card">
            <h2 id="title" style="color: #10b981;"></h2>
            <div id="content" style="line-height: 1.8;"></div>
            <div id="keywords" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;"></div>
        </div>
        
        <div id="error" style="display: none;" class="card error"></div>
    </div>
    
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    
    <script>
        async function rewrite() {
            const text = document.getElementById('text').value;
            const tone = document.getElementById('tone').value;
            const apiKey = document.getElementById('apiKey').value;
            
            if (!text.trim()) {
                alert('لطفاً متن را وارد کن');
                return;
            }
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            
            try {
                console.log('Sending request...');
                const response = await fetch('/api/rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: text, 
                        tone: tone, 
                        grammarStrictness: 'strict',
                        apiKey: apiKey || undefined
                    })
                });
                
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                
                if (response.ok && data.success) {
                    document.getElementById('title').textContent = data.data.title;
                    document.getElementById('content').innerHTML = data.data.content;
                    
                    const keywordsDiv = document.getElementById('keywords');
                    keywordsDiv.innerHTML = '';
                    data.data.keywords.forEach(kw => {
                        const span = document.createElement('span');
                        span.style.cssText = 'background: #10b98120; color: #10b981; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.875rem;';
                        span.textContent = '#' + kw;
                        keywordsDiv.appendChild(span);
                    });
                    
                    document.getElementById('result').style.display = 'block';
                } else {
                    throw new Error(data.error || 'خطای ناشناخته');
                }
            } catch (error) {
                console.error('Error:', error);
                const errorDiv = document.getElementById('error');
                errorDiv.innerHTML = \`❌ خطا: \${error.message}<br><br>
                <small>راه‌حل‌ها:<br>
                1. کلید API معتبر را وارد کن<br>
                2. مطمئن شو سرویس Gemini فعال است<br>
                3. چند دقیقه دیگه دوباره تلاش کن</small>\`;
                errorDiv.style.display = 'block';
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }
    </script>
</body>
</html>
`;

// ========== اندپوینت‌های سرور ==========

app.get('/', (req, res) => {
    res.send(HTML_FORM);
});

app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, tone, grammarStrictness, apiKey } = req.body;
        
        console.log('📝 Received request:', { textLength: text?.length, tone, hasApiKey: !!apiKey });
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'متن ورودی الزامی است' });
        }

        // اولویت: apiKey کاربر > متغیر محیطی
        const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
        
        console.log('🔑 API Key status:', activeApiKey ? '✅ موجود' : '❌ وجود ندارد');
        
        if (!activeApiKey) {
            return res.status(400).json({ 
                error: 'کلید API تنظیم نشده است. لطفاً کلید خود را در کادر بالا وارد کنید یا متغیر محیطی GEMINI_API_KEY را تنظیم نمایید.' 
            });
        }
        
        // بررسی فرمت کلید
        if (!activeApiKey.startsWith('AIza')) {
            console.warn('⚠️ API Key format seems invalid:', activeApiKey.substring(0, 10) + '...');
        }
        
        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // استفاده از مدل پایدارتر
        
        const prompt = `تو یک خبرنگار حرفه‌ای سئو هستی. متن زیر را با لحن "${tone}" بازنویسی کن.

متن: ${text}

خروجی را دقیقاً در قالب JSON زیر برگردان (فقط JSON، هیچ متن دیگری):
{
    "title": "عنوان جذاب و سئو شده به فارسی",
    "content": "متن بازنویسی شده با تگ‌های HTML (h2, h3, p, strong)",
    "keywords": ["کلیدواژه1", "کلیدواژه2", "کلیدواژه3"]
}`;

        console.log('🤖 Sending to Gemini...');
        const result = await model.generateContent(prompt);
        const response = result.response;
        const rawText = response.text();
        
        console.log('📥 Gemini response:', rawText.substring(0, 200));
        
        // استخراج JSON از پاسخ
        let parsedData;
        try {
            // تلاش برای پارس کردن مستقیم
            parsedData = JSON.parse(rawText);
        } catch (e) {
            // استخراج با رجکس
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('پاسخ Gemini فرمت JSON ندارد');
            }
        }
        
        // اعتبارسنجی
        if (!parsedData.title || !parsedData.content || !parsedData.keywords) {
            throw new Error('پاسخ کامل نیست');
        }
        
        res.json({
            success: true,
            data: parsedData
        });
        
    } catch (error) {
        console.error('❌ Error details:', error);
        
        // تشخیص نوع خطا
        let errorMessage = error.message;
        if (error.message.includes('401') || error.message.includes('API key')) {
            errorMessage = 'کلید API نامعتبر است. لطفاً یک کلید معتبر از Google AI Studio دریافت کن.';
        } else if (error.message.includes('429')) {
            errorMessage = 'محدودیت درخواست. چند دقیقه صبر کن و دوباره تلاش کن.';
        } else if (error.message.includes('503')) {
            errorMessage = 'سرویس Gemini در دسترس نیست. کمی بعد تلاش کن.';
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        hasApiKey: !!process.env.GEMINI_API_KEY,
        message: 'سرور فعال است'
    });
});

app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${process.env.GEMINI_API_KEY ? '✅ بله' : '❌ خیر'}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser\n`);
});