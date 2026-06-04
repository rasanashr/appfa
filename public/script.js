document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('processBtn');
    const videoUrlInput = document.getElementById('videoUrl');
    const statusContainer = document.getElementById('statusContainer');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const playerContainer = document.getElementById('playerContainer');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let player = videojs('my-video');
    let pollInterval;

    processBtn.addEventListener('click', async () => {
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) {
            alert('لطفا لینک ویدیو را وارد کنید');
            return;
        }

        // Reset UI
        playerContainer.classList.add('hidden');
        statusContainer.classList.remove('hidden');
        statusText.textContent = 'در حال ارسال درخواست به سرور...';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        processBtn.disabled = true;

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl })
            });

            const data = await response.json();
            if (data.id) {
                startPolling(data.id);
            } else {
                throw new Error(data.error || 'خطا در شروع پردازش');
            }
        } catch (error) {
            alert('خطا: ' + error.message);
            statusContainer.classList.add('hidden');
            processBtn.disabled = false;
        }
    });

    function startPolling(id) {
        pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/status/${id}`);
                if (!response.ok) throw new Error('وضعیت یافت نشد');
                
                const data = await response.json();

                if (data.status === 'downloading') {
                    statusText.textContent = 'در حال دریافت ویدیو توسط سرور... (این مرحله ممکن است کمی طول بکشد)';
                    progressFill.style.width = '10%';
                    progressPercent.textContent = '10%';
                } else if (data.status === 'transcoding') {
                    const progress = Math.round(data.progress || 0);
                    statusText.textContent = 'در حال پردازش هوشمند و ساخت لایه‌های کیفیت (Adaptive)...';
                    progressFill.style.width = progress + '%';
                    progressPercent.textContent = progress + '%';
                } else if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    progressFill.style.width = '100%';
                    progressPercent.textContent = '100%';
                    setTimeout(() => {
                        showPlayer(data.playlistUrl, data.downloadUrl);
                    }, 500);
                } else if (data.status === 'error') {
                    clearInterval(pollInterval);
                    alert('متاسفانه خطایی در پردازش ویدیو رخ داد. لطفا لینک دیگری را امتحان کنید.');
                    statusContainer.classList.add('hidden');
                    processBtn.disabled = false;
                }
            } catch (error) {
                console.error('Polling error:', error);
                clearInterval(pollInterval);
                statusContainer.classList.add('hidden');
                processBtn.disabled = false;
            }
        }, 2000);
    }

    function showPlayer(playlistUrl, downloadUrl) {
        statusContainer.classList.add('hidden');
        playerContainer.classList.remove('hidden');
        processBtn.disabled = false;

        player.src({
            src: playlistUrl,
            type: 'application/x-mpegURL'
        });

        downloadBtn.href = downloadUrl;
        
        // Scroll to player
        playerContainer.scrollIntoView({ behavior: 'smooth' });
        
        player.play().catch(e => console.log("Auto-play blocked, waiting for user interaction"));
    }
});
