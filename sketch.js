let quizTable; 
let questions = []; 
let currentQuestionIndex = 0;
let totalScore = 0;
let quizState = 'QUIZ'; // 狀態: 'QUIZ' (測驗中), 'FEEDBACK' (結果回饋)
let selectedOption = -1;
let hoverOption = -1; 
let dots = []; // *** 將 dots 定義在這裡，以便在 draw 函式中持續更新 ***
let dotsInitialized = false; // *** 新增一個旗標來控制點點的初始化狀態 ***

// --- 預載入：載入 CSV 檔案 ---
function preload() {
    quizTable = loadTable('questions.csv', 'csv', 'header'); 
}

// --- 設定：初始化畫布與問題資料 ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    // 將 CSV 數據轉換為易於使用的 JavaScript 物件陣列
    for (let r = 0; r < quizTable.getRowCount(); r++) {
        let row = quizTable.getRow(r);
        questions.push({
            question: row.getString('question'),
            options: [
                row.getString('optionA'),
                row.getString('optionB'),
                row.getString('optionC')
            ],
            correct: row.getNum('correctIndex'),
            score: row.getNum('score')
        });
    }
    noCursor(); 
}

// --- 繪製：主迴圈 ---
function draw() {
    background(240);

    if (quizState === 'QUIZ') {
        drawQuiz();
        drawCustomCursor();
    } else if (quizState === 'FEEDBACK') {
        // *** 狀態切換時，先觸發一次初始化 (如果還沒做) ***
        if (!dotsInitialized) {
            initializeDots(); // 確保彈跳點點被初始化
            dotsInitialized = true;
        }
        
        drawFeedback();
        // *** 移除 noCursor() 讓系統游標出現，或者持續繪製自定義游標 ***
    }
}

// --- 繪製測驗畫面 ---
function drawQuiz() {
    if (currentQuestionIndex < questions.length) {
        let q = questions[currentQuestionIndex];
        
        // 顯示分數
        fill(50);
        textSize(18);
        textAlign(LEFT);
        text(`分數: ${totalScore}`, 50, 50);

        // 顯示問題
        textSize(24);
        textAlign(CENTER);
        text(`Q${currentQuestionIndex + 1}: ${q.question}`, width / 2, 150);

        // 顯示選項
        let optionY = 250;
        let optionHeight = 60;
        let optionMargin = 20;
        hoverOption = -1;

        for (let i = 0; i < q.options.length; i++) {
            let x = width / 4;
            let y = optionY + i * (optionHeight + optionMargin);
            let w = width / 2;
            let h = optionHeight;

            // 檢查游標是否懸停
            if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
                hoverOption = i;
            }

            // 選項背景色
            if (i === selectedOption) {
                fill(100, 150, 255); 
            } else if (i === hoverOption) {
                fill(200); 
            } else {
                fill(220); 
            }
            rect(x, y, w, h, 10); 

            // 選項文字
            fill(0);
            textSize(18);
            textAlign(CENTER, CENTER);
            text(q.options[i], x + w / 2, y + h / 2);
        }
    } else {
        // 測驗結束，進入回饋狀態
        quizState = 'FEEDBACK';
        // 確保進入回饋狀態後，我們不需要隱藏游標了
        cursor(ARROW); 
    }
}

// --- 處理滑鼠點擊作答 ---
function mousePressed() {
    if (quizState === 'QUIZ' && currentQuestionIndex < questions.length && hoverOption !== -1) {
        selectedOption = hoverOption; 
        let q = questions[currentQuestionIndex];
        
        setTimeout(() => {
            if (selectedOption === q.correct) {
                totalScore += q.score;
            }
            currentQuestionIndex++;
            selectedOption = -1;
        }, 300); 
    }
}

// --- 繪製自定義游標特效 ---
function drawCustomCursor() {
    push();
    translate(mouseX, mouseY);
    noFill();
    strokeWeight(2);
    
    let pulse = sin(frameCount * 0.1) * 5 + 10;
    if (hoverOption !== -1) {
        stroke(255, 100, 100);
        ellipse(0, 0, pulse * 1.5);
        line(-5, 0, 5, 0);
        line(0, -5, 0, 5);
        cursor(HAND);
    } else {
        stroke(50, 100);
        ellipse(0, 0, pulse);
        cursor(CROSS);
    }
    pop();
}


// --- 繪製動態回饋畫面 ---
function drawFeedback() {
    let finalScore = totalScore;
    let maxScore = questions.length * questions[0].score;

    let titleText, messageText, animationColor;

    if (finalScore === maxScore) {
        titleText = "🎉 恭喜你！太棒了！ 🎉";
        messageText = "你獲得了滿分！簡直是天才！";
        animationColor = color(255, 215, 0); 
        drawConfetti(animationColor);
    } else if (finalScore >= maxScore * 0.7) {
        titleText = "✨ 幹得好！成績優異！ ✨";
        messageText = `你的分數是 ${finalScore}，表現非常出色！`;
        animationColor = color(0, 200, 0); 
        drawStarBurst(animationColor);
    } else {
        titleText = "💪 別灰心，再試一次！ 💪";
        messageText = `你的分數是 ${finalScore}，繼續努力就會進步！`;
        animationColor = color(0, 150, 255); 
        drawBouncingDots(animationColor); // *** 這裡直接調用繪製和更新函式 ***
    }

    fill(50);
    textSize(36);
    textAlign(CENTER);
    text(titleText, width / 2, height / 2 - 50);
    textSize(24);
    text(messageText, width / 2, height / 2 + 10);
}

// --- 動態回饋：紙花特效 (滿分) ---
function drawConfetti(c) {
    for (let i = 0; i < 50; i++) {
        push();
        // 讓紙花從頂部落下
        let x = noise(i * 0.1, frameCount * 0.05) * width;
        // 模運算實現循環下落
        let y = (frameCount * 3 + i * 30) % (height + 50) - 50;
        
        // 顏色使用隨機色
        fill(random(255), random(255), random(255), 200);
        // 旋轉紙花 (讓它看起來更動態)
        translate(x, y);
        rotate(frameCount * 0.05 + i);
        rect(0, 0, 10, 10);
        pop();
    }
}

// --- 動態回饋：星星閃耀特效 (優秀) ---
function drawStarBurst(c) {
    push();
    translate(width / 2, height / 2);
    // 讓整個星星群體旋轉
    rotate(frameCount * 0.005);
    
    // 閃耀的星星從中心向外擴散
    let numStars = 12;
    for (let i = 0; i < numStars; i++) {
        let angle = map(i, 0, numStars, 0, TWO_PI);
        let radius = sin(frameCount * 0.1 + i * 0.5) * 50 + 80; // 讓半徑有脈動
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;
        
        let starSize = sin(frameCount * 0.2 + i) * 8 + 12; // 讓大小閃爍
        
        fill(c);
        noStroke();
        ellipse(x, y, starSize, starSize);
    }
    pop();
}

// --- 動態回饋：鼓勵的彈跳點點 (初始化) ---
function initializeDots() {
    dots = [];
    let numDots = 15;
    for (let i = 0; i < numDots; i++) {
        dots.push({
            x: random(width / 4, width * 3 / 4),
            y: random(height / 2, height * 3 / 4),
            vx: random(-3, 3),
            vy: random(-10, -5),
            r: random(8, 15) // 讓點點有不同大小
        });
    }
}

// --- 動態回饋：鼓勵的彈跳點點 (繪製與更新) ---
function drawBouncingDots(c) {
    let gravity = 0.5;

    fill(c);
    noStroke();
    for (let dot of dots) {
        // 物理更新
        dot.vy += gravity;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // 邊界碰撞 (底部)
        if (dot.y + dot.r > height) {
            dot.y = height - dot.r;
            dot.vy *= -0.8; 
        }
        
        // 邊界碰撞 (左右)
        if (dot.x - dot.r < 0 || dot.x + dot.r > width) {
            dot.vx *= -1;
        }

        ellipse(dot.x, dot.y, dot.r * 2);
    }
}