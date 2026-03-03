class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.queue = [];
        this.currentIndex = 0;
        this.isTyping = false;
        this.currentMessage = null;
        this.typewriterTimer = null;

        // --- PORTRAIT DICTIONARY (PLACEHOLDERS) ---
        // We use colors for now. Later, you will swap setFillStyle with setTexture 
        // to load your actual pixel art headshots based on these keys.
        this.portraits = {
            'blonde_guy': 0xffcc00,     // Yellowish
            'green_hoodie': 0x00ff00,   // Green
            'stijn_spacesuit': 0xaa00ff,// Purple
            'james_spacesuit': 0x00ffff,// Cyan
            'default': 0x4488ff         // Blue
        };

        // --- BUILD THE UI ---
        this.uiContainer = this.scene.add.container(0, 0).setDepth(1000);
        this.uiContainer.setVisible(false); // Hidden until called

        this.dialogBox = this.scene.add.rectangle(0, 0, 100, 100, 0xffffff);
        this.dialogBox.setOrigin(0, 0);
        this.dialogBox.setStrokeStyle(4, 0x000000);

        this.portrait = this.scene.add.rectangle(0, 0, 80, 80, this.portraits['default']);
        this.portrait.setOrigin(0, 0);
        this.portrait.setStrokeStyle(2, 0x000000);

        this.dialogText = this.scene.add.text(0, 0, "", {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#000000',
            fontStyle: 'bold'
        });

        this.uiContainer.add([this.dialogBox, this.portrait, this.dialogText]);

        // --- SETUP INPUT (SPACEBAR) ---
        // Using 'down' event so it only triggers once per press, not continuously
        this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spacebar.on('down', () => this.handleInput());
    }

    // Call this from your Scene's resize listener to keep it responsive
    resize(cam) {
        const boxHeight = cam.height * 0.15;
        const boxWidth = cam.width * 0.90;
        const marginX = (cam.width - boxWidth) / 2;
        const marginY = cam.height - boxHeight - (cam.height * 0.02);

        this.dialogBox.setPosition(marginX, marginY);
        this.dialogBox.setSize(boxWidth, boxHeight);

        const portraitSize = boxHeight * 0.75;
        const portraitX = marginX + (boxHeight * 0.125);
        const portraitY = marginY + (boxHeight * 0.125);
        this.portrait.setPosition(portraitX, portraitY);
        this.portrait.setSize(portraitSize, portraitSize);

        const textX = portraitX + portraitSize + 15;
        const textY = marginY + 15;
        this.dialogText.setPosition(textX, textY);

        // Dynamic word wrap
        this.dialogText.setWordWrapWidth(boxWidth - portraitSize - 40);

        const dynamicFontSize = Math.max(12, Math.min(24, cam.height * 0.025));
        this.dialogText.setFontSize(dynamicFontSize + 'px');
    }

    // --- CORE LOGIC ---
    startDialogue(messagesArray, onCompleteCallback = null) {
        this.queue = messagesArray;
        this.currentIndex = 0;
        this.onComplete = onCompleteCallback; // Store the callback
        this.uiContainer.setVisible(true);
        this.showNextMessage();
    }

    showNextMessage() {
        // If queue is empty, close the dialogue box
        if (this.currentIndex >= this.queue.length) {
            this.uiContainer.setVisible(false);
            if (this.onComplete) this.onComplete(); // Trigger callback when done
            return;
        }

        this.currentMessage = this.queue[this.currentIndex];
        this.currentIndex++;

        // Swap portrait based on character key
        const color = this.portraits[this.currentMessage.character] || this.portraits['default'];
        this.portrait.setFillStyle(color);

        // Reset text and typing state
        this.dialogText.setText("");
        this.isTyping = true;

        let charIndex = 0;
        const fullText = this.currentMessage.text;

        // Clear existing timer if any
        if (this.typewriterTimer) this.typewriterTimer.remove();

        // Start Typewriter Effect (30ms per letter)
        this.typewriterTimer = this.scene.time.addEvent({
            delay: 30,
            repeat: fullText.length - 1,
            callback: () => {
                this.dialogText.text += fullText[charIndex];
                charIndex++;
                if (charIndex === fullText.length) {
                    this.isTyping = false; // Done typing
                }
            }
        });
    }

    // --- INPUT HANDLING ---
    handleInput() {
        if (!this.uiContainer.visible) return; // Do nothing if box is hidden

        if (this.isTyping) {
            // STATE 1: Currently Typing -> Instantly reveal all text
            this.typewriterTimer.remove();
            this.dialogText.setText(this.currentMessage.text);
            this.isTyping = false;
        } else if (this.currentMessage.waitForSpacebar) {
            // STATE 2: Done Typing & in Office Mode -> Advance to next message
            this.showNextMessage();
        }
        // STATE 3: Done Typing but waitForSpacebar is FALSE (Space Mode) -> Do nothing.
    }

    // Public method to advance manually (Used for Space mode tasks)
    next() {
        if (this.uiContainer.visible && !this.isTyping && !this.currentMessage.waitForSpacebar) {
            this.showNextMessage();
        }
    }
}

class OfficeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OfficeScene' });
    }

    create() {
        // --- PLACEHOLDER BACKGROUND ---
        // A gray rectangle representing the Future Ready HQ office floor
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x4a4f5c).setOrigin(0, 0);

        // Initialize our reusable Dialogue Manager
        this.dialogue = new DialogueManager(this);
        this.scale.on('resize', () => this.dialogue.resize(this.cameras.main), this);
        this.dialogue.resize(this.cameras.main); // Initial sizing

        // --- START THE NARRATIVE FLOW ---
        this.startWelcomeSequence();
    }

    startWelcomeSequence() {
        // Queue the intro dialogue
        this.dialogue.startDialogue([
            {
                character: 'blonde_guy',
                text: "WELCOME TO FUTURE READY HQ! HERE WE ARE WORKING ON THE TECHNOLOGY OF THE FUTURE!",
                waitForSpacebar: true
            },
            {
                character: 'blonde_guy',
                text: "WE HAVE BEEN WAITING FOR YOU, OUR TEAM NEEDS YOUR HELP...",
                waitForSpacebar: true
            },
            {
                character: 'blonde_guy',
                text: "BUT FIRST WE NEED TO KNOW YOUR NAME OR HOW YOU WANT TO BE NAMED SO WE CAN EASILY CALL WHEN WE NEED YOU.",
                waitForSpacebar: true
            }
        ], () => {
            // This runs automatically when the player finishes the dialogue above
            this.showNameInputForm();
        });
    }

    showNameInputForm() {
        const inputScreen = document.getElementById('name-input-screen');
        const submitBtn = document.getElementById('submit-name-button');
        const inputField = document.getElementById('player-name-input');
        const errorMsg = document.getElementById('name-error-msg'); // Grab the new error element

        inputScreen.style.display = 'flex';
        inputField.focus();
        errorMsg.innerText = ""; // Clear any old errors

        this.dialogue.startDialogue([{
            character: 'blonde_guy',
            text: "YOU CAN TYPE YOUR NAME IN THE FIELD WE HAVE MADE!",
            waitForSpacebar: false
        }]);

        // --- 1. BASIC PROFANITY FILTER ---
        // You can expand this array with any specific words you want to block
        const badWords = ['badword1', 'swearword2', 'offensiveword3'];

        // --- 2. MOCK DATABASE CHECK ---
        // Simulates checking a server. We will replace this with your real database call later!
        const checkDatabaseForName = async (nameToCheck) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Mock list of names already "in the database"
                    const takenNames = ["STIJN", "JAMES", "ROBBIN", "AMISHA", "BRADLEY"];
                    if (takenNames.includes(nameToCheck)) {
                        resolve(false); // Name is taken
                    } else {
                        resolve(true);  // Name is available
                    }
                }, 600); // 600ms fake server delay
            });
        };

        // --- 3. THE SUBMISSION LOGIC ---
        // Notice the 'async' keyword so we can 'await' the database check
        const processSubmission = async () => {
            let playerName = inputField.value.trim().toUpperCase();

            // Validation A: Is it empty?
            if (playerName === "") {
                errorMsg.innerText = "Name cannot be empty!";
                return;
            }

            // Validation B: Profanity Check
            const containsBadWord = badWords.some(word => playerName.toLowerCase().includes(word.toLowerCase()));
            if (containsBadWord) {
                errorMsg.innerText = "Please choose a more appropriate name.";
                return;
            }

            // Validation C: Database Uniqueness Check
            submitBtn.innerText = "CHECKING..."; // Visual feedback for the player
            submitBtn.disabled = true;
            inputField.disabled = true;

            const isUnique = await checkDatabaseForName(playerName);

            if (!isUnique) {
                errorMsg.innerText = "That name is already taken!";
                // Reset the form so they can try again
                submitBtn.innerText = "submit";
                submitBtn.disabled = false;
                inputField.disabled = false;
                inputField.focus();
                return;
            }

            // If it passes all checks, proceed to the game!
            inputScreen.style.display = 'none';
            inputField.onkeydown = null;
            submitBtn.onclick = null;

            this.startRedAlertSequence(playerName);
        };

        submitBtn.onclick = processSubmission;

        inputField.onkeydown = (event) => {
            if (event.key === 'Enter' && !submitBtn.disabled) {
                event.preventDefault();
                processSubmission();
            }
        };
    }

    startRedAlertSequence(playerName) {
        // Visual Red Alert effect (pulse a red overlay)
        let alertOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0.3).setOrigin(0, 0);
        this.tweens.add({
            targets: alertOverlay,
            alpha: 0.1, duration: 500, yoyo: true, repeat: -1
        });

        // Queue the final office dialogue
        this.dialogue.startDialogue([
            {
                character: 'blonde_guy',
                text: "OH NO!! WE HAVE VERY BAD NEWS! ROGUE AI ROBOTS ARE ABOUT TO ATTACK THE EARTH!",
                waitForSpacebar: true
            },
            {
                character: 'blonde_guy',
                text: "IT'S GOOD THAT YOU HAVE ARRIVED, WE HAVE BUILD A SPACESHIP THAT NEEDS TESTING! QUICK, HOP IN AND SAVE US!!",
                waitForSpacebar: true
            }
        ], () => {
            // When dialogue finishes, transition to the Space Gameplay!
            this.scene.start('MainScene', { playerName: playerName });
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.playerSpeed = 300;
        this.lastFired = 0;
        this.fireRate = 250;
        this.score = 0; // NEW: Track the player's score
        this.health = 3; // NEW: Track the player's health
    }

    // NEW: Catch the data sent from the OfficeScene
    init(data) {
        // If a name was passed, save it. Otherwise, use a fallback.
        this.playerName = data.playerName || "ROBOTFIGHTER01";
    }

    create() {
        // --- GENERATE PLACEHOLDER GRAPHICS ---
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // Player Ship (Green Triangle)
        gfx.fillStyle(0x00ff00, 1);
        gfx.fillTriangle(16, 0, 0, 32, 32, 32);
        gfx.generateTexture('playerShip', 32, 32);
        gfx.clear();

        // Laser (Yellow Rectangle)
        gfx.fillStyle(0xffff00, 1);
        gfx.fillRect(0, 0, 4, 16);
        gfx.generateTexture('laser', 4, 16);
        gfx.clear();

        // Enemy Robot (Red Square)
        gfx.fillStyle(0xff0000, 1);
        gfx.fillRect(0, 0, 32, 32);
        gfx.generateTexture('enemyRobot', 32, 32);
        gfx.destroy(); // Destroy the graphics object when done making textures

        // 1. Setup Player 
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.height - 100;
        this.player = this.physics.add.sprite(centerX, startY, 'playerShip');
        this.player.setCollideWorldBounds(true);

        // 2. Setup Physics Groups
        this.lasers = this.physics.add.group({
            defaultKey: 'laser',
            maxSize: 30
        });

        this.enemies = this.physics.add.group(); // Group for Phase 1 robots

        // 3. Setup Collisions (Hit Detection)
        // When a laser overlaps an enemy, run the hitEnemy function
        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);

        // NEW: Detect when an enemy hits the player
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

        // 4. Setup Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.addPointer(2);

        // 5. Setup Enemy Spawner
        // This timer runs indefinitely, firing the spawnEnemy function every 1.5 seconds
        this.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // --- UI: TEXT BALLOON PLACEHOLDER ---
        // Create a container to hold our UI elements on top of the game (Depth 100)
        this.uiContainer = this.add.container(0, 0).setDepth(100);

        // --- UI: TOP BAR PLACEHOLDER ---
        // 1. Top Bar Background (Solid black for visibility)
        this.topBarBg = this.add.rectangle(0, 0, 100, 100, 0x000000);
        this.topBarBg.setOrigin(0, 0); // Top-left origin

        // 2. Player Name (Left)
        this.playerNameText = this.add.text(0, 0, this.playerName, {
            fontFamily: 'Courier, monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.playerNameText.setOrigin(0, 0.5); // Center text vertically

        // 3. Score (Center)
        this.scoreText = this.add.text(0, 0, "SCORE: 0000", {
            fontFamily: 'Courier, monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.scoreText.setOrigin(0.5, 0.5); // Center completely

        // 4. Health Hearts (Right) - Using 3 red squares as placeholders
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            let heart = this.add.rectangle(0, 0, 20, 20, 0xff0000);
            heart.setOrigin(1, 0.5); // Right aligned
            this.hearts.push(heart);
        }

        // Add all top bar elements to the main UI container
        this.uiContainer.add(this.topBarBg);
        this.uiContainer.add(this.playerNameText);
        this.uiContainer.add(this.scoreText);
        this.hearts.forEach(heart => this.uiContainer.add(heart));

        // 1. The white dialog box background
        this.dialogBox = this.add.rectangle(0, 0, 100, 100, 0xffffff);
        this.dialogBox.setOrigin(0, 0); // Top-left origin for easier positioning
        this.dialogBox.setStrokeStyle(4, 0x000000); // Black border

        // 2. The character portrait placeholder (a blue square)
        this.portrait = this.add.rectangle(0, 0, 80, 80, 0x4488ff);
        this.portrait.setOrigin(0, 0);
        this.portrait.setStrokeStyle(2, 0x000000);

        // 3. The placeholder text
        this.dialogText = this.add.text(0, 0, "QUICK, HOP IN AND SAVE US!!", {
            fontFamily: 'Courier, monospace', // Monospace mimics the retro pixel look
            fontSize: '16px',
            color: '#000000',
            fontStyle: 'bold'
        });

        // Add all pieces to the container
        this.uiContainer.add([this.dialogBox, this.portrait, this.dialogText]);

        // Call our custom resize function to position it perfectly on load
        this.resizeUI();

        // Tell Phaser to recalculate the UI position if the window resizes
        this.scale.on('resize', this.resizeUI, this);
    }

    update(time, delta) {
        this.player.setVelocity(0);
        let isMoving = false;
        let isShooting = false;

        // --- KEYBOARD CONTROLS ---
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
            isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(this.playerSpeed);
            isMoving = true;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.setVelocityY(-this.playerSpeed);
            isMoving = true;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.setVelocityY(this.playerSpeed);
            isMoving = true;
        }

        if (this.spacebar.isDown) {
            isShooting = true;
        }

        // --- TOUCH CONTROLS ---
        this.input.manager.pointers.forEach(pointer => {
            if (pointer.isDown) {
                if (pointer.x < this.cameras.main.width / 2) {
                    this.physics.moveTo(this.player, pointer.x, pointer.y, this.playerSpeed);
                    isMoving = true;
                }
                if (pointer.x >= this.cameras.main.width / 2) {
                    isShooting = true;
                }
            }
        });

        // --- MOVEMENT RESTRICTIONS (THE INVISIBLE BOUNDARIES) ---
        // 1. Calculate the limits based on the current canvas height
        const minY = this.cameras.main.height * 0.55; // Cannot go higher than the top 40% mark
        const maxY = this.cameras.main.height * 0.80; // Cannot go lower than the bottom 15% mark

        // 2. Clamp the player's vertical position
        if (this.player.y < minY) {
            this.player.y = minY;
        } else if (this.player.y > maxY) {
            this.player.y = maxY;
        }

        // --- SHOOTING ---
        if (isShooting && time > this.lastFired) {
            this.shootLaser();
            this.lastFired = time + this.fireRate;
        }

        // --- CLEANUP (Prevent memory leaks) ---
        // Destroy lasers that fly off the top
        this.lasers.children.iterate((laser) => {
            if (laser && laser.y < -10) {
                laser.destroy();
            }
        });

        // Destroy enemies that fly off the bottom
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.y > this.cameras.main.height + 32) {
                enemy.destroy();
            }
        });
    }

    shootLaser() {
        let laser = this.lasers.get(this.player.x, this.player.y - 20);
        if (laser) {
            laser.setActive(true);
            laser.setVisible(true);
            laser.body.setVelocityY(-500);
        }
    }

    spawnEnemy() {
        // Pick a random X coordinate between the left and right edges
        let randomX = Phaser.Math.Between(32, this.cameras.main.width - 32);

        // Create an enemy just above the top of the screen
        let enemy = this.enemies.create(randomX, -32, 'enemyRobot');

        if (enemy) {
            enemy.setVelocityY(100); // Move downwards slowly
        }
    }

    hitEnemy(laser, enemy) {
        // 1. Destroy the laser and the enemy
        laser.destroy();
        enemy.destroy();

        // 2. Add points to the score (let's say 100 points per Phase 1 robot)
        this.score += 100;

        // 3. Format the score so it always shows at least 4 digits (e.g., 0100, 1900)
        let formattedScore = this.score.toString().padStart(4, '0');

        // 4. Update the text on the screen
        this.scoreText.setText("SCORE: " + formattedScore);
    }

    hitPlayer(player, enemy) {
        // 1. Destroy the enemy that crashed into the ship
        enemy.destroy();

        // 2. Decrease the player's health
        this.health--;

        // 3. Update the UI by popping the last heart off the array and destroying it
        if (this.hearts.length > 0) {
            let lostHeart = this.hearts.pop();
            lostHeart.destroy();
        }

        // 4. Add some visual feedback (flash the player red briefly)
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            if (this.health > 0) {
                this.player.clearTint();
            }
        });

        // 5. Check if the player is out of health
        if (this.health <= 0) {
            this.physics.pause(); // Stop all movement
            this.player.setTint(0xff0000); // Keep the ship red

            // Turn the dialog text into a Game Over message
            this.dialogText.setText("CRITICAL FAILURE! REFRESH TO TRY AGAIN.");
        }
    }

    resizeUI() {
        const cam = this.cameras.main;

        // --- TOP BAR SIZING & POSITIONING ---
        // Set height to 6% of the screen height
        const topBarHeight = cam.height * 0.06;

        // Stretch the background across the entire top
        this.topBarBg.setPosition(0, 0);
        this.topBarBg.setSize(cam.width, topBarHeight);

        // Scale the font size dynamically so it fits nicely inside the bar
        const topFontSize = Math.max(12, Math.min(24, topBarHeight * 0.6));

        // Position Player Name (2% padding from the left edge)
        this.playerNameText.setFontSize(topFontSize + 'px');
        this.playerNameText.setPosition(cam.width * 0.02, topBarHeight / 2);

        // Position Score (Dead center)
        this.scoreText.setFontSize(topFontSize + 'px');
        this.scoreText.setPosition(cam.width / 2, topBarHeight / 2);

        // Position Health Hearts (Starting from the right edge, moving inwards)
        const heartSize = topBarHeight * 0.5; // Scale heart placeholder size
        const heartSpacing = heartSize * 1.5; // Add some gap between hearts
        let startX = cam.width - (cam.width * 0.02); // 2% padding from the right edge

        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setSize(heartSize, heartSize);
            // Draw them right-to-left
            this.hearts[i].setPosition(startX - (i * heartSpacing), topBarHeight / 2);
        }

        // Reserve the bottom 15% for the box, with a little padding
        const boxHeight = cam.height * 0.15;
        const boxWidth = cam.width * 0.90; // Span 90% of the screen width
        const marginX = (cam.width - boxWidth) / 2; // Center it horizontally
        const marginY = cam.height - boxHeight - (cam.height * 0.02); // Just above the bottom edge

        // Position the white background box
        this.dialogBox.setPosition(marginX, marginY);
        this.dialogBox.setSize(boxWidth, boxHeight);

        // Position the portrait (Left side of the box)
        const portraitSize = boxHeight * 0.75;
        const portraitX = marginX + (boxHeight * 0.125);
        const portraitY = marginY + (boxHeight * 0.125);
        this.portrait.setPosition(portraitX, portraitY);
        this.portrait.setSize(portraitSize, portraitSize);

        // Position the text (Right of the portrait)
        const textX = portraitX + portraitSize + 15;
        const textY = marginY + 15;
        this.dialogText.setPosition(textX, textY);

        // Ensure the text wraps so it doesn't spill out of the right side of the box
        this.dialogText.setWordWrapWidth(boxWidth - portraitSize - 40);

        // Dynamically scale the font size based on the screen height so it is always readable
        const dynamicFontSize = Math.max(12, Math.min(24, cam.height * 0.025));
        this.dialogText.setFontSize(dynamicFontSize + 'px');
    }
}

// --- GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [OfficeScene, MainScene]
};

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    const startScreen = document.getElementById('start-screen');

    playButton.addEventListener('click', () => {
        // 1. Hide the HTML overlay
        startScreen.style.display = 'none';

        // 2. Start the Phaser Game
        const game = new Phaser.Game(config);
    });
});