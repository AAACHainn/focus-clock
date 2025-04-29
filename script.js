// 获取DOM元素
const durationInput = document.getElementById('duration');
const durationValue = document.getElementById('durationValue');
const minIntervalInput = document.getElementById('minInterval');
const maxIntervalInput = document.getElementById('maxInterval');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const restAlert = document.getElementById('restAlert');
const nextAlertDisplay = document.getElementById('nextAlertDisplay');
const testSoundBtn = document.getElementById('testSoundBtn');

// 创建音频元素
const alertSound = new Audio('music/ding.mp3');
// 设置音量 (0.0 到 1.0 之间的值)
alertSound.volume = 0.3; // 设置为较轻柔的音量
// 预加载音频
alertSound.load();

// 网页原始标题
const originalTitle = document.title;

// 状态变量
let timer = null;
let timeLeft = 0;
let isRunning = false;
let nextAlertTime = 0;
let lastTimestamp = 0;
let secondsUntilNextAlert = 0;
let isPaused = false; // 新增暂停状态标记
let soundVolume = 0.3; // 默认音量值

// 从localStorage加载设置
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('focusTimerSettings')) || {};
    
    // 加载设置值，如果没有则使用默认值
    if (settings.duration) {
        durationInput.value = settings.duration;
        durationValue.textContent = settings.duration;
    }
    
    if (settings.minInterval) {
        minIntervalInput.value = settings.minInterval;
    }
    
    if (settings.maxInterval) {
        maxIntervalInput.value = settings.maxInterval;
    }
    
    // 加载音量设置
    if (settings.soundVolume !== undefined) {
        soundVolume = settings.soundVolume;
        alertSound.volume = soundVolume;
    }
    
    // 恢复计时器状态 - 针对正在运行或已暂停的计时器
    if (settings.timeLeft) {
        timeLeft = settings.timeLeft;
        nextAlertTime = settings.nextAlertTime || 0;
        isPaused = settings.isPaused || false;
        
        // 如果计时器正在运行（而不是暂停状态），计算经过的时间并更新
        if (settings.isRunning && !isPaused) {
            lastTimestamp = settings.lastTimestamp || 0;
            if (lastTimestamp) {
                const elapsedSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);
                if (elapsedSeconds > 0) {
                    timeLeft = Math.max(0, timeLeft - elapsedSeconds);
                    
                    // 更新下一次提示时间
                    if (nextAlertTime > 0) {
                        nextAlertTime = Math.max(0, nextAlertTime - elapsedSeconds);
                    }
                }
            }
            
            // 如果仍有时间剩余并且之前是运行状态，则继续运行
            if (timeLeft > 0) {
                startTimer(true);
            }
        } else if (isPaused) {
            // 如果是暂停状态，显示暂停界面
            updatePausedUI();
            // 更新标题以反映暂停状态
            updateTabTitle();
        }
        
        updateTimerDisplay();
        updateNextAlertDisplay();
    } else {
        timeLeft = parseInt(durationInput.value) * 60;
        updateTimerDisplay();
    }
    
    // 更新音量调节器
    if (volumeControl) {
        volumeControl.value = soundVolume * 100;
        volumeValueDisplay.textContent = Math.round(soundVolume * 100);
    }
}

// 保存设置到localStorage
function saveSettings() {
    const settings = {
        duration: durationInput.value,
        minInterval: minIntervalInput.value,
        maxInterval: maxIntervalInput.value,
        timeLeft: timeLeft,
        isRunning: isRunning,
        isPaused: isPaused,
        nextAlertTime: nextAlertTime,
        lastTimestamp: isRunning ? Date.now() : 0,
        soundVolume: soundVolume
    };
    
    localStorage.setItem('focusTimerSettings', JSON.stringify(settings));
}

// 更新暂停状态的UI
function updatePausedUI() {
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

// 更新时长显示
durationInput.addEventListener('input', () => {
    const value = durationInput.value;
    durationValue.textContent = value;
    if (!isRunning && !isPaused) {
        timeLeft = value * 60;
        updateTimerDisplay();
    }
    saveSettings();
});

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新浏览器标签页标题
    updateTabTitle();
}

// 更新浏览器标签页标题
function updateTabTitle() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (isRunning) {
        document.title = `⏱ ${timeString} - 专注中`;
    } else if (isPaused) {
        document.title = `⏸ ${timeString} - 已暂停`;
    } else if (timeLeft <= 0) {
        document.title = `✅ 已完成 - ${originalTitle}`;
    } else {
        document.title = originalTitle;
    }
}

// 更新下一次提示音倒计时显示
function updateNextAlertDisplay() {
    if (nextAlertTime > 0) {
        secondsUntilNextAlert = nextAlertTime;
        let displayText = '';
        
        if (secondsUntilNextAlert >= 60) {
            const minutes = Math.floor(secondsUntilNextAlert / 60);
            const seconds = secondsUntilNextAlert % 60;
            displayText = `${minutes}分${seconds > 0 ? seconds + '秒' : ''}`;
        } else {
            displayText = `${secondsUntilNextAlert}秒`;
        }
        
        nextAlertDisplay.textContent = displayText;
    } else {
        nextAlertDisplay.textContent = "未设置";
    }
}

// 播放提示音
function playAlertSound() {
    console.log('播放提示音');
    // 重置音频以确保可以再次播放
    alertSound.pause();
    alertSound.currentTime = 0;
    
    // 确保使用当前设置的音量
    alertSound.volume = soundVolume;
    
    // 使用 Promise 确保播放开始
    const playPromise = alertSound.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('音频播放成功，音量：', soundVolume);
        }).catch(error => {
            console.error('播放音频失败:', error);
            // 尝试用其他方式播放
            setTimeout(() => {
                alertSound.play().catch(e => console.error('二次尝试失败:', e));
            }, 100);
        });
    }
}

// 添加音量调节功能
const volumeControl = document.getElementById('volumeControl');
const volumeValueDisplay = document.getElementById('volumeValue');

if (volumeControl && volumeValueDisplay) {
    // 初始化音量控制
    volumeControl.value = soundVolume * 100;
    volumeValueDisplay.textContent = Math.round(soundVolume * 100);
    
    // 监听音量变化
    volumeControl.addEventListener('input', () => {
        const newVolume = volumeControl.value / 100;
        soundVolume = newVolume;
        alertSound.volume = newVolume;
        volumeValueDisplay.textContent = Math.round(newVolume * 100);
        saveSettings();
    });
}

// 显示休息提示
function showRestAlert() {
    restAlert.classList.remove('hidden');
    restAlert.classList.add('pulse');
    
    setTimeout(() => {
        restAlert.classList.add('hidden');
        restAlert.classList.remove('pulse');
    }, 10000);
}

// 设置下一个提示时间（以秒为单位）
function setNextAlertTime() {
    const minInterval = parseInt(minIntervalInput.value);
    const maxInterval = parseInt(maxIntervalInput.value);
    // 确保最小值不大于最大值
    const actualMin = Math.min(minInterval, maxInterval);
    const actualMax = Math.max(minInterval, maxInterval);
    
    // 将分钟转换为秒，然后添加随机秒数
    const minSeconds = actualMin * 60;
    const maxSeconds = actualMax * 60;
    // 在最小和最大秒数之间随机选择，确保颗粒度为秒
    nextAlertTime = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds);
    updateNextAlertDisplay();
    
    const minutes = Math.floor(nextAlertTime / 60);
    const seconds = nextAlertTime % 60;
    console.log(`下一次提示音将在 ${minutes}分${seconds > 0 ? seconds + '秒' : ''} 后播放`);
}

// 开始计时器
function startTimer(isResuming = false) {
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    // 如果不是恢复之前的计时，则设置新的提示时间
    if (!isResuming || nextAlertTime <= 0) {
        setNextAlertTime();
    }
    
    // 更新标签页标题
    updateTabTitle();
    
    saveSettings();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // 更新下一次提示时间显示
        if (nextAlertTime > 0) {
            nextAlertTime--;
            updateNextAlertDisplay();
            
            // 检查是否需要播放提示音
            if (nextAlertTime === 0) {
                playAlertSound();
                showRestAlert();
                
                // 设置下一个提示时间
                setNextAlertTime();
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            isRunning = false;
            isPaused = false;
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            playAlertSound();
            updateTabTitle();
        }
        
        saveSettings();
    }, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isRunning = false;
    isPaused = true; // 设置暂停状态
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    
    // 更新标签页标题以显示暂停状态
    updateTabTitle();
    
    saveSettings();
}

// 重置计时器
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    timeLeft = parseInt(durationInput.value) * 60;
    nextAlertTime = 0;
    updateTimerDisplay();
    updateNextAlertDisplay();
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    restAlert.classList.add('hidden');
    
    // 恢复原始标题
    document.title = originalTitle;
    
    saveSettings();
}

// 设置变更监听
minIntervalInput.addEventListener('change', () => {
    if (!isRunning && nextAlertTime > 0) {
        setNextAlertTime();
    }
    saveSettings();
});

maxIntervalInput.addEventListener('change', () => {
    if (!isRunning && nextAlertTime > 0) {
        setNextAlertTime();
    }
    saveSettings();
});

// 测试声音按钮
testSoundBtn.addEventListener('click', playAlertSound);

// 事件监听
startBtn.addEventListener('click', () => startTimer(isPaused)); // 传递暂停状态作为恢复标志
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// 页面关闭前保存状态
window.addEventListener('beforeunload', saveSettings);

// 初始化
loadSettings(); 