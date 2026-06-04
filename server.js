// server.js - سرور اصلی
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Multer config for image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('فقط فایل‌های تصویر مجاز هستند'));
        }
    }
});

// Initialize Gemini
const genAI = (apiKey) => new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);

// حافظه موقت برای ذخیره تاریخچه (در production از دیتابیس استفاده کن)
let historyStore = [];
let sessionId = Date.now().toString();

// سیستم پرامپت اصلی (همانند نسخه فرانت‌اند)
const SYSTEM_PROMPT = `
شما یک سردبیر و خبرنگار حرفه‌ای، باسابقه و متخصص سئو (SEO) در وب فارسی هستید.
وظیفه شما بازنویسی متن‌های دریافتی به شیوه‌ای کاملاً حرفه‌ای، جذاب، خبرنگاری و کاملاً بهینه‌سازی شده برای موتورهای جستجو است.

قوانین سفت و سخت نگارشی و فرمت‌بندی:
۱. علائم نگارشی را کاملاً در مکان مناسب قرار دهید.
۲. رعایت دقیق نیم‌فاصله‌ها الزامی است.
۳. به هیچ وجه از ساختارهای مارک‌داون استفاده نکنید. متن خروجی باید کاملاً در قالب کدهای استاندارد HTML تمیز باشد.
۴. یک عنوان جذاب با نرخ کلیک بالا به زبان روزنامه‌نگاری سئومحور ایجاد کنید.
۵. دقیقاً بین ۳ تا ۴ کلمه کلیدی استراتژیک استخراج کنید.
۶. یک پرامپت انگلیسی برای تصویرساز Imagen 4 بنویسید (سبک تصویرسازی برداری مدرن یا عکاسی دراماتیک ژورنالیستی).

خروجی را دقیقاً در قالب JSON زیر برگردانید:
{
    "title": "عنوان سئو شده به فارسی",
    "content": "متن بازنویسی شده با تگ‌های HTML معتبر",
    "keywords": ["کلیدواژه1", "کلیدواژه2", "کلیدواژه3"],
    "image_prompt": "English prompt for image generation"
}
`;

// اندپوینت بازنویسی متن
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, tone, grammarStrictness, apiKey } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'متن ورودی الزامی است' });
        }

        const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!activeApiKey) {
            return res.status(400).json({ error: 'کلید API الزامی است' });
        }

        const genAIClient = genAI(activeApiKey);
        const model = genAIClient.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                topP: 0.95
            }
        });

        const userPrompt = `
لطفاً متن زیر را با لحن "${tone}" و سخت‌گیری سجاوندی "${grammarStrictness}" بازنویسی کنید.
متن خام جهت پردازش:
"""
${text}
"""
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        });

        const response = result.response;
        const rawResponse = response.text();
        
        // Parse JSON response
        let parsedData;
        try {
            parsedData = JSON.parse(rawResponse);
        } catch (e) {
            // Fallback: extract JSON from text if needed
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('فرمت پاسخ نامعتبر است');
            }
        }

        // Validate keywords count
        if (!parsedData.keywords || parsedData.keywords.length < 3 || parsedData.keywords.length > 4) {
            parsedData.keywords = parsedData.keywords?.slice(0, 4) || ["پیش‌فرض", "کلیدواژه", "سئو"];
        }

        // Save to history
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            rawInput: text,
            title: parsedData.title,
            content: parsedData.content,
            keywords: parsedData.keywords,
            image_prompt: parsedData.image_prompt,
            tone,
            grammarStrictness
        };
        
        historyStore.unshift(historyItem);
        if (historyStore.length > 50) historyStore.pop();

        res.json({
            success: true,
            data: parsedData,
            historyId: historyItem.id
        });

    } catch (error) {
        console.error('Rewrite Error:', error);
        res.status(500).json({ 
            error: 'خطا در بازنویسی متن',
            details: error.message 
        });
    }
});

// اندپوینت دریافت تاریخچه
app.get('/api/history', (req, res) => {
    res.json({
        success: true,
        history: historyStore
    });
});

// اندپوینت دریافت یک آیتم خاص از تاریخچه
app.get('/api/history/:id', (req, res) => {
    const item = historyStore.find(h => h.id == req.params.id);
    if (item) {
        res.json({ success: true, data: item });
    } else {
        res.status(404).json({ error: 'آیتم یافت نشد' });
    }
});

// اندپوینت حذف تاریخچه
app.delete('/api/history', (req, res) => {
    historyStore = [];
    res.json({ success: true, message: 'تاریخچه پاک شد' });
});

// اندپوینت تولید تصویر با Imagen 4
app.post('/api/generate-image', upload.single('referenceImage'), async (req, res) => {
    try {
        const { prompt, title, apiKey, imageUrl, imageSource } = req.body;
        const referenceImage = req.file;
        
        let finalPrompt = prompt;
        const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'کلید API الزامی است' });
        }

        const genAIClient = genAI(activeApiKey);

        // اگر تصویر مرجع داریم، اول با Gemini Vision آنالیز کن
        if (imageSource === 'upload' && referenceImage) {
            const visionModel = genAIClient.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            
            const base64Image = referenceImage.buffer.toString('base64');
            const mimeType = referenceImage.mimetype;
            
            const visionPrompt = `
            Analyze this image in relation to the news article title: "${title}". 
            Create a highly detailed, professional, and modern editorial featured image prompt in English for Imagen 4. 
            The prompt should recreate and improve this exact visual concept to match the news title, 
            aiming for a professional, crisp news illustration or photo, with 16:9 ratio. 
            Do not output any text in the image. Return ONLY the English prompt.
            `;
            
            const visionResult = await visionModel.generateContent([
                { text: visionPrompt },
                { inlineData: { mimeType, data: base64Image } }
            ]);
            
            const enhancedPrompt = visionResult.response.text();
            if (enhancedPrompt && enhancedPrompt.length > 10) {
                finalPrompt = enhancedPrompt.trim();
            }
        } 
        else if (imageSource === 'url' && imageUrl) {
            finalPrompt = `${prompt}. Recreate the concept inspired by this reference: ${imageUrl}`;
        }

        if (!finalPrompt || finalPrompt.length < 10) {
            finalPrompt = `Editorial featured news image, clean professional digital art style, representing theme: ${title}, beautiful colors, 16:9 widescreen layout, highly detailed, no text.`;
        }

        // تولید تصویر با Imagen 4
        const imagenModel = genAIClient.getGenerativeModel({ model: "imagen-3.0-generate-001" });
        
        const imageResult = await imagenModel.generateContent({
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: {
                temperature: 1.0,
                candidateCount: 1,
                aspectRatio: "16:9",
                outputMimeType: "image/png"
            }
        });

        const generatedImage = imageResult.response;
        const imageBase64 = generatedImage.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (imageBase64) {
            res.json({
                success: true,
                imageData: `data:image/png;base64,${imageBase64}`,
                usedPrompt: finalPrompt
            });
        } else {
            throw new Error('تصویری تولید نشد');
        }

    } catch (error) {
        console.error('Image Generation Error:', error);
        res.status(500).json({ 
            error: 'خطا در تولید تصویر',
            details: error.message 
        });
    }
});

// اندپوینت بررسی سلامت
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        version: '1.0.0',
        historyCount: historyStore.length,
        sessionId
    });
});

// شروع سرور
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoints:`);
    console.log(`   POST   /api/rewrite       - بازنویسی متن`);
    console.log(`   POST   /api/generate-image - تولید تصویر`);
    console.log(`   GET    /api/history       - دریافت تاریخچه`);
    console.log(`   DELETE /api/history       - پاک کردن تاریخچه`);
});