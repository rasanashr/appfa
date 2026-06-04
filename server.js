import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// اندپوینت بازنویسی
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, tone, apiKey, model = 'gemini-2.0-flash-exp' } = req.body;
        
        console.log('='.repeat(50));
        console.log('📝 درخواست جدید:', { 
            textLength: text?.length, 
            tone: tone, 
            model: model 
        });
        
        if (!text || !apiKey) {
            return res.status(400).json({ error: 'متن و کلید API الزامی است' });
        }
        
        // راه‌اندازی Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const aiModel = genAI.getGenerativeModel({ model: model });
        
        const prompt = `شما یک خبرنگار حرفه‌ای و متخصص سئو هستید. متن زیر را با لحن "${tone}" بازنویسی کنید.

متن اصلی:
${text}

قوانین:
1. عنوانی جذاب و سئو شده بنویسید
2. متن را با تگ‌های HTML ساده (p, h2, h3, strong) فرمت کنید
3. از نیم‌فاصله استفاده کنید
4. دقیقا 3 کلمه کلیدی مرتبط استخراج کنید

خروجی را فقط در قالب JSON زیر برگردانید (هیچ متن دیگری خارج از JSON ننویسید):
{
    "title": "عنوان سئو شده",
    "content": "<p>متن بازنویسی شده با تگ‌های HTML</p>",
    "keywords": ["کلمه1", "کلمه2", "کلمه3"]
}`;

        console.log('🤖 ارسال به مدل:', model);
        
        const result = await aiModel.generateContent(prompt);
        const response = result.response;
        const rawText = response.text();
        
        console.log('📥 پاسخ دریافت شد');
        
        // استخراج JSON
        let parsedData;
        try {
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
        
        if (!parsedData.keywords || !Array.isArray(parsedData.keywords)) {
            parsedData.keywords = ['سئو', 'محتوا', 'بازنویسی'];
        }
        
        console.log('✅ بازنویسی موفق:', parsedData.title);
        
        res.json({
            success: true,
            data: parsedData,
            model: model
        });
        
    } catch (error) {
        console.error('❌ خطا:', error.message);
        
        let errorMessage = error.message;
        if (error.message.includes('API key') || error.message.includes('403')) {
            errorMessage = 'کلید API نامعتبر است. لطفاً از https://aistudio.google.com/apikey یک کلید جدید بگیرید.';
        } else if (error.message.includes('429')) {
            errorMessage = 'محدودیت درخواست. چند دقیقه صبر کنید.';
        } else if (error.message.includes('404')) {
            errorMessage = 'مدل مورد نظر یافت نشد. از مدل gemini-2.0-flash-exp استفاده کنید.';
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// اندپوینت سلامت
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        time: new Date().toISOString(),
        models: ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-pro']
    });
});

// صفحه اصلی - فایل HTML رو از پوشه public برگردون
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// شروع سرور
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ سرور پیرایشگر روی پورت ${PORT} اجرا شد`);
    console.log(`📝 آدرس: http://localhost:${PORT}`);
    console.log(`🤖 مدل پیش‌فرض: gemini-2.0-flash-exp`);
    console.log('='.repeat(50) + '\n');
});