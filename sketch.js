let snake;
let food;
let gridSize = 50;
let cols, rows;
let score = 0;

let foodImages = [];
let currentFoodFrames = [];
let foodFrameIndex = 0;

let headImgs = {};
let bodyImgs = {};
let tailImgs = {};

let gameState = "start"; // start, playing, gameOver

let bgFrames = [];
let bgmStarted = false;
let currentBgIndex = -1;
let previousBgIndex = -1;
let frameDelay = 5; // 每幾幀換一張
let frameCounter = 0;

let gameOverTime = 0;
let canRestart = false;

let eatSound;
let bgm;

let swipeStartX = 0;
let swipeStartY = 0;

let expandImgs = {};
let isTouchControl = false;

function preload() {
  for (let i = 0; i < 12; i++) {
    bgFrames[i] = loadImage(`background/bg_${i}.png`);
  }
  
  eatSound = loadSound('music/eat.mp3');
  bgm = loadSound('music/bgm.mp3');
  
  // Head
  headImgs = {
    'left': [],
    'right': [],
    'up_l': [],
    'up_r': [],
    'down_l': [],
    'down_r': []
  };
  
  for (let i = 0; i < 4; i++) {
    headImgs['left'][i] = loadImage(`snake/head_l_${i}.png`);
    headImgs['right'][i] = loadImage(`snake/head_r_${i}.png`);
    headImgs['up_l'][i] = loadImage(`snake/head_lu_${i}.png`);
    headImgs['up_r'][i] = loadImage(`snake/head_ru_${i}.png`);
    headImgs['down_l'][i] = loadImage(`snake/head_ld_${i}.png`);
    headImgs['down_r'][i] = loadImage(`snake/head_rd_${i}.png`);
  }

  // Body
  bodyImgs['vertical'] = loadImage("snake/body_v.png");
  bodyImgs['horizontal'] = loadImage("snake/body_h.png");
  bodyImgs['turn_ul'] = loadImage("snake/body_ul.png");
  bodyImgs['turn_ur'] = loadImage("snake/body_ur.png");
  bodyImgs['turn_dl'] = loadImage("snake/body_dl.png");
  bodyImgs['turn_dr'] = loadImage("snake/body_dr.png");

  // Tail
  tailImgs['up'] = loadImage("snake/tail_up.png");
  tailImgs['down'] = loadImage("snake/tail_down.png");
  tailImgs['left'] = loadImage("snake/tail_left.png");
  tailImgs['right'] = loadImage("snake/tail_right.png");
  
  // Foods
  foodImages.push([loadImage('foods/apple.png')]);
  
  let birdFrames = [];
  for (let i = 0; i < 2; i++) {
    birdFrames.push(loadImage(`foods/bird_${i}.png`));
  }
  foodImages.push(birdFrames);
  
  let fireFrames = [];
  for (let i = 0; i < 2; i++) {
    fireFrames.push(loadImage(`foods/fire_${i}.png`));
  }
  foodImages.push(fireFrames);
  
  let heartFrames = [];
  for (let i = 0; i < 2; i++) {
    heartFrames.push(loadImage(`foods/heart_${i}.png`));
  }
  foodImages.push(heartFrames);
  
  let ingotFrames = [];
  for (let i = 0; i < 2; i++) {
    ingotFrames.push(loadImage(`foods/ingot_${i}.png`));
  }
  foodImages.push(ingotFrames);
  
  let lightningFrames = [];
  for (let i = 0; i < 2; i++) {
    lightningFrames.push(loadImage(`foods/lightning_${i}.png`));
  }
  foodImages.push(lightningFrames);
  
  let planetFrames = [];
  for (let i = 0; i < 2; i++) {
    planetFrames.push(loadImage(`foods/planet_${i}.png`));
  }
  foodImages.push(planetFrames);
  
  let smileFrames = [];
  for (let i = 0; i < 2; i++) {
    smileFrames.push(loadImage(`foods/smile_${i}.png`));
  }
  foodImages.push(smileFrames);
  
  let starFrames = [];
  for (let i = 0; i < 2; i++) {
    starFrames.push(loadImage(`foods/star_${i}.png`));
  }
  foodImages.push(starFrames);
  
  expandImgs['body_dl_expand'] = loadImage("snake/body_dl_expand.png");
  expandImgs['body_dr_expand'] = loadImage("snake/body_dr_expand.png");
  expandImgs['body_h_expand'] = loadImage("snake/body_h_expand.png");
  expandImgs['body_ul_expand'] = loadImage("snake/body_ul_expand.png");
  expandImgs['body_ur_expand'] = loadImage("snake/body_ur_expand.png");
  expandImgs['body_v_expand'] = loadImage("snake/body_v_expand.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight - 50);
  canvas.parent('game-area');
  updateGrid();
  frameRate(5);
  changeBackground();
}

function draw() {
  image(bgFrames[currentBgIndex], 0, 0, width, height);

  // 每 frameDelay 幀隨機換下一張
  frameCounter++;
  if (frameCounter >= frameDelay) {
    changeBackground();
    frameCounter = 0;
  }
  
  // 分數區域
  fill(255);
  rect(0, 0, width, gridSize); // y=0 ~ gridSize

  fill(0);
  textSize(24);
  textAlign(LEFT, CENTER);
  text(`Score: ${score}`, 10, gridSize / 2);

  if (gameState === "start") {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Press any key to start", width / 2, height / 2);
    return;
  }

  if (gameState === "gameOver") {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(`Score: ${snake.score}`, width / 2, height / 2 - 20);
    
    if (millis() - gameOverTime > 1000) {
      textSize(20);
      text("Press any key to restart", width / 2, height / 2 + 20);
      canRestart = true;
    }
    return;
  }
  
  snake.update();
  if (snake.dead()) {
    gameState = "gameOver";
    gameOverTime = millis();  // ⬅️ 加這行，記錄時間
    canRestart = false;
    return;
  }
  snake.show();

  if (snake.eat(food)) {
    score++;
    placeFood();
  }

  let img = currentFoodFrames[foodFrameIndex];
  image(img, food.x, food.y, gridSize, gridSize);
  foodFrameIndex = (foodFrameIndex + 1) % currentFoodFrames.length;
}

function changeBackground() {
  let nextIndex;
  do {
    nextIndex = floor(random(bgFrames.length));
  } while (nextIndex === currentBgIndex); // 不讓下一張跟現在一樣

  previousBgIndex = currentBgIndex;
  currentBgIndex = nextIndex;
}

function touchStarted(event) {
  if (touches.length > 0) {
    isTouchControl = true; // 啟用觸控控制模式
    swipeStartX = mouseX;
    swipeStartY = mouseY;
  }
}

function touchEnded(event) {
  if (!bgmStarted) {
    bgm.play();
    bgm.loop();
    bgmStarted = true;
  }
  if (!isTouchControl) return;

  if (gameState === "start") {
    score = 0;
    snake = new Snake();
    placeFood();
    gameState = "playing";
    return;
  }
  if (gameState === "gameOver" && canRestart) {
    score = 0;
    snake = new Snake();
    placeFood();
    gameState = "playing";
    return;
  }

  let dx = mouseX - swipeStartX;
  let dy = mouseY - swipeStartY;

  if (abs(dx) > abs(dy)) {
    if (dx > 20) snake.setDir(1, 0);
    else if (dx < -20) snake.setDir(-1, 0);
  } else {
    if (dy > 20) snake.setDir(0, 1);
    else if (dy < -20) snake.setDir(0, -1);
  }
}

function keyPressed() {
  if (!bgmStarted) {
    bgm.play();
    bgm.loop();
    bgmStarted = true;
  }
  
  isTouchControl = false;
  
  if (gameState === "start") {
    score = 0;
    snake = new Snake();
    placeFood();
    gameState = "playing";
    return;
  }
  if (gameState === "gameOver" && canRestart) {
    score = 0;
    snake = new Snake();
    placeFood();
    gameState = "playing";
    return;
  }
  
  if (keyCode === UP_ARROW || key === 'w') snake.setDir(0, -1);
  else if (keyCode === DOWN_ARROW || key === 's') snake.setDir(0, 1);
  else if (keyCode === LEFT_ARROW || key === 'a') snake.setDir(-1, 0);
  else if (keyCode === RIGHT_ARROW || key === 'd') snake.setDir(1, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 50);
  updateGrid();
}

function updateGrid() {
  cols = floor(width / gridSize);
  rows = floor(height / gridSize);
}

function placeFood() {
  let valid = false;
  while (!valid) {
    let x = floor(random(cols));
    let y = floor(random(1, rows)); // y=0 是 score 區，避開
    food = createVector(x * gridSize, y * gridSize);
    valid = true;
    
    // 檢查是否碰到蛇的身體
    for (let part of snake.body) {
      if (part.x === food.x && part.y === food.y) {
        valid = false;
        break;
      }
    }
  }
  currentFoodFrames = random(foodImages); // 選一組動畫圖
  foodFrameIndex = 0;
}

class Snake {
  constructor() {
    this.body = [];
    let startX = floor(cols / 2) * gridSize;
    let startY = max(1, floor(rows / 2)) * gridSize; // 不允許 y=0
    this.body[0] = createVector(startX, startY);
    this.body[1] = createVector(startX, startY + gridSize);
    this.body[2] = createVector(startX, startY + 2 * gridSize);
    
    this.xdir = 0;
    this.ydir = -1;
    this.growing = false;
    this.headFrameIndex = 0;
    this.score = 0;
    
    this.expandingIndex = -1;
    this.expandCountdown = 0;
  }

  setDir(x, y) {
    if (this.body.length > 1) {
      let nextX = this.body[0].x + x * gridSize;
      let nextY = this.body[0].y + y * gridSize;
      if (nextX === this.body[1].x && nextY === this.body[1].y) {
        return;
      }
    }
    this.xdir = x;
    this.ydir = y;
  }

  update() {
    let head = this.body[0].copy();
    head.x += this.xdir * gridSize;
    head.y += this.ydir * gridSize;
    this.body.unshift(head);
    this.headFrameIndex = (this.headFrameIndex + 1) % 4; // 0~3
    
    if (this.expandCountdown > 0) {
      this.expandCountdown--;
      if (this.expandCountdown === 0) {
        this.expandingIndex = -1;
      }
    }
    
    if (!this.growing) {
      this.body.pop(); // 只有沒吃到東西時才 pop()
    }
    this.growing = false;
  }

  grow() {
    this.growing = true;
    this.score++;
  }

  eat(pos) {
    let head = this.body[0];
    if (head.x === pos.x && head.y === pos.y) {
      eatSound.play();
      this.grow();
      
      this.expandingIndex = 1;
      this.expandCountdown = 2;
      return true;
    }
    return false;
  }

  dead() {
    let head = this.body[0];
    if (head.x < 0 || head.x >= width || head.y < gridSize  || head.y >= height) return true;
    for (let i = 1; i < this.body.length; i++) {
      let part = this.body[i];
      if (head.x === part.x && head.y === part.y) return true;
    }
    return false;
  }
  
  getDirection(dx, dy) {
    if (dx === gridSize) return 'left';
    if (dx === -gridSize) return 'right';
    if (dy === gridSize) return 'up';
    if (dy === -gridSize) return 'down';
  }

  getTurnKey(dx1, dy1, dx2, dy2) {
    // 比如從右來（dx1=-40），往上走（dy2=-40） => turn_ur
    if ((dx1 === -gridSize && dy2 === -gridSize) || (dy1 === -gridSize && dx2 === -gridSize)) return 'turn_ur';
    if ((dx1 === gridSize && dy2 === -gridSize) || (dy1 === -gridSize && dx2 === gridSize)) return 'turn_ul';
    if ((dx1 === -gridSize && dy2 === gridSize) || (dy1 === gridSize && dx2 === -gridSize)) return 'turn_dr';
    if ((dx1 === gridSize && dy2 === gridSize) || (dy1 === gridSize && dx2 === gridSize)) return 'turn_dl';
    return 'horizontal'; // fallback
  }

  show() {
    for (let i = 0; i < this.body.length; i++) {
      let current = this.body[i];

      if (i === 0) {
        // 頭
        let next = this.body[1];
        let dx = next.x - current.x;
        let dy = next.y - current.y;
  
        let dir = "";
        if (dx === gridSize) dir = "left";
        else if (dx === -gridSize) dir = "right";
        else if (dy === gridSize) dir = (next.x < current.x) ? "up_l" : "up_r";
        else if (dy === -gridSize) dir = (next.x < current.x) ? "down_l" : "down_r";

        let img = headImgs[dir][this.headFrameIndex];
        image(img, current.x, current.y, gridSize, gridSize);
      } else if (i === this.body.length - 1) {
        // 尾
        let prev = this.body[i - 1];
        let dx = current.x - prev.x;
        let dy = current.y - prev.y;
        let dir = this.getDirection(dx, dy);
        image(tailImgs[dir], current.x, current.y, gridSize, gridSize);
      } else {
        // 中間身體
        let prev = this.body[i - 1];
        let next = this.body[i + 1];
        // 修正：確保 next 存在
        if (!next) {
          // 若 next 不存在，fallback 為水平
          image(bodyImgs['horizontal'], current.x, current.y, gridSize, gridSize);
          return;
        }
        let dxPrev = current.x - prev.x;
        let dyPrev = current.y - prev.y;
        let dxNext = current.x - next.x;
        let dyNext = current.y - next.y;

        let isExpanding = (i === this.expandingIndex);

        if (dxPrev === dxNext) {
          let key = 'horizontal';
          let expandKey = 'body_h_expand';
          let img = isExpanding ? expandImgs[expandKey] : bodyImgs[key];
          image(img, current.x, current.y, gridSize, gridSize);
        } else if (dyPrev === dyNext) {
          let key = 'vertical';
          let expandKey = 'body_v_expand';
          let img = isExpanding ? expandImgs[expandKey] : bodyImgs[key];
          image(img, current.x, current.y, gridSize, gridSize);
        } else {
          let key = this.getTurnKey(dxPrev, dyPrev, dxNext, dyNext);
          let expandKey = 'body_' + key.split('_')[1] + '_expand'; // e.g. turn_ul -> body_ul_expand
          let img = isExpanding ? expandImgs[expandKey] : bodyImgs[key];
          image(img, current.x, current.y, gridSize, gridSize);
        }
      }
    }
  }
}