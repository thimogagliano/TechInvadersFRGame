class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // 1. Grab your HTML title screen elements
        const startScreen = document.getElementById('start-screen');
        const playButton = document.getElementById('play-button');

        // 2. Make sure the HTML screen is visible
        startScreen.style.display = 'flex';

        // 3. When the player clicks "PLAY GAME", hide the HTML and start the game!
        // (We use .onclick instead of addEventListener so it doesn't duplicate if they play twice)
        playButton.onclick = () => {
            startScreen.style.display = 'none';
            this.scene.start('OfficeScene');
        };
    }
}

class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.queue = [];
        this.currentIndex = 0;
        this.isTyping = false;
        this.currentMessage = null;
        this.typewriterTimer = null;
        this.onComplete = null; // NEW: Stores what to do when dialogue finishes

        // --- PORTRAIT DICTIONARY ---
        this.portraits = {
            'blonde_guy': 0xffcc00,
            'blonde_guy_comms': 0xff9900, // NEW: Slightly darker/different color for the comms version
            'green_hoodie': 0x00ff00,
            'james_spacesuit': 0x00ffff,
            'stijn': 0xff55aa,
            'stijn_spacesuit': 0xaa00ff,
            'default': 0x4488ff
        };

        // --- BUILD THE UI ---
        this.uiContainer = this.scene.add.container(0, 0).setDepth(1000);
        this.uiContainer.setVisible(false);

        this.dialogBox = this.scene.add.rectangle(0, 0, 100, 100, 0xffffff);
        this.dialogBox.setOrigin(0, 0);
        this.dialogBox.setStrokeStyle(4, 0x000000);

        this.portrait = this.scene.add.rectangle(0, 0, 80, 80, this.portraits['default']);
        // NEW: The secondary character portrait (Right)
        this.portraitSecondary = this.scene.add.rectangle(0, 0, 80, 80, 0x4488ff).setOrigin(0, 0).setStrokeStyle(2, 0x000000);
        this.portraitSecondary.setVisible(false); // Hidden by default!
        this.portrait.setOrigin(0, 0);
        this.portrait.setStrokeStyle(2, 0x000000);

        this.dialogText = this.scene.add.text(0, 0, "", {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#000000',
            fontStyle: 'bold'
        });

        // Make sure to add it to your UI container so it renders on top!
        this.uiContainer.add([this.dialogBox, this.portrait, this.portraitSecondary, this.dialogText]);

        // --- SETUP INPUT (SPACEBAR) ---
        this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spacebar.on('down', () => this.handleInput());
    }

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

        // NEW: Position the secondary portrait (Right side of the box)
        const rightPortraitX = marginX + boxWidth - portraitSize - (boxHeight * 0.125);
        this.portraitSecondary.setPosition(rightPortraitX, portraitY);
        this.portraitSecondary.setSize(portraitSize, portraitSize);

        const textX = portraitX + portraitSize + 15;
        const textY = marginY + 15;
        this.dialogText.setPosition(textX, textY);

        this.dialogText.setWordWrapWidth(boxWidth - portraitSize - 40);

        const dynamicFontSize = Math.max(12, Math.min(24, cam.height * 0.025));
        this.dialogText.setFontSize(dynamicFontSize + 'px');
    }

    // --- CORE LOGIC (Now accepts the onComplete callback!) ---
    startDialogue(messages, onComplete) {
        // THE ULTIMATE FIX: If we forgot the [ ] array brackets, automatically wrap it in an array!
        if (!Array.isArray(messages)) {
            messages = [messages];
        }

        this.queue = messages;
        this.currentIndex = 0;
        this.onComplete = onComplete;
        this.uiContainer.setVisible(true);
        this.isTyping = false; // Reset typing flag

        this.showNextMessage();
    }

    showNextMessage() {
        // 1. End of queue check: Close the box safely
        if (!this.queue || this.currentIndex >= this.queue.length) {
            this.uiContainer.setVisible(false);
            this.currentMessage = null;

            if (this.onComplete) {
                const safeCallback = this.onComplete;
                this.onComplete = null;
                safeCallback();
            }
            return;
        }

        // 2. Grab the message
        let message = this.queue[this.currentIndex];

        // 3. Failsafe: If the array had a weird empty slot, skip it and move on
        if (!message) {
            this.currentIndex++;
            return this.showNextMessage();
        }

        this.currentMessage = message;

        // 4. Portrait 1 (Left)
        if (this.portraits[message.character]) {
            this.portrait.setFillStyle(this.portraits[message.character]);
        }

        // 5. Portrait 2 (Right) & Word Wrap
        if (message.character2) {
            if (this.portraits[message.character2]) {
                this.portraitSecondary.setFillStyle(this.portraits[message.character2]);
            }
            this.portraitSecondary.setVisible(true);
            let doubleWrapWidth = this.dialogBox.width - (this.portrait.width * 2) - 60;
            this.dialogText.setWordWrapWidth(doubleWrapWidth);
        } else {
            this.portraitSecondary.setVisible(false);
            let singleWrapWidth = this.dialogBox.width - this.portrait.width - 40;
            this.dialogText.setWordWrapWidth(singleWrapWidth);
        }

        // 6. Reset text and start Typewriter Effect
        this.dialogText.setText('');
        this.isTyping = true;
        let charIndex = 0;

        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
        }

        this.typewriterTimer = this.scene.time.addEvent({
            delay: 30, // Typing speed
            callback: () => {
                this.dialogText.text += message.text[charIndex];
                charIndex++;
                if (charIndex >= message.text.length) {
                    this.isTyping = false;
                    this.typewriterTimer.remove();
                }
            },
            callbackScope: this,
            repeat: message.text.length - 1
        });

        // 7. VERY IMPORTANT: Advance the index AFTER everything is set up
        this.currentIndex++;
    }

    // --- INPUT HANDLING ---
    handleInput() {
        // 1. Ignore if box is hidden
        if (!this.uiContainer.visible) return;

        // 2. Ignore if there is no current message loaded
        if (!this.currentMessage) return;

        // 3. Ignore if this message doesn't need spacebar (combat comms)
        if (!this.currentMessage.waitForSpacebar) return;

        // 4. Ignore if it is currently typing out the letters
        if (this.isTyping) return;

        // 5. Safe to proceed to the next message!
        this.showNextMessage();
    }

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

    // TODO: When you have your real images, uncomment this block to load them:
    /*
    preload() {
        this.load.image('office_normal', 'assets/office_normal.png');
        this.load.image('office_red', 'assets/office_red.png');
    }
    */

    create() {
        // --- PLACEHOLDER GENERATOR (Remove when using real images) ---
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0x4a4f5c, 1).fillRect(0, 0, 800, 600).generateTexture('office_normal', 800, 600);
        gfx.fillStyle(0x880000, 1).fillRect(0, 0, 800, 600).generateTexture('office_red', 800, 600);
        gfx.destroy();

        // 1. Setup the Normal Office Background
        this.bgNormal = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'office_normal').setDepth(-2);

        // 2. Setup the Red Alert Background (Hidden initially)
        this.bgRed = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'office_red').setDepth(-1);
        this.bgRed.setVisible(false);

        // Scale both to perfectly cover the screen
        this.scaleBackgroundToCover(this.bgNormal);
        this.scaleBackgroundToCover(this.bgRed);

        // Handle resizing dynamically
        this.scale.on('resize', () => {
            this.scaleBackgroundToCover(this.bgNormal);
            this.scaleBackgroundToCover(this.bgRed);
            if (this.dialogue) this.dialogue.resize(this.cameras.main);
        }, this);

        // Initialize Dialogue
        this.dialogue = new DialogueManager(this);
        this.dialogue.resize(this.cameras.main);

        this.startWelcomeSequence();

        // Clean up the global resize listener when this scene shuts down!
        this.events.once('shutdown', () => {
            this.scale.removeAllListeners('resize');
        });
    }

    // --- REUSABLE HELPER ---
    scaleBackgroundToCover(bgImage, paddingMultiplier = 1.0) {
        // NEW: Stop immediately if the image was destroyed by a scene change!
        if (!bgImage || !bgImage.active) return;

        const scaleX = this.cameras.main.width / bgImage.width;
        const scaleY = this.cameras.main.height / bgImage.height;
        const maxScale = Math.max(scaleX, scaleY) * paddingMultiplier;

        bgImage.setScale(maxScale);
        bgImage.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
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

        // --- NEW: HARD RESET FOR "PLAY AGAIN" ---
        // This guarantees the HTML form is completely wiped clean every time it opens!
        inputField.value = "";           // Clear the old name
        inputField.disabled = false;     // Re-enable typing
        submitBtn.disabled = false;      // Re-enable the button
        submitBtn.innerText = "SUBMIT";  // Change it back from "CHECKING..."
        errorMsg.innerText = "";         // Clear any old errors
        inputScreen.style.display = 'flex';
        inputField.focus();

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
                    const takenNames = [];
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
        // --- THE STROBE EFFECT ---
        const strobeEffect = () => {
            // Only toggle if we are still in this scene
            if (!this.scene.isActive('OfficeScene')) return;

            this.bgRed.setVisible(!this.bgRed.visible);
            this.time.delayedCall(800, strobeEffect);
        };
        strobeEffect(); // Start the flashing

        this.dialogue.startDialogue([
            { character: 'blonde_guy', text: "OH NO!! WE HAVE VERY BAD NEWS! ROGUE AI ROBOTS ARE ABOUT TO ATTACK THE EARTH!", waitForSpacebar: true },
            { character: 'blonde_guy', text: "IT'S GOOD THAT YOU HAVE ARRIVED, WE HAVE BUILD A SPACESHIP THAT NEEDS TESTING! QUICK, HOP IN AND SAVE US!!", waitForSpacebar: true }
        ], () => {
            // DIAGNOSTIC TOOL: Print all available scenes to the console
            console.log("Phaser loaded these scenes:", this.scene.manager.keys);

            // Transition
            this.scene.start('MainScene', { playerName: playerName });
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // NEW: Catch the data sent from the OfficeScene
    init(data) {
        // If a name was passed, save it. Otherwise, use a fallback.
        this.playerName = data.playerName || "ROBOTFIGHTER01";

        this.playerSpeed = 300;
        this.lastFired = 0;
        this.fireRate = 250;
        this.score = 0; // NEW: Track the player's score
        this.health = 3; // NEW: Track the player's health

        this.tutorialState = 'movement'; // Tracks: 'movement', 'shooting', 'done'
        this.keysPressed = { W: false, A: false, S: false, D: false };

        // NEW: Phase Manager Variables
        this.currentPhase = 1;
        this.enemiesDefeated = 0;
        this.gameplayStartTime = 0;

        // NEW: Firewall Variables
        this.hasFirewall = false;
        this.firewallHits = 0;

        // NEW: Virus and Antivirus Variables
        this.controlsReversed = false;
        this.hasAntivirus = false;
        this.firewallGivenTime = 0;
        this.virusGivenTime = 0;

        // NEW: Ad Pop-up Variables
        this.antivirusGivenTime = 0;
        this.adsGivenTime = 0;
        this.adsArray = []; // Stores the ad images so we can delete them later

        // NEW: Final Boss Variables
        this.bossActive = false;
        this.bossMaxHealth = 50; // Takes 1000 hits to defeat!
        this.bossHealth = 50;
        this.bossShootTimer = null;

        // Phase 2 Boss Variables
        this.phase2Triggered = false;
        this.bossShielded = false;
        this.hasDoubleLaser = false;
    }

    // TODO: When you have your real space background, uncomment this:
    /*
    preload() {
        this.load.image('space_bg', 'assets/space_background.png');
    }
    */

    create() {
        // --- 1. RESET KEYBOARD AND BROWSER FOCUS ---
        this.input.keyboard.enabled = true; // Turn the dashboard back on after a victory!
        window.focus(); // Force the browser to pay attention to the game canvas!

        // --- BOMB-PROOF PARALLAX BACKGROUND ---
        // Create a massive container (3000x3000) so it never shows edges when shifting
        this.spaceBg = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(-10);

        // 1. Add the dark blue space void
        let darkSpace = this.add.rectangle(0, 0, 3000, 3000, 0x0a0a2a);
        this.spaceBg.add(darkSpace);

        // 2. Add 150 randomly placed white stars into the container
        for (let i = 0; i < 150; i++) {
            let starX = Phaser.Math.Between(-1500, 1500);
            let starY = Phaser.Math.Between(-1500, 1500);
            let star = this.add.rectangle(starX, starY, 2, 2, 0xffffff);
            this.spaceBg.add(star);
        }

        // // Handle resizing dynamically
        // this.scale.on('resize', () => {
        //     this.scaleBackgroundToCover(this.spaceBg, 1.1);
        // }, this);

        // NEW LINE: Create the graphics tool so we can draw the placeholders!
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // NEW: Cutscene placeholders (Dark gray and lighter gray)
        gfx.fillStyle(0x333333, 1).fillRect(0, 0, 800, 600).generateTexture('cutscene_1', 800, 600);
        gfx.fillStyle(0x555555, 1).fillRect(0, 0, 800, 600).generateTexture('cutscene_2', 800, 600);

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
        gfx.clear(); // CHANGED: Changed from destroy() to clear() so we can keep drawing!

        // NEW: Antivirus Rounded Square (Green Transparent)
        gfx.fillStyle(0x00ff00, 0.3); // 30% opacity green
        gfx.fillRoundedRect(0, 0, 44, 44, 8); // 8px rounded corners
        gfx.lineStyle(2, 0x00ff00, 1); // Solid green border
        gfx.strokeRoundedRect(0, 0, 44, 44, 8);
        gfx.generateTexture('antivirus_aura', 44, 44);
        gfx.clear();

        // NEW: Little Shield Icon (White)
        gfx.fillStyle(0xffffff, 1);
        gfx.beginPath();
        gfx.moveTo(0, 0);    // Top left
        gfx.lineTo(12, 0);   // Top right
        gfx.lineTo(12, 6);   // Middle right
        gfx.lineTo(6, 14);   // Bottom point
        gfx.lineTo(0, 6);    // Middle left
        gfx.closePath();
        gfx.fillPath();
        gfx.generateTexture('shield_icon', 12, 14);

        // 6. Ad Pop-up (A white box with a red header to look like a window)
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRect(0, 0, 200, 150); // Main white body
        gfx.fillStyle(0xff0000, 1);
        gfx.fillRect(0, 0, 200, 25);  // Red header bar
        gfx.lineStyle(2, 0x000000, 1);
        gfx.strokeRect(0, 0, 200, 150); // Black border
        gfx.generateTexture('ad_popup', 200, 150);
        gfx.clear();

        // 7. Adblocker Icon (Red rounded square with a diagonal white stripe)
        gfx.fillStyle(0xff0000, 1);
        gfx.fillRoundedRect(0, 0, 40, 40, 8);
        gfx.lineStyle(4, 0xffffff, 1);
        gfx.beginPath();
        gfx.moveTo(8, 8);    // Top left of stripe
        gfx.lineTo(32, 32);  // Bottom right of stripe
        gfx.strokePath();
        gfx.generateTexture('adblocker_icon', 40, 40);

        // 8. Boss Placeholder (Massive Red/Purple Ship)
        gfx.fillStyle(0x880044, 1);
        gfx.fillRect(0, 0, 200, 150); // Big rectangular block
        gfx.fillStyle(0xffaa00, 1);
        gfx.fillCircle(100, 75, 40); // Yellow core in the middle
        gfx.generateTexture('boss_placeholder', 200, 150);
        gfx.clear();

        // 9. Boss Laser (Orange/Red oval)
        gfx.fillStyle(0xff5500, 1);
        gfx.fillRoundedRect(0, 0, 8, 24, 4);
        gfx.generateTexture('boss_laser', 8, 24);

        // 10. Upgraded Player Ship (Slightly larger, cyan accents)
        gfx.fillStyle(0x00ffaa, 1);
        gfx.fillTriangle(20, 0, 0, 40, 40, 40);
        gfx.generateTexture('playerShipUpgraded', 40, 40);
        gfx.clear();

        // 11. Helper Ship Blue (James)
        gfx.fillStyle(0x0088ff, 1);
        gfx.fillTriangle(16, 0, 0, 32, 32, 32);
        gfx.generateTexture('helperBlue', 32, 32);
        gfx.clear();

        // 12. Helper Ship Purple (Stijn)
        gfx.fillStyle(0xaa00ff, 1);
        gfx.fillTriangle(16, 0, 0, 32, 32, 32);
        gfx.generateTexture('helperPurple', 32, 32);

        // 13. Boss Explosion Frame 1 (Cracked)
        gfx.fillStyle(0x880044, 1);
        gfx.fillRect(0, 0, 200, 150);
        gfx.fillStyle(0x000000, 1);
        gfx.fillRect(80, 0, 10, 150); // Vertical crack
        gfx.fillRect(0, 70, 200, 10); // Horizontal crack
        gfx.generateTexture('boss_explode_1', 200, 150);
        gfx.clear();

        // 14. Boss Explosion Frame 2 (Broken into chunks)
        gfx.fillStyle(0x880044, 1);
        gfx.fillRect(0, 0, 80, 70); // Top left chunk
        gfx.fillRect(100, 80, 100, 70); // Bottom right chunk
        gfx.fillStyle(0xffaa00, 1);
        gfx.fillCircle(100, 75, 20); // Exposed core shrinking
        gfx.generateTexture('boss_explode_2', 200, 150);
        gfx.clear();

        // 15. Boss Explosion Frame 3 (Flash and smoke)
        gfx.fillStyle(0xffaaaa, 1);
        gfx.fillCircle(100, 75, 80);
        gfx.fillStyle(0xff4400, 1);
        gfx.fillCircle(100, 75, 50);
        gfx.generateTexture('boss_explode_3', 200, 150);

        // Destroy when completely done
        gfx.destroy();

        // Destroy when completely done
        gfx.destroy();

        // NEW: Turn those frames into a playable animation safely!
        if (!this.anims.exists('boss_destruction')) {
            this.anims.create({
                key: 'boss_destruction',
                frames: [
                    { key: 'boss_placeholder' },
                    { key: 'boss_explode_1' },
                    { key: 'boss_explode_2' },
                    { key: 'boss_explode_3' }
                ],
                frameRate: 2,
                repeat: 0
            });
        }

        // --- CUTSCENE OVERLAY ---
        // Sits at depth 90 (hiding the gameplay, but behind the depth 100 UI)
        this.cutsceneBg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'cutscene_1').setDepth(90);
        this.cutsceneBg.setVisible(false);

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

        this.bossLasers = this.physics.add.group({ defaultKey: 'boss_laser', maxSize: 50 });

        // 3. Setup Collisions (Hit Detection)
        // When a laser overlaps an enemy, run the hitEnemy function
        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);

        // NEW: Detect when an enemy hits the player
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

        // NEW: Boss Collisions (We will add the actual Boss vs Laser overlap inside spawnBoss)
        this.physics.add.overlap(this.player, this.bossLasers, this.hitPlayerByBoss, null, this);

        // 4. Setup Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.addPointer(2);

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


        // Call our custom resize function to position it perfectly on load
        this.resizeUI();

        // Tell Phaser to recalculate the UI position if the window resizes
        this.scale.on('resize', this.resizeUI, this);

        this.startTutorial();

        // --- ADD THIS RIGHT BEFORE THE END OF CREATE ---
        // Clean up the global resize listener when this scene shuts down!
        this.events.once('shutdown', () => {
            this.scale.removeAllListeners('resize');
        });
    }

    // --- REUSABLE HELPER ---
    scaleBackgroundToCover(bgImage, paddingMultiplier = 1.0) {
        // NEW: Stop immediately if the image was destroyed by a scene change!
        if (!bgImage || !bgImage.active) return;

        const scaleX = this.cameras.main.width / bgImage.width;
        const scaleY = this.cameras.main.height / bgImage.height;
        const maxScale = Math.max(scaleX, scaleY) * paddingMultiplier;

        bgImage.setScale(maxScale);
        bgImage.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
    }

    shootLaser() {
        if (this.hasDoubleLaser) {
            // DOUBLE CANNONS: Spawn two lasers slightly offset from the center
            let laser1 = this.lasers.get(this.player.x - 12, this.player.y - 20);
            let laser2 = this.lasers.get(this.player.x + 12, this.player.y - 20);

            if (laser1) { laser1.setActive(true).setVisible(true).body.setVelocityY(-600); }
            if (laser2) { laser2.setActive(true).setVisible(true).body.setVelocityY(-600); }
        } else {
            // STANDARD CANNON
            let laser = this.lasers.get(this.player.x, this.player.y - 20);
            if (laser) {
                laser.setActive(true).setVisible(true).body.setVelocityY(-500);
            }
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

        this.enemiesDefeated++; // NEW: Track the kill count!

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

        // --- FIREWALL ABSORPTION LOGIC ---
        if (this.hasFirewall) {
            this.firewallHits++;

            if (this.firewallHits === 1) {
                // First Hit: Flash the firewall white to show it absorbed the impact
                this.firewallVisual.setFillStyle(0xffffff, 0.6);
                this.time.delayedCall(150, () => this.firewallVisual.setFillStyle(0x0088ff, 0.3));
                return; // EXIT EARLY! Do not take a heart away!
            } else {
                // Second Hit: Reset the counter and let the code below take a heart
                this.firewallHits = 0;
            }
        }

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

        // NEW: Force the physics world to resize so the ship doesn't hit an invisible wall!
        this.physics.world.setBounds(0, 0, cam.width, cam.height);

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

        // Initialize the reusable Dialogue Manager for space!
        this.dialogue = new DialogueManager(this);
        this.scale.on('resize', () => this.dialogue.resize(this.cameras.main), this);
        this.dialogue.resize(this.cameras.main);
    }

    startTutorial() {
        // 1. Draw the floating keys on the screen
        this.createTutorialUI();

        // 2. Trigger the first instruction
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "CAN YOU HEAR ME? GOOD! LET'S TEST THE THRUSTERS. USE W, A, S, D OR THE ARROW KEYS TO MOVE AROUND!",
            waitForSpacebar: false // False means it stays on screen until we manually advance it!
        }]);
    }

    createTutorialUI() {
        // Create a container for the floating keys in the center-top of the screen
        this.tutorialUI = this.add.container(this.cameras.main.centerX, this.cameras.main.height * 0.3).setDepth(50);

        const keyStyle = { fontFamily: 'Courier, monospace', fontSize: '24px', color: '#000000', fontStyle: 'bold' };

        // Helper function to draw a single key
        const createKey = (x, y, label) => {
            let bg = this.add.rectangle(x, y, 50, 50, 0xffffff).setStrokeStyle(4, 0x000000);
            let text = this.add.text(x, y, label, keyStyle).setOrigin(0.5);
            this.tutorialUI.add([bg, text]);
            return bg; // Return the background so we can tint it green later
        };

        // Draw W, A, S, D in a cross formation
        this.visualKeys = {
            W: createKey(0, -60, 'W'),
            A: createKey(-60, 0, 'A'),
            S: createKey(0, 0, 'S'),
            D: createKey(60, 0, 'D'),
            SPACE: createKey(0, 80, 'SPACE')
        };

        // Make SPACE bar wider
        this.visualKeys.SPACE.setSize(170, 50);

        // Hide SPACE initially
        this.visualKeys.SPACE.setVisible(false);
        this.tutorialUI.getAt(9).setVisible(false); // Hides the "SPACE" text
    }

    startCutscene() {
        // 1. Show the first cutscene background
        this.cutsceneBg.setTexture('cutscene_1');
        this.scaleBackgroundToCover(this.cutsceneBg);
        this.cutsceneBg.setVisible(true);

        // 2. Play the first part of the cutscene
        this.dialogue.startDialogue([{
            character: 'blonde_guy',
            text: "FANTASTIC! EVERYTHING WORKS AND PHASE 1 IS COMPLETED. WE HAVE BUILT THE SPACESHIP AND LAUNCHED IT SUCCESSFULLY!",
            waitForSpacebar: true
        }], () => {

            // 3. This runs when they press spacebar on the first text. 
            // Swap to the second background!
            this.cutsceneBg.setTexture('cutscene_2');

            // Trigger the second part of the dialogue
            this.dialogue.startDialogue([{
                character: 'blonde_guy',
                text: "WE ARE DETECTING INCOMING ROGUE AI ROBOTS. PREPARE FOR COMBAT!", // Note: Replace this with your actual Phase 2 text!
                waitForSpacebar: true
            }], () => {

                // 4. This runs when they press spacebar on the final text.
                // Hide the cutscene, reveal space, and start the game!
                this.cutsceneBg.setVisible(false);
                this.startGameplay();

            });
        });
    }

    startGameplay() {
        this.gameplayStartTime = this.time.now; // NEW: Record start time

        // Start the enemy spawner timer that we removed from create()
        this.spawnerTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Give a final Good Luck message that the player can dismiss
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "SYSTEMS ARE GREEN! HERE COME THE ROGUE ROBOTS. PROTECT EARTH!!",
            waitForSpacebar: true
        }]);

        // 3. Auto-close the text balloon after 8 seconds so it clears their screen
        this.time.delayedCall(8000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                this.dialogue.next();
            }
        });
    }

    triggerAICloning() {
        this.currentPhase = 2; // Move to Phase 2

        // 1. Double the spawn rate (Decrease the delay from 1500ms to 600ms)
        if (this.spawnerTimer) this.spawnerTimer.remove();

        this.spawnerTimer = this.time.addEvent({
            delay: 600, // Much faster spawning!
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // 2. Start a 10-second survival timer to deliver the Firewall
        this.time.delayedCall(10000, () => {
            this.triggerFirewall();
        });
    }

    triggerFirewall() {
        this.currentPhase = 3; // Move to Phase 3
        this.hasFirewall = true;
        this.firewallHits = 0; // Reset hit counter

        // NEW: Start the 20-second clock for the Virus!
        this.firewallGivenTime = this.time.now;

        // 1. Draw the transparent blue firewall circle
        this.firewallVisual = this.add.circle(this.player.x, this.player.y, 35, 0x0088ff, 0.3);
        this.firewallVisual.setStrokeStyle(2, 0x00ffff); // Glowing cyan border
        this.firewallVisual.setDepth(10); // Keep it just above the player

        // 2. Show the Green Hoodie Guy dialogue
        this.dialogue.startDialogue([{
            character: 'green_hoodie', // Matches your DialogueManager portrait key
            text: "WE HAVE DEVELOPED A FIREWALL FOR YOU TO HELP WITH THE DAMAGE FROM THE ROBOTS!",
            waitForSpacebar: false // False so they don't have to stop playing to read it
        }]);

        // 3. Auto-close the text balloon after 10 seconds so it clears their screen
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'green_hoodie') {
                this.dialogue.next();
            }
        });
    }

    triggerVirus(currentTime) {
        this.currentPhase = 4; // Move to Phase 4
        this.virusGivenTime = currentTime; // Start the 10-second survival clock
        this.controlsReversed = true; // Flip the controls!

        // Give the player a visual cue that something is wrong (glitch color)
        this.player.setTint(0xaa00ff);
        this.time.delayedCall(500, () => this.player.clearTint());

        // NEW: Trigger Stijn's warning dialogue!
        this.dialogue.startDialogue([{
            character: 'stijn',
            text: "WE HAVE JUST NOTICED THAT THE ROGUE AI ROBOTS HAVE DEVELOPED A COMPUTER VIRUS THAT REVERSES YOUR CONTROLS!",
            waitForSpacebar: false // False so they can keep trying to fly!
        }]);

        // Auto-close the text balloon after 10 seconds
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'stijn') {
                this.dialogue.next(); // Dismiss the balloon
            }
        });
    }

    triggerAntivirus() {
        this.currentPhase = 5; // Move to Phase 5
        this.controlsReversed = false; // Fix the controls!
        this.hasAntivirus = true;

        // NEW: Record the time the Antivirus was given!
        this.antivirusGivenTime = this.time.now;

        // 1. Draw the Antivirus Visuals (Rounded square & Shield)
        this.antivirusVisual = this.add.image(this.player.x, this.player.y, 'antivirus_aura').setDepth(11);
        this.antivirusShield = this.add.image(this.player.x - 16, this.player.y - 16, 'shield_icon').setDepth(12);

        // 2. Show the Comms Dialogue
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "WE HAVE SENT YOU AN ANTIVIRUS UPDATE FOR THE SHIP!! THIS WILL TURN YOUR CONTROLS BACK TO NORMAL.",
            waitForSpacebar: false
        }]);

        // 3. Auto-close the text balloon after 6 seconds
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                this.dialogue.next();
            }
        });
    }

    triggerAds(currentTime) {
        this.currentPhase = 6; // Move to Phase 6
        this.adsGivenTime = currentTime; // Start the 10-second survival clock

        // 1. Spawn 3 ads spread out across the screen
        for (let i = 0; i < 3; i++) {
            // Pick random coordinates, keeping them somewhat away from the very edges
            let randomX = Phaser.Math.Between(150, this.cameras.main.width - 150);
            let randomY = Phaser.Math.Between(150, this.cameras.main.height - 200);

            // Set depth very high (95) so it blocks the player and enemies!
            let ad = this.add.image(randomX, randomY, 'ad_popup').setDepth(95);
            this.adsArray.push(ad);
        }

        // 2. Trigger Green Hoodie's Dialogue
        this.dialogue.startDialogue([{
            character: 'green_hoodie',
            text: "YOU WON'T BELIEVE IT BUT THEY HAVE DEVELOPED SOME ADS THAT CAN BLOCK YOUR VIEW... LIKE SERIOUSLY?...",
            waitForSpacebar: false
        }]);

        // Auto-close text after 10 seconds
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'green_hoodie') {
                this.dialogue.next();
            }
        });
    }

    triggerAdblocker() {
        this.currentPhase = 7; // Move to Phase 7

        // 1. Trigger Blonde Guy's Dialogue
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "WE HAVE DEVELOPED AN ADBLOCKER FOR YOUR SHIP, IT WILL MAKE QUICK WORK OF THESE ADS AND GET RID OF THEM.",
            waitForSpacebar: false
        }]);

        // Auto-close text after 10 seconds
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                this.dialogue.next();
            }
        });

        // 2. Wait exactly 2 seconds, then execute the Adblocker wipe!
        this.time.delayedCall(2000, () => {

            // Show the Adblocker shield pop up from the ship
            let blockerIcon = this.add.image(this.player.x, this.player.y - 40, 'adblocker_icon').setDepth(96);

            // Animate it floating up and fading out
            this.tweens.add({
                targets: blockerIcon,
                y: this.player.y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: () => blockerIcon.destroy()
            });

            // Destroy the ads one by one with a 1-second delay between each
            this.adsArray.forEach((ad, index) => {
                this.time.delayedCall(index * 1000, () => {
                    ad.destroy();
                });
            });

            // Clear the array
            this.adsArray = [];

            // NEW: Start the crazy final wave exactly as the ads clear!
            this.triggerFinalWave();
        });
    }

    triggerFinalWave() {
        this.currentPhase = 8; // Move to Phase 8 (The Final Push)

        // 1. Triple the spawn rate! (Drop delay from 600ms to a frantic 200ms)
        if (this.spawnerTimer) this.spawnerTimer.remove();
        this.spawnerTimer = this.time.addEvent({ delay: 200, callback: this.spawnEnemy, callbackScope: this, loop: true });

        // 2. Wait 2 seconds, then start slowing it down
        this.time.delayedCall(2000, () => {

            this.spawnerTimer.remove();
            this.spawnerTimer = this.time.addEvent({ delay: 600, callback: this.spawnEnemy, callbackScope: this, loop: true });

            // 3. Wait another 4 seconds, slow it down more (stragglers)
            this.time.delayedCall(4000, () => {
                this.spawnerTimer.remove();
                this.spawnerTimer = this.time.addEvent({ delay: 1500, callback: this.spawnEnemy, callbackScope: this, loop: true });

                // 4. Wait a final 4 seconds, then SHUT IT OFF COMPLETELY
                this.time.delayedCall(4000, () => {
                    this.spawnerTimer.remove(); // No more robots will spawn!

                    // 5. Wait 3 seconds for the remaining robots to fly off the bottom of the screen
                    this.time.delayedCall(4000, () => {
                        this.triggerBossTransition();
                    });
                });
            });
        });
    }

    triggerBossTransition() {
        this.currentPhase = 9; // Move to Phase 9 (The Calm Before the Storm)

        // 1. Trigger the False Victory dialogue
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "PHASE 2 IS NOW OVER! WE HAVE SUCCESSFULLY EVOLVED AGAINST THE ROBOTS AND DEFEATED THEM!",
            waitForSpacebar: false // Locks the text on screen
        }]);

        // 2. Wait exactly 5 seconds, then close the victory dialogue
        this.time.delayedCall(5000, () => {

            // Forcefully hide the dialogue balloon
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                this.dialogue.next();
            }

            // 3. Wait 3 seconds in absolute silence...
            this.time.delayedCall(3000, () => {

                // 4. Trigger Stijn's panic warning!
                this.dialogue.startDialogue([{
                    character: 'stijn',
                    text: "SOMETHING IS WRONG! A VERY BIG OBJECT SEEMS TO BE COMING YOUR WAY!!",
                    waitForSpacebar: false
                }]);

                // 5. Leave Stijn's warning on screen for 5 seconds to let the player read it, then close it
                this.time.delayedCall(5000, () => {

                    // Hide Stijn's dialogue balloon
                    if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'stijn') {
                        this.dialogue.next();
                    }

                    // 6. Wait 2 final seconds in silence, then spawn the nightmare.
                    this.time.delayedCall(2000, () => {
                        this.spawnBoss();
                    });

                });
            });
        });
    }

    spawnBoss() {
        this.currentPhase = 10; // The Final Phase

        const cam = this.cameras.main;

        // 1. Create the Boss off-screen (above the top)
        this.boss = this.physics.add.sprite(cam.centerX, -200, 'boss_placeholder').setDepth(5);
        this.boss.setImmovable(true); // So player lasers don't physically push it backwards

        // 2. Setup Boss Collision
        this.physics.add.overlap(this.lasers, this.boss, this.hitBoss, null, this);

        // 3. Create the Boss UI (Hidden initially)
        this.bossUIContainer = this.add.container(0, 0).setDepth(105).setAlpha(0);

        // Health Bar Background (Dark Gray)
        const barWidth = cam.width * 0.6;
        const barHeight = 20;
        const barX = cam.centerX - (barWidth / 2);
        const barY = cam.height * 0.08; // Just below the top bar

        this.bossBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333).setOrigin(0, 0).setStrokeStyle(2, 0x000000);

        // Health Bar Fill (Red)
        this.bossBarFill = this.add.rectangle(barX, barY, barWidth, barHeight, 0xff0000).setOrigin(0, 0);

        // Boss Name Text
        this.bossNameText = this.add.text(cam.centerX, barY + barHeight + 5, "Final Rogue AI Superboss XL", {
            fontFamily: 'Courier, monospace',
            fontSize: '18px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.bossUIContainer.add([this.bossBarBg, this.bossBarFill, this.bossNameText]);

        // 4. Animate the Boss sliding down
        this.tweens.add({
            targets: this.boss,
            y: cam.height * 0.25,
            duration: 4000,
            ease: 'Sine.easeOut',
            onComplete: () => {

                // 1. Fade in the terrifying health bar so they know what they are up against
                this.tweens.add({ targets: this.bossUIContainer, alpha: 1, duration: 1000 });

                // 2. Trigger the panicked dialogue!
                this.dialogue.startDialogue([{
                    character: 'blonde_guy_comms',
                    text: "WE DID NOT SEE THIS COMING!!... A FINAL ROGUE AI BOSS!! THIS IS GONNA BE A HARD FIGHT. TEAM FUTURE READY WILL BE ON THEIR WAY TO HELP YOU!",
                    waitForSpacebar: false
                }]);

                // 3. Wait exactly 6 seconds before the chaos begins
                this.time.delayedCall(6000, () => {

                    // Dismiss the dialogue balloon
                    if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                        this.dialogue.next();
                    }

                    // NOW the fight officially starts! 
                    // (The boss is vulnerable to damage and starts shooting)
                    this.bossActive = true;
                    this.startBossAttacks();

                });
            }
        });
    }

    startBossAttacks() {
        // Clear the old timer just in case we are restarting attacks for Phase 2
        if (this.bossShootTimer) this.bossShootTimer.remove();

        // Speed up the fire rate in Phase 2 (from 800ms down to 600ms)
        let currentDelay = this.phase2Triggered ? 600 : 800;

        this.bossShootTimer = this.time.addEvent({
            delay: currentDelay,
            callback: () => {
                if (!this.bossActive) return;

                if (this.phase2Triggered) {
                    // PHASE 2: Dual purple lasers that track faster!
                    let laser1 = this.bossLasers.get(this.boss.x - 40, this.boss.y + 50);
                    let laser2 = this.bossLasers.get(this.boss.x + 40, this.boss.y + 50);

                    if (laser1) {
                        laser1.setActive(true).setVisible(true).setTint(0xff00ff); // Magenta!
                        this.physics.moveToObject(laser1, this.player, 550); // 550 speed!
                    }
                    if (laser2) {
                        laser2.setActive(true).setVisible(true).setTint(0xff00ff);
                        this.physics.moveToObject(laser2, this.player, 550);
                    }
                } else {
                    // PHASE 1: Standard single orange laser
                    let laser = this.bossLasers.get(this.boss.x, this.boss.y + 75);
                    if (laser) {
                        laser.setActive(true).setVisible(true).clearTint();
                        this.physics.moveToObject(laser, this.player, 400); // 400 speed
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    hitBoss(object1, object2) {
        if (!this.bossActive) return;

        if (this.bossShielded) return; // NEW: Bullets do nothing to the shield!

        // 1. Fool-proof check: Figure out exactly which item is the laser and which is the boss
        let laser = (object1.texture && object1.texture.key === 'laser') ? object1 : object2;
        let boss = (object1.texture && object1.texture.key === 'boss_placeholder') ? object1 : object2;

        // Destroy the laser safely
        if (laser && laser.active) {
            laser.destroy();
        }

        this.bossHealth -= 1;

        // 2. Safe Visual Flash (Using Tint and Alpha instead of TintFill)
        boss.setTint(0xffaaaa); // Tint it slightly red/white
        boss.setAlpha(0.7);     // Make it slightly transparent

        this.time.delayedCall(50, () => {
            if (boss && boss.active) {
                boss.clearTint();
                boss.setAlpha(1);
            }
        });

        // 3. Update the Health Bar width
        const healthPercent = Math.max(0, this.bossHealth / this.bossMaxHealth);
        const barWidth = this.cameras.main.width * 0.6;
        this.bossBarFill.setSize(barWidth * healthPercent, 20);

        // NEW: Check for Phase 2 Trigger (90% Health)
        if (!this.phase2Triggered && this.bossHealth <= (this.bossMaxHealth * 0.90)) {
            this.triggerBossPhase2();
        }

        // 4. Defeat Check
        if (this.bossHealth <= 0) {
            this.bossActive = false; // Stops boss logic

            if (this.bossShootTimer) this.bossShootTimer.remove();
            if (this.helperShootTimer) this.helperShootTimer.remove(); // Stop helpers from shooting empty space

            this.tweens.killTweensOf(this.boss); // Stop the boss from sliding left/right
            this.bossUIContainer.setVisible(false); // Hide the health bar immediately

            this.triggerDefeatSequence(); // START THE FINALE!
        }
    }

    hitPlayerByBoss(player, bossLaser) {
        bossLaser.destroy();

        // We reuse the exact same hit logic you already built for robots!
        // To do this cleanly, we'll extract the health reduction into a helper, 
        // but for now, we can just copy your existing damage logic or call hitPlayer with a dummy enemy.
        this.hitPlayer(player, bossLaser);
    }

    triggerBossPhase2() {
        this.phase2Triggered = true;
        this.bossActive = false; // Boss stops shooting
        this.bossShielded = true; // Boss stops taking damage

        if (this.bossShootTimer) this.bossShootTimer.remove(); // Stop the lasers

        // 1. Draw a glowing cyan shield around the Boss
        this.bossShieldVisual = this.add.circle(this.boss.x, this.boss.y, 120, 0x00ffff, 0.2).setDepth(6);
        this.bossShieldVisual.setStrokeStyle(4, 0x00ffff, 0.8);

        // 2. Trigger the HQ Dialogue
        this.dialogue.startDialogue([{
            character: 'blonde_guy_comms',
            text: "STIJN AND JAMES HAVE COME TO HELP YOU WITH THEIR SPACESHIPS! IT'S TIME TO SCALE UP WITH THE UPGRADES THEY HAVE BROUGHT FOR YOUR SPACESHIP!",
            waitForSpacebar: false
        }]);

        // 3. Wait 12 seconds, clear dialogue, and bring in the helper ships!
        this.time.delayedCall(6000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'blonde_guy_comms') {
                this.dialogue.next();
            }

            // Spawn helpers at the bottom edge of the screen as Sprites
            const cam = this.cameras.main;
            let helperBlue = this.add.sprite(cam.width * 0.3, cam.height + 50, 'helperBlue').setDepth(9);
            let helperPurple = this.add.sprite(cam.width * 0.7, cam.height + 50, 'helperPurple').setDepth(9);

            // Store them so we can make them shoot later!
            this.helperShips = [helperBlue, helperPurple];

            // Animate them sliding up into the battlefield
            this.tweens.add({
                targets: this.helperShips,
                y: cam.height * 0.75,
                duration: 2500,
                ease: 'Sine.easeOut',
                onComplete: () => {

                    // NEW: Add a continuous hovering animation so they look alive!
                    this.tweens.add({
                        targets: this.helperShips,
                        x: '+=60', // Drift right by 60 pixels
                        duration: 2000,
                        yoyo: true, // Drift back left
                        repeat: -1, // Loop forever
                        ease: 'Sine.easeInOut'
                    });

                    // 4. Helper Ships arrive, trigger their dialogue
                    this.dialogue.startDialogue([{
                        character: 'stijn_spacesuit',
                        character2: 'james_spacesuit', // NEW: The second portrait!
                        text: "WE HAVE STRONGER CANNONS AND A MORE POWERFUL BOOSTER FOR YOUR SPACESHIP! AND OF COURSE ARE WE HERE TO HELP!",
                        waitForSpacebar: false
                    }]);

                    // 5. Wait 6 seconds, grant upgrades, and RESUME FIGHT!
                    this.time.delayedCall(5000, () => {
                        if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'stijn_spacesuit') {
                            this.dialogue.next();
                        }

                        // APPLY UPGRADES!
                        this.player.setTexture('playerShipUpgraded');
                        this.playerSpeed = 500;
                        this.hasDoubleLaser = true;

                        // DROP BOSS SHIELD
                        this.bossShieldVisual.destroy();
                        this.bossShielded = false;

                        // RESUME BOSS ATTACKS
                        this.bossActive = true;
                        this.startBossAttacks();

                        // UPGRADE: Make the boss slowly drift left and right!
                        this.tweens.add({
                            targets: this.boss,
                            x: this.cameras.main.centerX + 150, // Drift right by 150 pixels
                            duration: 2500, // Takes 2.5 seconds to drift one way
                            yoyo: true, // Drift back to the left
                            repeat: -1, // Loop forever
                            ease: 'Sine.easeInOut'
                        });

                        // NEW: START HELPER ATTACKS! (They shoot very slowly)
                        this.helperShootTimer = this.time.addEvent({
                            delay: 2500, // Shoots once every 2.5 seconds
                            callback: () => {
                                if (!this.bossActive || this.bossShielded) return;

                                this.helperShips.forEach(ship => {
                                    let laser = this.lasers.get(ship.x, ship.y - 20);
                                    if (laser) {
                                        laser.setActive(true).setVisible(true);
                                        laser.setTint(0x00ffff);

                                        // UPGRADE: Aim directly at the boss instead of just shooting straight up!
                                        this.physics.moveToObject(laser, this.boss, 400);
                                    }
                                });
                            },
                            callbackScope: this,
                            loop: true
                        });

                    });
                }
            });
        });
    }

    triggerDefeatSequence() {
        this.currentPhase = 99; // Set this early to disable player controls
        this.input.keyboard.enabled = false;

        // NEW: Auto-pilot the player into a perfect V-formation!
        const cam = this.cameras.main;
        this.tweens.add({
            targets: this.player,
            x: cam.centerX,
            y: cam.height * 0.75, // Align vertically with Stijn and James
            duration: 1500, // Drift smoothly into place over 1.5 seconds
            ease: 'Sine.easeInOut'
        });

        // 1. Play the breaking animation
        this.boss.play('boss_destruction');

        // 2. Wait for the animation to finish completely BEFORE fading
        this.boss.once('animationcomplete', () => {

            this.tweens.add({
                targets: this.boss,
                alpha: 0,
                duration: 1500, // Slowly fade out over 1.5 seconds
                onComplete: () => {
                    this.boss.destroy();

                    // 3. Trigger the dialogue
                    this.dialogue.startDialogue([{
                        character: 'stijn_spacesuit',
                        character2: 'james_spacesuit',
                        text: "YES!! YOU DID IT! THE FINAL ROGUE AI BOSS HAS BEEN DEFEATED, TIME FOR US TO HEAD BACK TO EARTH!",
                        waitForSpacebar: false
                    }]);

                    // 4. Wait EXACTLY 6 seconds
                    this.time.delayedCall(6000, () => {
                        // Hide the dialogue box!
                        this.dialogue.uiContainer.setVisible(false);
                        this.dialogue.currentMessage = null;

                        // Start the flyaway and iris out
                        this.triggerVictoryFlyaway();
                    });
                }
            });
        });
    }

    triggerVictoryFlyaway() {
        // FIX: Turn off world bounds so the ship can actually leave the screen!
        this.player.setCollideWorldBounds(false);

        // Fly all three ships upwards off the screen SLOWLY
        this.tweens.add({
            targets: [this.player, ...this.helperShips],
            y: -150,
            duration: 6000, // Slower! (Takes 6 seconds to fly away)
            ease: 'Sine.easeInOut'
        });

        // The "Iris Out" Shrinking Circle Transition
        const cam = this.cameras.main;
        let irisGraphics = this.add.graphics().setDepth(200);

        let maxRadius = Math.max(cam.width, cam.height);
        let irisObj = { r: maxRadius };

        this.tweens.add({
            targets: irisObj,
            r: 0,
            duration: 4000,
            // REMOVED THE DELAY HERE!
            onUpdate: () => {
                irisGraphics.clear();
                irisGraphics.lineStyle(3000, 0x000000, 1);
                irisGraphics.strokeCircle(cam.centerX, cam.centerY, irisObj.r + 1500);
            },
            onComplete: () => {
                let victoryText = this.add.text(cam.centerX, cam.centerY, "MISSION ACCOMPLISHED", {
                    fontFamily: 'Courier, monospace',
                    fontSize: '32px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(201);

                // Wait 3 seconds, then transition to the PartyScene!
                this.time.delayedCall(3000, () => {
                    this.scene.start('PartyScene', {
                        playerName: this.playerName,
                        score: this.score
                    });
                });
            }
        });
    }

    update(time, delta) {
        this.player.setVelocity(0);
        let isMoving = false;
        let isShooting = false;

        // --- KEYBOARD CONTROLS ---
        // If controls are reversed, multiply the speed by -1
        let currentSpeed = this.controlsReversed ? -this.playerSpeed : this.playerSpeed;

        // NEW: ONLY allow movement and touch controls if we are NOT in the Finale!
        if (this.currentPhase !== 99) {

            // --- KEYBOARD CONTROLS ---
            let currentSpeed = this.controlsReversed ? -this.playerSpeed : this.playerSpeed;

            if (this.cursors.left.isDown || this.wasd.A.isDown) {
                this.player.setVelocityX(-currentSpeed);
                isMoving = true;
            } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                this.player.setVelocityX(currentSpeed);
                isMoving = true;
            }

            if (this.cursors.up.isDown || this.wasd.W.isDown) {
                this.player.setVelocityY(-currentSpeed);
                isMoving = true;
            } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
                this.player.setVelocityY(currentSpeed);
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
        }

        // --- TUTORIAL PROGRESSION LOGIC ---
        if (this.tutorialState === 'movement') {
            // Check WASD *OR* Arrow Keys, and turn the corresponding UI box green
            if ((this.wasd.W.isDown || this.cursors.up.isDown) && !this.keysPressed.W) {
                this.keysPressed.W = true;
                this.visualKeys.W.setFillStyle(0x00ff00);
            }
            if ((this.wasd.A.isDown || this.cursors.left.isDown) && !this.keysPressed.A) {
                this.keysPressed.A = true;
                this.visualKeys.A.setFillStyle(0x00ff00);
            }
            if ((this.wasd.S.isDown || this.cursors.down.isDown) && !this.keysPressed.S) {
                this.keysPressed.S = true;
                this.visualKeys.S.setFillStyle(0x00ff00);
            }
            if ((this.wasd.D.isDown || this.cursors.right.isDown) && !this.keysPressed.D) {
                this.keysPressed.D = true;
                this.visualKeys.D.setFillStyle(0x00ff00);
            }

            // If all 4 directions are checked off, advance to the shooting phase!
            if (this.keysPressed.W && this.keysPressed.A && this.keysPressed.S && this.keysPressed.D) {
                this.tutorialState = 'shooting';

                this.visualKeys.SPACE.setVisible(true);
                this.tutorialUI.getAt(9).setVisible(true);

                this.dialogue.startDialogue([{
                    character: 'blonde_guy_comms',
                    text: "EXCELLENT MANEUVERING! NOW PRESS SPACEBAR TO TEST THE LASER CANNONS!",
                    waitForSpacebar: false
                }]);
            }
        } else if (this.tutorialState === 'shooting') {
            if (this.spacebar.isDown) {
                this.tutorialState = 'done';
                this.visualKeys.SPACE.setFillStyle(0x00ff00);

                // Wait 1 second so they can see the green spacebar, then start the game!
                this.time.delayedCall(3000, () => {
                    this.tutorialUI.destroy(); // Remove the floating keys
                    this.startCutscene();
                });
            }
        }

        // --- MOVEMENT RESTRICTIONS (THE INVISIBLE BOUNDARIES) ---
        // 1. Calculate the limits based on the current canvas height
        const minY = this.cameras.main.height * 0.55; // Cannot go higher than the top 40% mark
        const maxY = this.cameras.main.height * 0.80; // Cannot go lower than the bottom 15% mark

        // --- PHASE MANAGER PROGRESSION ---
        if (this.currentPhase === 1 && this.spawnerTimer) {
            let timePassed = time - this.gameplayStartTime;

            // Condition: 5 robots defeated AND 10 seconds (10000ms) have passed
            if (this.enemiesDefeated >= 5 && timePassed >= 10000) {
                this.triggerAICloning();
            }
        }

        // Phase 3 to Phase 4 (Trigger Virus after 20 seconds)
        if (this.currentPhase === 3 && this.firewallGivenTime > 0) {
            if (time - this.firewallGivenTime >= 20000) {
                this.triggerVirus(time);
            }
        }

        // Phase 4 to Phase 5 (Trigger Antivirus after 10 seconds of survival)
        if (this.currentPhase === 4 && this.virusGivenTime > 0) {
            if (time - this.virusGivenTime >= 10000) {
                this.triggerAntivirus();
            }
        }

        // Phase 5 to Phase 6 (Trigger Ads 15 seconds after Antivirus)
        if (this.currentPhase === 5 && this.antivirusGivenTime > 0) {
            if (time - this.antivirusGivenTime >= 15000) {
                this.triggerAds(time);
            }
        }

        // Phase 6 to Phase 7 (Trigger Adblocker 10 seconds after Ads spawn)
        if (this.currentPhase === 6 && this.adsGivenTime > 0) {
            if (time - this.adsGivenTime >= 10000) {
                this.triggerAdblocker();
            }
        }

        // Keep visual auras aligned with the ship
        if (this.hasFirewall && this.firewallVisual) {
            this.firewallVisual.setPosition(this.player.x, this.player.y);
        }
        if (this.hasAntivirus && this.antivirusVisual) {
            this.antivirusVisual.setPosition(this.player.x, this.player.y);
            // Put the shield in the top left corner of the aura
            this.antivirusShield.setPosition(this.player.x - 18, this.player.y - 18);
        }

        // 2. Clamp the player's vertical position (ONLY IF NOT IN THE FINALE)
        if (this.currentPhase !== 99) {
            if (this.player.y < minY) {
                this.player.y = minY;
            } else if (this.player.y > maxY) {
                this.player.y = maxY;
            }
        }

        // --- SHOOTING ---
        // Prevent shooting if we are in the finale (Phase 99)
        if (isShooting && time > this.lastFired && this.currentPhase !== 99) {
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

        // Destroy boss lasers that fly off the bottom
        this.bossLasers.children.iterate((laser) => {
            if (laser && laser.y > this.cameras.main.height + 20) {
                laser.destroy();
            }
        });

        // --- PARALLAX BACKGROUND SHIFT ---
        if (this.player && this.player.active) {
            // Calculate how far the player is from the center of the screen
            const offsetX = (this.player.x - this.cameras.main.centerX);
            const offsetY = (this.player.y - this.cameras.main.centerY);

            // Shift the background 5% in the OPPOSITE direction
            this.spaceBg.x = this.cameras.main.centerX - (offsetX * 0.05);
            this.spaceBg.y = this.cameras.main.centerY - (offsetY * 0.05);
        }
    }
}

class PartyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PartyScene' });
    }

    init(data) {
        this.playerName = data.playerName || "HERO";
        this.finalScore = data.score || 0;
    }

    create() {
        const cam = this.cameras.main;

        // --- 1. GENERATE PLACEHOLDER TEXTURES ---
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // Festive Background Frame 1 (Darker Gray with confetti)
        gfx.fillStyle(0x444455, 1).fillRect(0, 0, 800, 600);
        gfx.fillStyle(0xff0000, 1).fillCircle(100, 100, 10);
        gfx.fillStyle(0x00ff00, 1).fillCircle(600, 200, 10);
        gfx.fillStyle(0x0000ff, 1).fillCircle(300, 500, 10);
        gfx.generateTexture('party_bg_1', 800, 600);
        gfx.clear();

        // Festive Background Frame 2 (Slightly lighter with shifted confetti)
        gfx.fillStyle(0x555566, 1).fillRect(0, 0, 800, 600);
        gfx.fillStyle(0xffaa00, 1).fillCircle(120, 120, 10);
        gfx.fillStyle(0x00ffff, 1).fillCircle(580, 220, 10);
        gfx.fillStyle(0xff00ff, 1).fillCircle(320, 480, 10);
        gfx.generateTexture('party_bg_2', 800, 600);
        gfx.clear();

        // Leaderboard Panel
        gfx.fillStyle(0x222222, 0.9).fillRoundedRect(0, 0, 400, 300, 16);
        gfx.lineStyle(4, 0x00ffff, 1).strokeRoundedRect(0, 0, 400, 300, 16);
        gfx.generateTexture('leaderboard_bg', 400, 300);
        gfx.clear();

        // Button Background
        gfx.fillStyle(0x0088ff, 1).fillRoundedRect(0, 0, 120, 40, 8);
        gfx.generateTexture('btn_bg', 120, 40);
        gfx.destroy();

        // --- 2. CREATE ANIMATED BACKGROUND ---
        if (!this.anims.exists('party_dance')) {
            this.anims.create({
                key: 'party_dance',
                frames: [{ key: 'party_bg_1' }, { key: 'party_bg_2' }],
                frameRate: 2,
                repeat: -1
            });
        }

        this.bg = this.add.sprite(cam.centerX, cam.centerY, 'party_bg_1').play('party_dance');
        this.bg.setDisplaySize(cam.width, cam.height);

        // --- 3. SETUP DIALOGUE MANAGER ---
        this.dialogue = new DialogueManager(this);
        this.scale.on('resize', () => this.dialogue.resize(this.cameras.main), this);
        this.dialogue.resize(cam);

        // --- 4. THE "IRIS IN" TRANSITION ---
        let irisGraphics = this.add.graphics().setDepth(200);
        let maxRadius = Math.max(cam.width, cam.height);
        let irisObj = { r: 0 }; // Start completely closed (black screen)

        // Draw the initial black screen so it doesn't flash
        irisGraphics.lineStyle(3000, 0x000000, 1);
        irisGraphics.strokeCircle(cam.centerX, cam.centerY, irisObj.r + 1500);

        this.tweens.add({
            targets: irisObj,
            r: maxRadius, // Open up to reveal the screen
            duration: 2500,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                irisGraphics.clear();
                irisGraphics.lineStyle(3000, 0x000000, 1);
                irisGraphics.strokeCircle(cam.centerX, cam.centerY, irisObj.r + 1500);
            },
            onComplete: () => {
                irisGraphics.destroy(); // Remove the black cover
                this.startSequence(); // Start the timing sequence!
            }
        });

        // Clean up the global resize listener when this scene shuts down!
        this.events.once('shutdown', () => {
            this.scale.removeAllListeners('resize');
        });
    }

    startSequence() {
        // 1. Wait 2 seconds, then show first dialogue
        this.time.delayedCall(2000, () => {
            this.dialogue.startDialogue([{
                character: 'blonde_guy',
                text: "AWESOME! THE ROGUE AI ROBOTS HAVE BEEN DEFEATED, THANK YOU FOR YOUR HELP!",
                waitForSpacebar: false
            }]);

            // 2. Wait 4 seconds, then hide dialogue and show Leaderboard
            this.time.delayedCall(4000, () => {
                this.dialogue.uiContainer.setVisible(false);
                this.dialogue.currentMessage = null;

                this.showLeaderboard();
            });
        });
    }

    showLeaderboard() {
        const cam = this.cameras.main;

        // --- 1. MOCK DATABASE LOGIC (localStorage) ---
        // Fetch existing scores, or start a new empty array if it's their first time playing
        let leaderboard = JSON.parse(localStorage.getItem('futureReadyLeaderboard')) || [];

        // Check if this specific player name is already in the database
        let existingPlayerIndex = leaderboard.findIndex(p => p.name === this.playerName);

        if (existingPlayerIndex !== -1) {
            // Player exists! Only overwrite their score if the NEW score is higher
            if (this.finalScore > leaderboard[existingPlayerIndex].score) {
                leaderboard[existingPlayerIndex].score = this.finalScore;
            }
        } else {
            // Brand new player, add them to the list!
            leaderboard.push({ name: this.playerName, score: this.finalScore });
        }

        // Sort the entire leaderboard from highest score to lowest score
        leaderboard.sort((a, b) => b.score - a.score);

        // Save the updated list back into the browser's permanent memory
        localStorage.setItem('futureReadyLeaderboard', JSON.stringify(leaderboard));

        // Find out what rank the player got on this run!
        let playerRank = leaderboard.findIndex(p => p.name === this.playerName) + 1;


        // --- 2. BUILD THE UI ---
        this.lbContainer = this.add.container(cam.centerX, cam.height + 300).setDepth(50);

        let bg = this.add.image(0, 0, 'leaderboard_bg');
        let title = this.add.text(0, -120, "TOP PILOTS", { fontFamily: 'Courier', fontSize: '28px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);

        this.lbContainer.add([bg, title]);

        // Draw the Top 5 scores
        let startY = -70;
        let limit = Math.min(5, leaderboard.length); // Only show top 5 max

        for (let i = 0; i < limit; i++) {
            let entry = leaderboard[i];
            let isCurrentPlayer = (entry.name === this.playerName);

            // Highlight the current player in green, others in white
            let textColor = isCurrentPlayer ? '#00ff00' : '#ffffff';
            let rankText = `#${i + 1}  ${entry.name.padEnd(15, ' ')} ${entry.score.toString().padStart(6, '0')}`;

            let row = this.add.text(0, startY + (i * 30), rankText, {
                fontFamily: 'Courier',
                fontSize: '20px',
                color: textColor,
                fontStyle: isCurrentPlayer ? 'bold' : 'normal'
            }).setOrigin(0.5);

            this.lbContainer.add(row);
        }

        // Draw a separator line
        let line = this.add.rectangle(0, 80, 300, 2, 0x555555);

        // Show the player's personal placement at the bottom
        let personalText = this.add.text(0, 110, `YOUR RANK: #${playerRank} | SCORE: ${this.finalScore}`, {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.lbContainer.add([line, personalText]);

        // --- 3. ANIMATE IT ONTO SCREEN ---
        this.tweens.add({
            targets: this.lbContainer,
            y: cam.centerY - 50,
            duration: 1000,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.dialogue.startDialogue([{
                        character: 'blonde_guy',
                        text: "THANK YOU FOR PLAYING!",
                        waitForSpacebar: false
                    }]);

                    this.createButtons(); // Bring in the interactive buttons!
                });
            }
        });
    }

    createButtons() {
        const cam = this.cameras.main;
        const btnY = cam.centerY + 140; // Positioned right under the leaderboard

        // Helper function to create interactive buttons
        const createBtn = (x, label, callback) => {
            let container = this.add.container(x, btnY).setDepth(50).setAlpha(0); // Start hidden
            let bg = this.add.image(0, 0, 'btn_bg').setInteractive({ useHandCursor: true });
            let text = this.add.text(0, 0, label, { fontFamily: 'Courier', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

            container.add([bg, text]);

            // Hover effects
            bg.on('pointerover', () => bg.setTint(0x00ffff));
            bg.on('pointerout', () => bg.clearTint());
            bg.on('pointerdown', () => {
                bg.setTint(0x00aa00);
                callback();
            });

            // Fade them in
            this.tweens.add({ targets: container, alpha: 1, duration: 500 });
        };

        // Create the three buttons evenly spaced
        createBtn(cam.centerX - 140, "SHARE", () => {
            console.log("Player clicked Share!");
            // Optional: Copy score to clipboard!
            navigator.clipboard.writeText(`I just scored ${this.finalScore} defending Earth in Future Ready! Can you beat me?`);
            alert("Score copied to clipboard! Ready to share!");
        });

        createBtn(cam.centerX, "PLAY AGAIN", () => {
            // Drop the old name data! Start completely fresh.
            this.scene.start('OfficeScene');
        });

        createBtn(cam.centerX + 140, "EXIT", () => {
            console.log("Exiting to Main Menu...");

            // Cleanly transition back to the TitleScene!
            this.scene.start('TitleScene');
        });
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
    // NEW: Add TitleScene as the VERY FIRST scene in the array so it loads automatically!
    scene: [TitleScene, OfficeScene, MainScene, PartyScene]
};

// Boot the game immediately when the webpage loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Phaser.Game(config);
});