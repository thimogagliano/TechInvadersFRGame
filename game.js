class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }


    preload() {
        // --- 1. LOAD YOUR ASSETS ---
        // Replace 'assets/TitleBg.png' with your actual background file!
        this.load.image('Titlescreen background', 'assets/TitlescreenBackground2.png');

        // Load the ships we want to use as ambient flying objects
        this.load.image('Player ship', 'assets/SchipSpelerBooster.png');
        this.load.image('Helper ship blue', 'assets/HelperShipBlueBooster.png');
        this.load.image('Helper ship purple', 'assets/HelperShipPurpleBooster.png');
        this.load.image('EnemyRobot', 'assets/EnemyRobot.png');
        this.load.image('Polygon', 'assets/PolygonFRD.png');
        this.load.image('Rectangle', 'assets/RectangleFRD.png');
        this.load.image('Arrow', 'assets/ArrowFRD.png');

    }

    create() {
        const startScreen = document.getElementById('start-screen');
        const cam = this.cameras.main;
        const playButton = document.getElementById('play-button');
        startScreen.style.display = 'flex';

        // --- 2. SETUP THE STATIC BACKGROUND ---
        this.bg = this.add.image(cam.centerX, cam.centerY, 'Titlescreen background').setDepth(-10);
        this.scaleBackgroundToCover(this.bg);

        // --- 3. SETUP THE FLYING OBJECTS GROUP ---
        this.flyingObjects = this.physics.add.group();

        // --- NEW: DRAW THE ARCADE CABINET BORDER ---
        // this.drawArcadeBorder();

        // --- 4. CREATE THE SPAWNER TIMER ---
        this.time.addEvent({
            delay: 1500,
            callback: this.spawnFlyingObject,
            callbackScope: this,
            loop: true
        });

        // Handle window resizing
        this.scale.on('resize', () => {
            this.scaleBackgroundToCover(this.bg);

            // --- NEW: REDRAW THE BORDER IF THE SCREEN CHANGES SIZE ---
            // this.drawArcadeBorder();
        }, this);

        // Cleanup listeners
        this.events.once('shutdown', () => {
            this.scale.removeAllListeners('resize');
        });

        // 3. When the player clicks "PLAY GAME", hide the HTML and start the game!
        // (We use .onclick instead of addEventListener so it doesn't duplicate if they play twice)
        playButton.onclick = () => {
            startScreen.style.display = 'none';
            this.scene.start('OfficeScene');
        };
    }

    scaleBackgroundToCover(bgImage) {
        if (!bgImage || !bgImage.active) return;
        const cam = this.cameras.main;
        const scaleX = cam.width / bgImage.width;
        const scaleY = cam.height / bgImage.height;
        const maxScale = Math.max(scaleX, scaleY);
        bgImage.setScale(maxScale);
        bgImage.setPosition(cam.centerX, cam.centerY);
    }

    spawnFlyingObject() {
        const cam = this.cameras.main;

        // Pick a random object from the ones we loaded
        const objectTypes = ['Player ship', 'EnemyRobot', 'Polygon', 'Rectangle', 'Arrow', 'Helper ship blue', 'Helper ship purple'];
        const randomObjectKey = Phaser.Utils.Array.GetRandom(objectTypes);

        // Decide if it starts on the Left (0) or Right (1)
        const startSide = Phaser.Math.Between(0, 1);

        // Pick a random height on the screen
        const startY = Phaser.Math.Between(cam.height * 0.1, cam.height * 0.9);

        let startX, velocityX, angle;

        // --- NEW: CHECK WHAT KIND OF OBJECT IT IS ---
        // If the word "ship" is in the name, it's a ship! Otherwise, it's a robot/other.
        const isShip = randomObjectKey.toLowerCase().includes('ship');
        const isRobot = randomObjectKey.toLowerCase().includes('robot');

        if (startSide === 0) {
            // Spawn on the LEFT edge, fly to the RIGHT
            startX = -100;
            velocityX = Phaser.Math.Between(100, 300); // Speed

            // --- CHANGED: Only rotate if it's a ship ---
            angle = isShip ? 90 : 0;
        } else {
            // Spawn on the RIGHT edge, fly to the LEFT
            startX = cam.width + 100;
            velocityX = Phaser.Math.Between(-100, -300); // Negative speed goes left

            // --- CHANGED: Only rotate if it's a ship ---
            angle = isShip ? -90 : 0;
        }

        // Create the object! Depth -5 puts it above the background, but behind HTML
        let flyingObj = this.flyingObjects.create(startX, startY, randomObjectKey).setDepth(-5);

        // Apply physics and rotation
        flyingObj.setVelocityX(velocityX);
        flyingObj.setAngle(angle);

        // --- CHANGED: CONDITIONAL SCALING ---
        let randomScale;
        if (isShip) {
            // Normal size for ships
            randomScale = Phaser.Math.FloatBetween(0.5, 1);
        } else if (isRobot) {
            // Noticeably smaller size for robots and other objects
            randomScale = Phaser.Math.FloatBetween(0.7, 1.2);
        } else {
            // Noticeably smaller size for robots and other objects
            randomScale = Phaser.Math.FloatBetween(0.2, 0.4);
        }

        flyingObj.setScale(randomScale);
        flyingObj.setAlpha(Phaser.Math.FloatBetween(0.7, 1));
    }

    // drawArcadeBorder() {
    //     const cam = this.cameras.main;

    //     // If the border already exists (like during a window resize), clear it out first!
    //     if (this.arcadeBorder) {
    //         this.arcadeBorder.clear();
    //     } else {
    //         // Create the graphics object on the very top layer (Depth 100)
    //         this.arcadeBorder = this.add.graphics().setDepth(100);
    //     }

    //     // Determine how thick the arcade cabinet plastic should be
    //     const isMobile = cam.width < 600;
    //     const thickness = isMobile ? 6 : 30;

    //     // --- 1. DRAW THE THICK BLACK/DARK GREY OUTER CABINET ---
    //     this.arcadeBorder.fillStyle(0x1a1a1a, 1); // Dark charcoal grey

    //     // Draw the 4 walls of the border
    //     this.arcadeBorder.fillRect(0, 0, cam.width, thickness); // Top
    //     this.arcadeBorder.fillRect(0, cam.height - thickness, cam.width, thickness); // Bottom
    //     this.arcadeBorder.fillRect(0, 0, thickness, cam.height); // Left
    //     this.arcadeBorder.fillRect(cam.width - thickness, 0, thickness, cam.height); // Right

    //     // --- 2. DRAW THE NEON INNER ACCENT LINE ---
    //     // This gives it that classic 80s/90s arcade machine screen glow
    //     this.arcadeBorder.lineStyle(4, 0x00ffff, 0.8); // 4px thick, Cyan color, 80% opacity

    //     // Draw the stroke exactly inside the thick walls
    //     this.arcadeBorder.strokeRect(
    //         thickness,
    //         thickness,
    //         cam.width - (thickness * 2),
    //         cam.height - (thickness * 2)
    //     );

    //     // Optional: Add a second, thinner inner line for detail
    //     this.arcadeBorder.lineStyle(1, 0xff00ff, 0.5); // Thin magenta line
    //     this.arcadeBorder.strokeRect(
    //         thickness + 6,
    //         thickness + 6,
    //         cam.width - (thickness * 2) - 12,
    //         cam.height - (thickness * 2) - 12
    //     );
    // }

    update() {
        const cam = this.cameras.main;

        // --- MEMORY CLEANUP ---
        // Destroy ships that have flown completely off the screen so the game doesn't crash!
        this.flyingObjects.children.iterate((ship) => {
            if (ship) {
                if (ship.x < -150 || ship.x > cam.width + 150) {
                    ship.destroy();
                }
            }
        });
    }
}

class DialogueManager {
    constructor(scene, allowSkip = false) {
        this.scene = scene;
        this.allowSkip = allowSkip;

        this.queue = [];
        this.currentIndex = 0;
        this.isTyping = false;
        this.currentMessage = null;
        this.typewriterTimer = null;
        this.onComplete = null;

        // --- BUILD THE UI ---
        this.uiContainer = this.scene.add.container(0, 0).setDepth(1000);
        this.uiContainer.setVisible(false);

        this.bubbleGraphics = this.scene.add.graphics();

        // --- 1. FIX: ANCHOR THE PORTRAITS TO THE BOTTOM ---
        // setOrigin(0, 1) anchors it to the Bottom-Left corner
        this.portrait = this.scene.add.image(0, 0, 'Robbin').setOrigin(0, 1);

        // setOrigin(1, 1) anchors it to the Bottom-Right corner
        this.portraitSecondary = this.scene.add.image(0, 0, 'Robbin').setOrigin(1, 1);
        this.portraitSecondary.setVisible(false);

        // Text setup
        this.dialogText = this.scene.add.text(0, 0, "", {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: '12px',
            color: '#000000',
            lineSpacing: 8
        });

        this.hintText = this.scene.add.text(0, 0, "", {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: '8px',
            color: '#555555'
        }).setOrigin(1, 1);

        this.uiContainer.add([this.bubbleGraphics, this.portrait, this.portraitSecondary, this.dialogText, this.hintText]);

        // Input
        this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spacebar.on('down', () => this.handleInput());
        this.scene.input.on('pointerdown', () => this.handleInput());
    }

    resize(cam) {
        this.isMobile = cam.width < 600;

        this.marginX = this.isMobile ? cam.width * 0.02 : cam.width * 0.05;
        this.marginY = cam.height * 0.02;
        this.boxHeight = this.isMobile ? cam.height * 0.18 : cam.height * 0.15;
        this.targetPortraitHeight = this.boxHeight * 1.1;

        this.uiContainer.setPosition(0, 0);

        // --- NEW: DYNAMIC FONT FAMILIES ---
        // Keep the retro font for desktop, but use clean, readable Verdana for mobile
        const mobileFont = 'Verdana, Arial, sans-serif';
        const desktopFont = '"Press Start 2P", Courier, monospace';

        this.dialogText.setFontFamily(this.isMobile ? mobileFont : desktopFont);
        this.hintText.setFontFamily(this.isMobile ? mobileFont : desktopFont);

        // --- NEW: DYNAMIC FONT SIZES ---
        // Because Verdana is so thin, we can safely use 12px on mobile and it will 
        // STILL take up less room than your 10px retro font!
        const dynamicFontSize = this.isMobile ? 12 : 12;

        this.dialogText.setFontSize(dynamicFontSize + 'px');

        // Add slightly more line spacing on mobile for readability
        this.dialogText.setLineSpacing(this.isMobile ? 6 : 8);
        this.hintText.setFontSize((dynamicFontSize - 2) + 'px');

        if (this.currentMessage) {
            this.layoutDynamicUI();
            this.drawBubble(this.currentBoxWidth);
        }
    }

    // --- NEW: A helper function that dynamically calculates layout based on current art ---
    layoutDynamicUI() {
        const cam = this.scene.cameras.main;

        // Shrink the gap between the character portrait and the speech bubble on mobile
        const gap = this.isMobile ? 8 : 20;

        // --- LEFT PORTRAIT ---
        if (this.currentMessage.character) {
            this.portrait.setTexture(this.currentMessage.character);
            this.portrait.displayHeight = this.targetPortraitHeight;
            this.portrait.scaleX = this.portrait.scaleY;
            this.portrait.setPosition(this.marginX, cam.height - this.marginY);
        }

        // --- SPEECH BUBBLE STARTING POINT ---
        this.boxX = this.marginX + this.portrait.displayWidth + gap;
        this.boxY = cam.height - this.boxHeight - this.marginY;

        // --- RIGHT PORTRAIT ---
        if (this.currentMessage.character2) {
            this.portraitSecondary.setTexture(this.currentMessage.character2);
            this.portraitSecondary.setVisible(true);
            this.portraitSecondary.displayHeight = this.targetPortraitHeight;
            this.portraitSecondary.scaleX = this.portraitSecondary.scaleY;
            this.portraitSecondary.setPosition(cam.width - this.marginX, cam.height - this.marginY);

            this.currentBoxWidth = (cam.width - this.marginX - this.portraitSecondary.displayWidth - gap) - this.boxX;
        } else {
            this.portraitSecondary.setVisible(false);
            this.currentBoxWidth = cam.width - this.marginX - this.boxX;
        }

        // --- FIX: TEXT PADDING ---
        // Use 10px padding on mobile to maximize room, and 20px on desktop
        const padX = this.isMobile ? 6 : 20;
        const padY = this.isMobile ? 6 : 20;

        // Update Text Positions with the new padding
        this.dialogText.setPosition(this.boxX + padX, this.boxY + padY);
        this.dialogText.setWordWrapWidth(this.currentBoxWidth - (padX * 2), true);

        // Tuck the hint text cleanly into the bottom right corner
        this.hintText.setPosition(this.boxX + this.currentBoxWidth - padX, this.boxY + this.boxHeight - 5);
    }

    drawBubble(width) {
        this.bubbleGraphics.clear();

        // --- FIX: BORDER THICKNESS ---
        // Force the thickness to 3px on mobile and 4px on desktop so it never shrinks away!
        const borderThickness = this.isMobile ? 3 : 4;

        this.bubbleGraphics.lineStyle(borderThickness, 0x000000, 1);
        this.bubbleGraphics.fillStyle(0xffffff, 1);

        // Adjust the tail to be slightly smaller on mobile
        const tailTipX = this.boxX - (this.isMobile ? 15 : 25);
        const tailTipY = this.boxY + this.boxHeight - 40;
        const tailTopY = this.boxY + this.boxHeight - 70;
        const tailBottomY = this.boxY + this.boxHeight - 30;

        // Triangle tail
        this.bubbleGraphics.fillTriangle(this.boxX, tailTopY, tailTipX, tailTipY, this.boxX, tailBottomY);
        this.bubbleGraphics.strokeTriangle(this.boxX, tailTopY, tailTipX, tailTipY, this.boxX, tailBottomY);

        // Rounded Box
        this.bubbleGraphics.fillRoundedRect(this.boxX, this.boxY, width, this.boxHeight, 8);
        this.bubbleGraphics.strokeRoundedRect(this.boxX, this.boxY, width, this.boxHeight, 8);

        // Seam hiding trick (Must be slightly thicker than the black border to cover it!)
        this.bubbleGraphics.lineStyle(borderThickness + 2, 0xffffff, 1);
        this.bubbleGraphics.beginPath();
        this.bubbleGraphics.moveTo(this.boxX, tailTopY + 6);
        this.bubbleGraphics.lineTo(this.boxX, tailBottomY - 3);
        this.bubbleGraphics.strokePath();
    }

    startDialogue(messages, onComplete) {
        if (!Array.isArray(messages)) messages = [messages];
        this.queue = messages;
        this.currentIndex = 0;
        this.onComplete = onComplete;
        this.uiContainer.setVisible(true);
        this.isTyping = false;
        this.showNextMessage();
    }

    showNextMessage() {
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

        this.currentMessage = this.queue[this.currentIndex];

        // 1. Calculate dynamic layout based on current artwork
        this.layoutDynamicUI();

        // 2. Draw the visual box
        this.drawBubble(this.currentBoxWidth);

        // 3. Setup the text
        this.dialogText.setText('');
        this.isTyping = true;
        let charIndex = 0;

        if (this.allowSkip) {
            this.hintText.setText("tap / space to skip");
            this.hintText.setVisible(true);
        } else {
            this.hintText.setVisible(false);
        }

        if (this.typewriterTimer) this.typewriterTimer.remove();

        this.typewriterTimer = this.scene.time.addEvent({
            delay: 15,
            callback: () => {
                this.dialogText.text += this.currentMessage.text[charIndex];
                charIndex++;
                if (charIndex >= this.currentMessage.text.length) {
                    this.isTyping = false;
                    this.typewriterTimer.remove();

                    if (this.currentMessage.waitForSpacebar) {
                        this.hintText.setText("tap / space to continue");
                        this.hintText.setVisible(true);
                    } else {
                        this.hintText.setVisible(false);
                    }
                }
            },
            callbackScope: this,
            repeat: this.currentMessage.text.length - 1
        });

        this.currentIndex++;
    }

    handleInput() {
        if (!this.uiContainer.visible) return;
        if (!this.currentMessage) return;

        if (this.isTyping && this.allowSkip) {
            if (this.typewriterTimer) this.typewriterTimer.remove();
            this.dialogText.setText(this.currentMessage.text);
            this.isTyping = false;

            if (this.currentMessage.waitForSpacebar) {
                this.hintText.setText("tap / space to continue");
                this.hintText.setVisible(true);
            } else {
                this.hintText.setVisible(false);
            }
            return;
        }

        if (this.isTyping) return;
        if (!this.currentMessage.waitForSpacebar) return;

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

    preload() {
        this.load.image('Future Ready Headquarters', 'assets/FrHqV2.png');
        this.load.image('Future Ready Headquarters Alarm', 'assets/FrHqAlarmV2.png');

        // --- NEW: MOVED FROM MAIN SCENE ---
        this.load.image('Future Ready launch platform', 'assets/FrLaunchPlatform.png');
        this.load.spritesheet('Launching Spritesheet', 'assets/SpritesheetLaunch.png', {
            frameWidth: 1500,
            frameHeight: 1120
        });

        this.load.image('Robbin', 'assets/Robbin.png');
        this.load.image('Robbin_comms', 'assets/Robbin_comms.png');
        this.load.image('James', 'assets/James.png');
        this.load.image('James_spacesuit', 'assets/James_spacesuit.png');
        this.load.image('Stijn', 'assets/Stijn.png');
        this.load.image('Stijn_spacesuit', 'assets/Stijn_spacesuit.png');
    }

    create() {
        this.input.keyboard.clearCaptures();

        this.bgNormal = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'Future Ready Headquarters').setDepth(-2);

        this.bgRed = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'Future Ready Headquarters Alarm').setDepth(-1);
        this.bgRed.setVisible(false);

        // --- NEW: THE CUTSCENE BACKGROUND ---
        this.cutsceneBg = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'Future Ready launch platform').setDepth(90);
        this.cutsceneBg.setVisible(false);

        // --- NEW: CREATE LAUNCH ANIMATION ---
        if (!this.anims.exists('Launching Spritesheet')) {
            this.anims.create({
                key: 'Launching Spritesheet',
                frames: this.anims.generateFrameNumbers('Launching Spritesheet', { start: 0, end: 9 }),
                frameRate: 5,
                repeat: 0
            });
        }

        this.scaleBackgroundToCover(this.bgNormal);
        this.scaleBackgroundToCover(this.bgRed);

        this.scale.on('resize', () => {
            this.scaleBackgroundToCover(this.bgNormal);
            this.scaleBackgroundToCover(this.bgRed);
            if (this.uiCamera) this.uiCamera.setSize(this.scale.width, this.scale.height);
            if (this.cutsceneBg && this.cutsceneBg.visible) this.scaleBackgroundToCover(this.cutsceneBg);
            if (this.dialogue) this.dialogue.resize(this.cameras.main);
        }, this);

        this.dialogue = new DialogueManager(this, true);
        this.dialogue.resize(this.cameras.main);

        this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.startWelcomeSequence();

        this.events.once('shutdown', () => {
            this.scale.removeAllListeners('resize');
        });
    }

    scaleBackgroundToCover(bgImage, paddingMultiplier = 1.0) {
        if (!bgImage || !bgImage.active) return;
        const scaleX = this.cameras.main.width / bgImage.width;
        const scaleY = this.cameras.main.height / bgImage.height;
        const maxScale = Math.max(scaleX, scaleY) * paddingMultiplier;
        bgImage.setScale(maxScale);
        bgImage.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
    }

    startWelcomeSequence() {
        this.dialogue.startDialogue([
            { character: 'Robbin', text: "Welcome to Future Ready HQ! Here we are working on the technology of the future!", waitForSpacebar: true },
            { character: 'Robbin', text: "We have been expecting your visit, our team needs your help...", waitForSpacebar: true },
            { character: 'Robbin', text: "But first we would like to know your name so you can be a part of the team!", waitForSpacebar: true }
        ], () => {
            this.showNameInputForm();
        });
    }

    showNameInputForm() {
        const inputScreen = document.getElementById('name-input-screen');
        const submitBtn = document.getElementById('submit-name-button');
        const inputField = document.getElementById('player-name-input');
        const errorMsg = document.getElementById('name-error-msg');

        this.input.keyboard.enabled = false;

        // --- NEW: DRAW THE DARK OVERLAY INSIDE PHASER ---
        const cam = this.cameras.main;
        // Depth 999 is just below the Dialogue box (Depth 1000)
        this.dimOverlay = this.add.rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x000000, 0.7).setDepth(999);

        inputField.value = "";
        inputField.disabled = false;
        submitBtn.disabled = false;
        submitBtn.innerText = "SUBMIT";
        errorMsg.innerText = "";
        inputScreen.style.display = 'flex';
        inputField.focus();

        this.dialogue.startDialogue([{
            character: 'Robbin',
            text: "You can type your name in the field we have made!",
            waitForSpacebar: false
        }]);

        const badWords = ['badword1', 'swearword2', 'offensiveword3'];

        const checkDatabaseForName = async (nameToCheck) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const takenNames = [];
                    if (takenNames.includes(nameToCheck)) resolve(false);
                    else resolve(true);
                }, 600);
            });
        };

        const processSubmission = async () => {
            let playerName = inputField.value.trim();

            if (playerName === "") { errorMsg.innerText = "Name cannot be empty!"; return; }

            const containsBadWord = badWords.some(word => playerName.toLowerCase().includes(word.toLowerCase()));
            if (containsBadWord) { errorMsg.innerText = "Please choose a more appropriate name."; return; }

            submitBtn.innerText = "CHECKING...";
            submitBtn.disabled = true;
            inputField.disabled = true;

            const isUnique = await checkDatabaseForName(playerName);

            if (!isUnique) {
                errorMsg.innerText = "That name is already taken!";
                submitBtn.innerText = "submit";
                submitBtn.disabled = false;
                inputField.disabled = false;
                inputField.focus();
                return;
            }

            // --- NEW: DESTROY THE DIM OVERLAY WHEN DONE ---
            if (this.dimOverlay) {
                this.dimOverlay.destroy();
            }

            inputScreen.style.display = 'none';
            inputField.onkeydown = null;
            submitBtn.onclick = null;
            this.input.keyboard.enabled = true;

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
        let strobeActive = true;
        const strobeEffect = () => {
            if (!this.scene.isActive('OfficeScene') || !strobeActive) return;
            this.bgRed.setVisible(!this.bgRed.visible);
            this.time.delayedCall(800, strobeEffect);
        };
        strobeEffect();

        this.dialogue.startDialogue([
            { character: 'Robbin', text: "Oh no! We have very bad news! Wild AI robots are about to visit the Earth!", waitForSpacebar: true },
            { character: 'Robbin', text: "It's good that you have arrived, we have built a spaceship that needs testing!... Quick, hop in!!", waitForSpacebar: true }
        ], () => {
            strobeActive = false; // Stop flashing
            this.startCutscene(playerName); // Run the cutscene instead of switching scenes!
        });
    }

    startCutscene(playerName) {
        const cam = this.cameras.main;

        // 1. Create the border - MADE 20% LARGER so the edges don't show when it shakes!
        if (this.cutsceneBorder) this.cutsceneBorder.destroy();
        this.cutsceneBorder = this.add.rectangle(cam.centerX, cam.centerY, cam.width * 1.2, cam.height * 1.2, 0x000000).setDepth(1999);
        this.cutsceneBorder.setVisible(true);

        // --- NEW: MULTI-CAMERA MAGIC ---
        // If we haven't created a UI camera yet, create one now
        if (!this.uiCamera) {
            this.uiCamera = this.cameras.add(0, 0, cam.width, cam.height);
        }

        // Tell the Main Camera (which will shake) to ignore the dialogue box
        this.cameras.main.ignore(this.dialogue.uiContainer);

        // Tell the UI Camera (which stays still) to ignore the background and the cutscene
        this.uiCamera.ignore([this.bgNormal, this.bgRed, this.cutsceneBg, this.cutsceneBorder]);
        // -------------------------------

        // 2. Setup the Sprite - Force it to the very top
        this.cutsceneBg.setDepth(2000);
        this.cutsceneBg.setVisible(true);
        this.cutsceneBg.setAlpha(1);
        this.cutsceneBg.setTexture('Future Ready launch platform');

        // 3. Robust Scaling Logic
        const imgWidth = this.cutsceneBg.width || 100;
        const imgHeight = this.cutsceneBg.height || 100;

        const scaleX = cam.width / imgWidth;
        const scaleY = cam.height / imgHeight;
        const fitScale = Math.min(scaleX, scaleY) * 0.85;

        this.cutsceneBg.setScale(fitScale);
        this.cutsceneBg.setPosition(cam.centerX, cam.centerY);

        // 4. Start Dialogue
        this.dialogue.startDialogue([{
            character: 'Robbin',
            text: "This is our new hightech spaceship that we just built for you! It is ready to be launched and tested against everything the future has to offer!",
            waitForSpacebar: true
        }], () => {

            // 5. Play the animation
            if (this.anims.exists('Launching Spritesheet')) {
                this.cutsceneBg.play('Launching Spritesheet');
            }

            const animScale = Math.min(cam.width / (this.cutsceneBg.width || 100), cam.height / (this.cutsceneBg.height || 100)) * 0.85;
            this.cutsceneBg.setScale(animScale);

            // Trigger the shake on the MAIN camera only!
            this.cameras.main.shake(2500, 0.005);

            this.dialogue.startDialogue([{
                character: 'Robbin_comms',
                text: "Now it's time for you, " + playerName + ", to make this spaceship Future Ready!",
                waitForSpacebar: true
            }], () => {
                this.cutsceneBg.stop();
                // When we transition to MainScene, Phaser automatically cleans up our extra UI camera!
                this.scene.start('MainScene', { playerName: playerName });
            });
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // NEW: Catch the data sent from the OfficeScene
    init(data) {
        //detect touch input   
        this.isTouch = this.sys.game.device.input.touch;
        // Catch the name, or use fallback
        this.playerName = data.playerName || "FutureReady007";

        // NEW: Catch the skip flag! If it wasn't passed, default to false.
        this.skipTutorial = data.skipTutorial || false;

        this.playerSpeed = 300;
        this.lastFired = 0;
        this.fireRate = 250;
        this.score = 0;
        this.health = 3;

        // NEW: If we are skipping, start in the 'done' state so the update loop ignores the keys!
        this.tutorialState = this.skipTutorial ? 'done' : 'movement';
        this.keysPressed = { W: false, A: false, S: false, D: false };

        // NEW: Phase Manager Variables
        this.currentPhase = 1;
        this.enemiesDefeated = 0;
        this.gameplayStartTime = 0;

        // NEW: Firewall Variables
        this.activeShields = 0;
        this.shieldIcons = [];

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

        // NEW: Track if the ship has been upgraded yet!
        this.isShipUpgraded = false;

        // Phase 2 Boss Variables
        this.phase2Triggered = false;
        this.bossShielded = false;
        this.hasDoubleLaser = false;
        // --- THE FIX: WIPE THE OLD DIALOGUE MANAGER MEMORY ---
        this.dialogue = null;
    }

    preload() {
        // --- NEW: THE UI HEART ---
        this.load.image('heart', 'assets/heart.png');

        this.load.image('Space background', 'assets/SpaceBg.png');
        // --- NEW: MAIN ACTORS ---
        this.load.image('player ship', 'assets/SchipSpeler.png'); // Your starting ship
        this.load.image('player ship upgraded', 'assets/SchipSpelerUpgraded2.png'); // Phase 2 upgraded ship
        this.load.image('player ship boost', 'assets/SchipSpelerBooster.png');
        this.load.image('player ship upgraded boost', 'assets/SchipSpelerUpgradedBooster2.png');
        this.load.image('Helper ship blue', 'assets/HelperShipBlue.png');
        this.load.image('Helper ship blue boost', 'assets/HelperShipBlueBooster.png');
        this.load.image('Helper ship purple', 'assets/HelperShipPurple.png');
        this.load.image('Helper ship purple boost', 'assets/HelperShipPurpleBooster.png');


        this.load.image('EnemyRobot', 'assets/EnemyRobot.png'); // The Phase 1/2 robots
        this.load.image('boss', 'assets/boss.png');
        this.load.spritesheet('boss_destruction_sheet', 'assets/BossExplodeSpritesheet.png', {
            frameWidth: 300, // <-- CHANGE THIS to your actual frame width
            frameHeight: 200 // <-- CHANGE THIS to your actual frame height
        });


        // --- NEW: THE AD POPUPS ---

        this.load.image('ad_1', 'assets/NumberOneAppsAd.png');
        this.load.image('ad_2', 'assets/limitedEditionAd.png');
        this.load.image('ad_3', 'assets/BestWebsitesAd.png');

        this.load.image('adblocker_icon', 'assets/adblocker_icon.png');
        this.load.image('antivirus_popup', 'assets/Antivirus.png');
        this.load.image('blue_shield', 'assets/Shield.png');

        this.load.image('Robbin', 'assets/Robbin.png');
        this.load.image('Robbin_comms', 'assets/Robbin_comms.png'); // Maybe a holographic version?
        this.load.image('James', 'assets/James.png');
        this.load.image('James_spacesuit', 'assets/James_spacesuit.png');
        this.load.image('Stijn', 'assets/Stijn.png');
        this.load.image('Stijn_spacesuit', 'assets/Stijn_spacesuit.png');


    }

    create() {
        // --- 1. RESET KEYBOARD AND BROWSER FOCUS ---
        this.input.keyboard.enabled = true; // Turn the dashboard back on after a victory!
        window.focus(); // Force the browser to pay attention to the game canvas!

        // --- BOMB-PROOF PARALLAX BACKGROUND ---
        // 1. Add your real space background directly (no container needed!)
        this.spaceBg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'Space background').setDepth(-10);

        // 2. Scale it to perfectly cover the screen, plus an extra 10% (1.1) 
        // to hide the borders when the parallax shifts it!
        this.scaleBackgroundToCover(this.spaceBg, 1.1);

        // NEW LINE: Create the graphics tool so we can draw the placeholders!
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // --- THE FIX: ONLY GENERATE TEXTURES IF THEY DON'T EXIST YET ---
        if (!this.textures.exists('laser')) {
            let gfx = this.make.graphics({ x: 0, y: 0, add: false });

            // 1. Player Laser (Yellow/Cyan Rectangle)
            gfx.fillStyle(0x17F0E6, 1);
            gfx.fillRect(0, 0, 4, 16);
            gfx.generateTexture('laser', 4, 16);
            gfx.clear();

            // 2. Boss Laser (Orange/Red oval)
            gfx.fillStyle(0xff5500, 1);
            gfx.fillRoundedRect(0, 0, 8, 24, 4);
            gfx.generateTexture('boss_laser', 8, 24);

            // Destroy the graphics tool when completely done
            gfx.destroy();
        }

        // --- UPDATED: BOSS DESTRUCTION ANIMATION ---
        if (!this.anims.exists('boss_destruction')) {
            this.anims.create({
                key: 'boss_destruction',
                // Use the new spritesheet! 
                // Change "end: 5" to the number of frames your animation has minus 1. 
                // (e.g., if you have 6 frames, start is 0 and end is 5)
                frames: this.anims.generateFrameNumbers('boss_destruction_sheet', { start: 0, end: 8 }),
                frameRate: 4, // Adjust this to make the explosion faster or slower!
                repeat: 0     // 0 means it only plays exactly once, which is what we want!
            });
        }

        // --- NEW: DYNAMIC MOBILE SCALING ---
        const isMobile = this.cameras.main.width < 600;

        // Make entities 50% smaller on mobile to keep the screen feeling spacious!
        this.entityScale = isMobile ? 0.5 : 1.0;

        // Slow down the speed proportionally so it takes the same amount of time to cross the screen
        this.playerSpeed = isMobile ? 180 : 300;

        // 1. Setup Player 
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.height - 100;
        this.player = this.physics.add.sprite(centerX, startY, 'player ship');
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
            fontFamily: '"Press Start 2P", Courier, monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.playerNameText.setOrigin(0, 0.5); // Center text vertically

        // 3. Score (Center)
        this.scoreText = this.add.text(0, 0, "SCORE: 0000", {
            fontFamily: '"Press Start 2P", Courier, monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.scoreText.setOrigin(0.5, 0.5); // Center completely

        // 4. Health Hearts (Right) - Using real heart images!
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            // CHANGED: add.rectangle is now add.image, using your loaded 'heart' key!
            let heart = this.add.image(0, 0, 'heart');

            heart.setOrigin(1, 0.5); // Keep the right alignment so it anchors perfectly
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

        // --- NEW: THE FAST-TRACK LOGIC ---
        if (this.skipTutorial) {
            // Skip the tutorial and instantly launch the first wave!
            this.startGameplay();
        } else {
            // First time playing? Run the normal tutorial sequence.
            this.startTutorial();
        }

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
        // Adjust the offset so the lasers spawn closer to the shrunken ship's nose
        let yOffset = this.entityScale < 1 ? 10 : 20;

        if (this.hasDoubleLaser) {
            let laser1 = this.lasers.get(this.player.x - 12, this.player.y - yOffset);
            let laser2 = this.lasers.get(this.player.x + 12, this.player.y - yOffset);

            if (laser1) {
                laser1.setActive(true).setVisible(true).setScale(this.entityScale);
                laser1.body.setVelocityY(-600);
            }
            if (laser2) {
                laser2.setActive(true).setVisible(true).setScale(this.entityScale);
                laser2.body.setVelocityY(-600);
            }
        } else {
            let laser = this.lasers.get(this.player.x, this.player.y - yOffset);
            if (laser) {
                laser.setActive(true).setVisible(true).setScale(this.entityScale);
                // Slower laser speed on mobile so it doesn't instantly vanish
                laser.body.setVelocityY(this.entityScale < 1 ? -300 : -500);
            }
        }
    }

    spawnEnemy() {
        // Pick a random X coordinate between the left and right edges
        let randomX = Phaser.Math.Between(32, this.cameras.main.width - 32);

        // Create an enemy just above the top of the screen
        let enemy = this.enemies.create(randomX, -32, 'EnemyRobot');

        if (enemy) {
            // Apply the mobile scale to the robot!
            enemy.setScale(this.entityScale);

            // Adjust fall speed: 60 on mobile, 100 on desktop
            let fallSpeed = this.entityScale < 1 ? 60 : 100;
            enemy.setVelocityY(fallSpeed);
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

        // --- NEW: FIREWALL/SHIELD ABSORPTION LOGIC ---
        if (this.activeShields > 0) {
            this.activeShields--;

            // Pop the last shield image off the UI array and destroy it
            if (this.shieldIcons.length > 0) {
                let lostShield = this.shieldIcons.pop();
                lostShield.destroy();
            }

            // Flash the player Cyan to show the shield absorbed it!
            this.player.setTint(0x00ffff);
            this.time.delayedCall(200, () => {
                if (this.health > 0) this.player.clearTint();
            });

            return; // EXIT EARLY! Do not take a heart away!
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
            // NEW: Launch the dramatic Game Over overlay!
            this.triggerGameOver();
        }
    }

    resizeUI() {
        const cam = this.cameras.main;

        // Force the physics world to resize so the ship doesn't hit an invisible wall!
        this.physics.world.setBounds(0, 0, cam.width, cam.height);

        // --- NEW: RESIZE THE SPACE BACKGROUND ---
        // Keep the 10% parallax padding accurate even if they rotate their phone!
        if (this.spaceBg) {
            this.scaleBackgroundToCover(this.spaceBg, 1.1);
        }

        // NEW: Check if the screen is narrow (mobile)
        const isMobile = cam.width < 600;

        // --- NEW: DYNAMIC PLAYER SCALING ---
        // Save the scale and speed to the class so the spawner and update loop can use them
        this.entityScale = isMobile ? 0.5 : 1.0;
        this.playerSpeed = isMobile ? 180 : 300;

        // Safely scale the player ship if it currently exists
        if (this.player && this.player.active) {
            this.player.setScale(this.entityScale);

            // Optional: Shrink the physics hitbox slightly so close calls feel fair!
            this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.8);
        }

        // --- TOP BAR SIZING & POSITIONING ---
        const topBarHeight = cam.height * 0.06;

        this.topBarBg.setPosition(0, 0);
        this.topBarBg.setSize(cam.width, topBarHeight);

        // --- NEW: STRICT PIXEL FONT SCALING ---
        // Lock the font to 8px on phones, and 14px on desktops
        const topFontSize = isMobile ? 8 : 14;

        // Position Player Name (2% padding from the left edge)
        this.playerNameText.setFontSize(topFontSize + 'px');
        this.playerNameText.setPosition(cam.width * 0.02, topBarHeight / 2);

        // --- SCALE THE HEALTH HEARTS ---
        const heartSize = isMobile ? 18 : 28;
        const heartSpacing = heartSize * 1.2;
        let startX = cam.width - (cam.width * 0.02); // 2% padding from the right edge

        let lastHeartLeftEdge = startX; // We will use this to track where to put the score!

        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setDisplaySize(heartSize, heartSize);
            let heartX = startX - (i * heartSpacing);
            this.hearts[i].setPosition(heartX, topBarHeight / 2);

            // Because the heart origin is right-aligned (1), we calculate its left edge like this:
            lastHeartLeftEdge = heartX - heartSize;
        }

        // --- NEW: POSITION THE SHIELDS UNDER THE HEARTS ---
        // This dynamically loops through however many shields the player has left!
        for (let i = 0; i < this.shieldIcons.length; i++) {

            // Make them the same size as the hearts
            this.shieldIcons[i].setDisplaySize(heartSize, heartSize);

            let shieldX = startX - (i * heartSpacing);

            // Position them right BELOW the hearts!
            let yOffset = (topBarHeight / 2) + heartSize + (isMobile ? 5 : 10);
            this.shieldIcons[i].setPosition(shieldX, yOffset);
        }

        // --- POSITION SCORE (RIGHT-ALIGNED) ---
        // Instead of center, push it to the right, sitting just before the hearts!
        this.scoreText.setOrigin(1, 0.5); // Forces the text to align to the right
        this.scoreText.setFontSize(topFontSize + 'px');

        // Add a clean margin (15px mobile / 25px desktop) between the hearts and the score
        let scoreMargin = isMobile ? 15 : 25;
        this.scoreText.setPosition(lastHeartLeftEdge - scoreMargin, topBarHeight / 2);

        // --- NEW: RESIZE BOSS UI IF ACTIVE ---
        if (this.bossUIContainer && this.bossUIContainer.visible) {
            this.bossBarWidth = isMobile ? cam.width * 0.8 : cam.width * 0.6;
            this.bossBarHeight = isMobile ? 6 : 12;
            let barX = cam.centerX - (this.bossBarWidth / 2);

            // Re-center Background
            this.bossBarBg.setPosition(barX, this.bossBarBg.y);
            this.bossBarBg.setSize(this.bossBarWidth, this.bossBarHeight);

            // Re-center and scale Fill
            let healthPercent = Math.max(0, this.bossHealth / this.bossMaxHealth);
            this.bossBarFill.setPosition(barX, this.bossBarFill.y);
            this.bossBarFill.setSize(this.bossBarWidth * healthPercent, this.bossBarHeight);

            // Re-center Text
            this.bossNameText.setPosition(cam.centerX, this.bossNameText.y);
            this.bossNameText.setFontSize(isMobile ? '8px' : '12px');
        }

        // --- BOTTOM DIALOGUE BOX SIZING ---
        // Reserve the bottom 15% for the box, with a little padding
        const boxHeight = cam.height * 0.15;
        const boxWidth = cam.width * 0.90;
        const marginX = (cam.width - boxWidth) / 2;
        const marginY = cam.height - boxHeight - (cam.height * 0.02);

        // --- THE FIX: ONLY INITIALIZE IF IT DOESN'T EXIST YET ---
        if (!this.dialogue) {
            this.dialogue = new DialogueManager(this);
            this.scale.on('resize', () => this.dialogue.resize(this.cameras.main), this);
        }

        // Always resize it, whether it was just created or already existed
        this.dialogue.resize(this.cameras.main);
    }

    startTutorial() {
        this.createTutorialUI();

        // Check if we are on a mobile device and give the right instructions
        if (this.isTouch) {
            this.dialogue.startDialogue([{
                character: 'Robbin_comms',
                text: "Can you hear me?... Good! Let's test the thrusters. Drag your finger on the left side of the screen to steer!",
                waitForSpacebar: false
            }]);
        } else {
            this.dialogue.startDialogue([{
                character: 'Robbin_comms',
                text: "Can you hear me?... Good! Let's test the thrusters. Use W, A, S, D or the arrow keys to move around!",
                waitForSpacebar: false
            }]);
        }
    }

    createTutorialUI() {
        this.tutorialUI = this.add.container(this.cameras.main.centerX, this.cameras.main.height * 0.3).setDepth(50);
        const keyStyle = { fontFamily: '"Press Start 2P", Courier', fontSize: '12px', color: '#000000', fontStyle: 'bold' };

        if (this.isTouch) {
            // TOUCH UI: Simple glowing text labels for the sides of the screen
            let leftText = this.add.text(-this.cameras.main.width * 0.25, 0, "[ LEFT HALF: MOVE ]", { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#00ffff' }).setOrigin(0.5);
            let rightText = this.add.text(this.cameras.main.width * 0.25, 0, "[ RIGHT HALF: SHOOT ]", { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ff00ff' }).setOrigin(0.5);
            rightText.setVisible(false); // Hide shoot text initially

            this.tutorialUI.add([leftText, rightText]);
            this.visualKeys = { leftText, rightText }; // Store them to turn them green later

        } else {
            // DESKTOP UI: Keep your existing helper function and WASD keys here!
            const createKey = (x, y, label) => {
                let bg = this.add.rectangle(x, y, 50, 50, 0xffffff).setStrokeStyle(4, 0x000000);
                let text = this.add.text(x, y, label, keyStyle).setOrigin(0.5);
                this.tutorialUI.add([bg, text]);
                return bg;
            };

            this.visualKeys = {
                W: createKey(0, -60, 'W'),
                A: createKey(-60, 0, 'A'),
                S: createKey(0, 0, 'S'),
                D: createKey(60, 0, 'D'),
                SPACE: createKey(0, 80, 'SPACE')
            };

            this.visualKeys.SPACE.setSize(170, 50);
            this.visualKeys.SPACE.setVisible(false);
            this.tutorialUI.getAt(9).setVisible(false);
        }
    }

    startGameplay() {
        // 1. Start the dialogue FIRST
        this.dialogue.startDialogue([
            {
                character: 'Robbin_comms',
                text: "Fantastic! Everything works and phase 1 is completed. We have built the spaceship and launched it successfully!",
                waitForSpacebar: true
            },
            {
                character: 'Robbin_comms',
                text: "Systems are green! We are detecting incoming robots, stop as many robots from visiting earth as you can!!",
                waitForSpacebar: true
            }
        ], () => {
            // --- THIS IS THE ON-COMPLETE CALLBACK ---
            // This code ONLY runs after the player has completely finished 
            // and closed the final dialogue balloon!

            this.gameplayStartTime = this.time.now; // Record start time NOW

            // Start the enemy spawner timer NOW
            this.spawnerTimer = this.time.addEvent({
                delay: 1200,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
        });

        // 2. Auto-close the FIRST text balloon after 8 seconds if they forget to press spacebar.
        // (Since there are two messages now, this will just push them to the second message automatically)
        this.time.delayedCall(6000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
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

        // --- NEW: THE WARNING DIALOGUE ---
        this.dialogue.startDialogue([{
            character: 'Robbin_comms',
            text: "The robots are developing fast and we need to keep up with them! They also have lasers now that can disable things on your ship!",
            waitForSpacebar: false // False so they can keep shooting!
        }]);

        // Auto-close the text balloon after 8 seconds so it clears their screen
        this.time.delayedCall(8000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
                this.dialogue.next();
            }
        });

        // 2. Start a 10-second survival timer to deliver the Firewall
        this.time.delayedCall(10000, () => {
            this.triggerAds();
        });
    }

    triggerAds() { // Note: Removed 'currentTime' parameter if you fixed that earlier!
        this.currentPhase = 3;
        this.adsGivenTime = this.time.now;

        const cam = this.cameras.main;
        const isMobile = cam.width < 600;

        // --- 1. DYNAMIC AD SETTINGS ---
        const maxAds = isMobile ? 3 : 5;
        const snapDistance = isMobile ? 16 : 32; // Pixels to jump

        // We want the ad to cover ~25% of the screen area. 
        // That means the ad width should be roughly 50% of the screen width!
        const targetAdWidth = isMobile ? cam.width * 0.40 : cam.width * 0.25;

        // Minimum distance between ads to prevent heavy overlapping
        const minDistance = targetAdWidth * 0.7;

        this.adImages = [];
        const adKeys = ['ad_1', 'ad_2', 'ad_3'];

        // --- 2. SPAWN WITH ANTI-OVERLAP ---
        for (let i = 0; i < maxAds; i++) {
            // Loop through our 3 ad images (0, 1, 2, 0, 1...)
            let adKey = adKeys[i % adKeys.length];

            let randomX, randomY;
            let validPosition = false;
            let attempts = 0;

            // Keep picking random spots until we find one that isn't too close to another ad
            // (Max 15 attempts so the game doesn't freeze if the screen gets too full)
            while (!validPosition && attempts < 15) {
                randomX = Phaser.Math.Between(cam.width * 0.2, cam.width * 0.8);
                randomY = Phaser.Math.Between(cam.height * 0.2, cam.height * 0.8);
                validPosition = true;

                for (let existingAd of this.adImages) {
                    let dist = Phaser.Math.Distance.Between(randomX, randomY, existingAd.x, existingAd.y);
                    if (dist < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }

            // Create the ad and scale it to hit that sweet 25% screen coverage!
            let ad = this.add.image(randomX, randomY, adKey).setDepth(200);
            let scaleFactor = targetAdWidth / ad.width;
            ad.setScale(scaleFactor);

            // Save the original X position so we can snap back and forth from it
            ad.baseX = ad.x;
            this.adImages.push(ad);
        }

        // --- 3. THE SNAP GLITCH EFFECT ---
        // Every 300ms, teleport the ads to the right, or back to the left!
        this.adSnapTimer = this.time.addEvent({
            delay: 300,
            callback: () => {
                this.adImages.forEach(ad => {
                    if (ad && ad.active) {
                        ad.x = (ad.x === ad.baseX) ? ad.baseX + snapDistance : ad.baseX;
                    }
                });
            },
            callbackScope: this,
            loop: true
        });

        // --- 4. DIALOGUE ---
        this.dialogue.startDialogue([{
            character: 'James',
            text: "You won't believe it but the wild AI robots have developed some ads that can block your view... like seriously?...",
            waitForSpacebar: false
        }]);

        this.time.delayedCall(8000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'James') {
                this.dialogue.next();
            }
        });
    }

    triggerAdblocker() {
        this.currentPhase = 4; // Move to Phase 7

        // 1. Trigger Blonde Guy's Dialogue
        this.dialogue.startDialogue([{
            character: 'Robbin_comms',
            text: "We have built an adblocker for your ship, it will make quick work of these ads and get rid of them.",
            waitForSpacebar: false
        }]);

        // Auto-close text after 10 seconds
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
                this.dialogue.next();
            }
        });

        // 2. Wait exactly 2 seconds, then execute the Adblocker wipe!
        this.time.delayedCall(2000, () => {
            const cam = this.cameras.main;
            const isMobile = cam.width < 600;

            // --- FIXED: SCALING ---
            // Keep it normal size on mobile, but make it 3x larger on desktop
            let blockerIcon = this.add.image(cam.centerX, cam.centerY, 'adblocker_icon').setDepth(250);
            blockerIcon.setScale(isMobile ? 1 : 2);

            // 1. ANIMATION: Float up quickly with a nice little bounce
            this.tweens.add({
                targets: blockerIcon,
                y: cam.centerY - 50,
                duration: 1000,
                ease: 'Back.easeOut'
            });

            // 2. FADE OUT: Wait exactly 1.5 seconds, then fade away!
            this.tweens.add({
                targets: blockerIcon,
                alpha: 0,
                delay: 2000, // The 1.5-second wait!
                duration: 500, // Takes half a second to fade out
                onComplete: () => blockerIcon.destroy()
            });

            // Stop the snap effect timer so the ads stop vibrating
            if (this.adSnapTimer) this.adSnapTimer.remove();

            // Destroy the ads one by one with a 1-second delay between each
            this.adImages.forEach((ad, index) => {
                this.time.delayedCall(index * 1000, () => {
                    if (ad && ad.active) ad.destroy();
                });
            });

            this.adImages = [];
        });
    }

    triggerVirus(currentTime) {
        this.currentPhase = 5; // Move to Phase 4
        this.virusGivenTime = currentTime; // Start the 10-second survival clock
        this.controlsReversed = true; // Flip the controls!

        // Give the player a visual cue that something is wrong (glitch color)
        this.player.setTint(0xaa00ff);
        this.time.delayedCall(500, () => this.player.clearTint());

        // NEW: Trigger Stijn's warning dialogue!
        this.dialogue.startDialogue([{
            character: 'Stijn',
            text: "The wild AI robots have developed a computer virus that reverses your controls, watch out!",
            waitForSpacebar: false // False so they can keep trying to fly!
        }]);

        // Auto-close the text balloon after 10 seconds
        this.time.delayedCall(6000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Stijn') {
                this.dialogue.next(); // Dismiss the balloon
            }
        });
    }

    triggerAntivirus() {
        this.currentPhase = 6;

        // 1. Show the Comms Dialogue FIRST
        this.dialogue.startDialogue([{
            character: 'Robbin_comms',
            text: "We have built and sent an antivirus update for your spaceship!! This will turn your controls back to normal.",
            waitForSpacebar: false
        }]);

        // 2. BULLETPROOF AUTO-CLOSE
        this.time.delayedCall(10000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
                // Forcefully hide the box and clear the message!
                this.dialogue.uiContainer.setVisible(false);
                this.dialogue.currentMessage = null;
            }
        });

        // 3. Wait exactly 3 seconds, THEN apply the fix and show the central pop-up!
        this.time.delayedCall(3000, () => {
            this.controlsReversed = false; // Fix controls!
            this.hasAntivirus = true;
            this.antivirusGivenTime = this.time.now; // Start clock for the next phase

            const cam = this.cameras.main;
            const isMobile = cam.width < 600;

            // --- FIXED: THE CENTRAL POP-UP ---
            let antiPopup = this.add.image(cam.centerX, cam.centerY, 'antivirus_popup').setDepth(250);

            // Make the desktop icon smaller (Scale 2 instead of 3)
            antiPopup.setScale(isMobile ? 1 : 2);

            // 1. ANIMATION: Float up quickly
            this.tweens.add({
                targets: antiPopup,
                y: cam.centerY - 50,
                duration: 1000,
                ease: 'Back.easeOut'
            });

            // 2. FADE OUT: Wait exactly 1.5 seconds, then fade away!
            this.tweens.add({
                targets: antiPopup,
                alpha: 0,
                delay: 2000, // The 1.5-second wait!
                duration: 500,
                onComplete: () => antiPopup.destroy()
            });
        });
    }

    triggerFirewall() {
        this.currentPhase = 7;

        // 1. Show the Green Hoodie Guy dialogue FIRST
        this.dialogue.startDialogue([{
            character: 'James',
            text: "We have built a firewall shield for your spaceship to make it stronger and last longer!",
            waitForSpacebar: false
        }]);

        // 2. BULLETPROOF AUTO-CLOSE
        this.time.delayedCall(6000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'James') {
                this.dialogue.uiContainer.setVisible(false);
                this.dialogue.currentMessage = null;
            }
        });

        // 3. Wait exactly 3 seconds, THEN show the pop-up and fly it to the UI!
        this.time.delayedCall(3000, () => {
            this.hasFirewall = true;
            this.firewallGivenTime = this.time.now;

            const cam = this.cameras.main;
            const isMobile = cam.width < 600;

            // Spawn the giant pop-up in the center
            let shieldPopup = this.add.image(cam.centerX, cam.centerY, 'blue_shield').setDepth(250);
            shieldPopup.setScale(isMobile ? 1 : 2);

            // --- THE ARC TRAJECTORY MATH ---
            // Calculate roughly where the top-right UI area is
            const destX = cam.width - (cam.width * 0.05);
            const destY = cam.height * 0.08;

            // Shrink down to about 50% of its current size as it flies
            const targetScale = isMobile ? 0.5 : 1.0;

            // Animate it flying in a curve!
            this.tweens.add({
                targets: shieldPopup,
                x: { value: destX, ease: 'Linear' }, // Move right at a steady pace
                y: { value: destY, ease: 'Sine.easeOut' }, // Shoot up quickly, then level off (creates the arc!)
                scale: { value: targetScale, ease: 'Linear' }, // Shrink steadily
                duration: 1500, // Takes 1.5 seconds to make the trip
                onComplete: () => {
                    // 1. Destroy the flying pop-up now that it arrived
                    shieldPopup.destroy();

                    // 2. --- SPAWN THE 3 UI SHIELDS ---
                    this.activeShields = 3;

                    for (let i = 0; i < 3; i++) {
                        let shield = this.add.image(0, 0, 'blue_shield');
                        shield.setOrigin(1, 0.5);

                        this.shieldIcons.push(shield);
                        this.uiContainer.add(shield);
                    }

                    // 3. Force the UI to recalculate so the shields snap perfectly into place!
                    this.resizeUI();
                }
            });
        });
    }





    triggerFinalWave() {
        this.currentPhase = 8; // Move to Phase 8 (The Final Push)

        // 1. Triple the spawn rate! (Drop delay from 600ms to a frantic 200ms)
        if (this.spawnerTimer) this.spawnerTimer.remove();
        this.spawnerTimer = this.time.addEvent({ delay: 200, callback: this.spawnEnemy, callbackScope: this, loop: true });

        // 2. Wait 2 seconds, then start slowing it down
        this.time.delayedCall(4000, () => {

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
            character: 'Robbin_comms',
            text: "Phase 2 is now over! We have successfully evolved against the developments of the robots and scared them off!",
            waitForSpacebar: false // Locks the text on screen
        }]);

        // 2. Wait exactly 5 seconds, then close the victory dialogue
        this.time.delayedCall(5000, () => {

            // Forcefully hide the dialogue balloon
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
                this.dialogue.next();
            }

            // 3. Wait 3 seconds in absolute silence...
            this.time.delayedCall(3000, () => {

                // 4. Trigger Stijn's panic warning!
                this.dialogue.startDialogue([{
                    character: 'Stijn',
                    text: "Something is wrong... A very big object seems to be coming your way!!",
                    waitForSpacebar: false
                }]);

                // 5. Leave Stijn's warning on screen for 5 seconds to let the player read it, then close it
                this.time.delayedCall(5000, () => {

                    // Hide Stijn's dialogue balloon
                    if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Stijn') {
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
        this.boss = this.physics.add.sprite(cam.centerX, -150, 'boss');
        this.boss.setImmovable(true); // So player lasers don't physically push it backwards

        // --- NEW: SCALE THE BOSS ---
        // If your boss PNG is huge, you can scale it down here. 
        // Or, dynamically scale it so it always takes up about 30% of the screen width!
        const targetWidth = cam.width * 0.20;
        const scaleFactor = targetWidth / this.boss.width;
        this.boss.setScale(scaleFactor);

        // Keep the physics box tight around the scaled image
        this.boss.body.setSize(this.boss.width, this.boss.height);

        // 2. Setup Boss Collision
        this.physics.add.overlap(this.lasers, this.boss, this.hitBoss, null, this);

        // 3. Create the Boss UI (Hidden initially)
        this.bossUIContainer = this.add.container(0, 0).setDepth(105).setAlpha(0);

        const isMobile = cam.width < 600;

        // --- NEW: DYNAMIC HEALTH BAR SIZING ---
        // Save these to the class so other methods can read them when taking damage!
        this.bossBarWidth = isMobile ? cam.width * 0.8 : cam.width * 0.6; // 80% width on mobile, 60% on desktop
        this.bossBarHeight = isMobile ? 6 : 12; // Half as thick on mobile!

        const barX = cam.centerX - (this.bossBarWidth / 2);
        const barY = cam.height * 0.08; // Just below the top bar

        this.bossBarBg = this.add.rectangle(barX, barY, this.bossBarWidth, this.bossBarHeight, 0x333333).setOrigin(0, 0).setStrokeStyle(1, 0x000000);

        // Health Bar Fill (Red)
        this.bossBarFill = this.add.rectangle(barX, barY, this.bossBarWidth, this.bossBarHeight, 0xff0000).setOrigin(0, 0);

        // Boss Name Text
        this.bossNameText = this.add.text(cam.centerX, barY + this.bossBarHeight + (isMobile ? 2 : 4), "Final Wild AI Superboss XL", {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: isMobile ? '8px' : '12px', // Smaller font on mobile!
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
                    character: 'Robbin_comms',
                    text: "We did NOT see this coming!!... A final wild AI boss!! This is going to be hard to scare off! Team Future Ready will be on their way to help you!",
                    waitForSpacebar: false
                }]);

                // 3. Wait exactly 6 seconds before the chaos begins
                this.time.delayedCall(6000, () => {

                    // Dismiss the dialogue balloon
                    if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
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
        if (this.bossShootTimer) this.bossShootTimer.remove();

        // --- UPGRADE: FASTER FIRE RATE ---
        // 500ms in Phase 1, 350ms in Phase 2
        let currentDelay = this.phase2Triggered ? 550 : 550;

        this.bossShootTimer = this.time.addEvent({
            delay: currentDelay,
            callback: () => {
                if (!this.bossActive) return;

                if (this.phase2Triggered) {
                    // PHASE 2: Dual purple lasers from either side!
                    // Dynamically calculate the sides based on the boss's scaled width
                    let sideOffset = (this.boss.displayWidth / 2) * 0.8;

                    let laser1 = this.bossLasers.get(this.boss.x - sideOffset, this.boss.y + 20);
                    let laser2 = this.bossLasers.get(this.boss.x + sideOffset, this.boss.y + 20);

                    if (laser1) {
                        // Apply mobile scaling to the lasers!
                        laser1.setActive(true).setVisible(true).setTint(0xff00ff).setScale(this.entityScale);
                        this.physics.moveToObject(laser1, this.player, 550);
                    }
                    if (laser2) {
                        laser2.setActive(true).setVisible(true).setTint(0xff00ff).setScale(this.entityScale);
                        this.physics.moveToObject(laser2, this.player, 550);
                    }
                } else {
                    // PHASE 1: Standard single orange laser
                    let laser = this.bossLasers.get(this.boss.x, this.boss.y + 50);
                    if (laser) {
                        // Apply mobile scaling to the lasers!
                        laser.setActive(true).setVisible(true).clearTint().setScale(this.entityScale);
                        this.physics.moveToObject(laser, this.player, 400);
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    hitBoss(object1, object2) {
        if (!this.bossActive) return;

        let laser = (object1.texture && object1.texture.key === 'laser') ? object1 : object2;
        let boss = (object1.texture && object1.texture.key === 'boss') ? object1 : object2;

        // --- NEW: SHIELD BLOCKS AND DESTROYS LASERS ---
        if (this.bossShielded) {
            if (laser && laser.active) {
                laser.destroy(); // Break the laser!

                // Flash the shield bright white for a split second to show impact
                if (this.bossShieldVisual) {
                    this.bossShieldVisual.setAlpha(0.4);
                    this.time.delayedCall(50, () => {
                        if (this.bossShieldVisual) this.bossShieldVisual.setAlpha(1);
                    });
                }
            }
            return; // Exit early so the boss takes no damage!
        }

        // ... (Keep the rest of your hitBoss logic exactly the same below this) ...
        if (laser && laser.active) {
            laser.destroy();
        }

        this.bossHealth -= 1;

        boss.setTint(0xffaaaa);
        boss.setAlpha(0.7);

        this.time.delayedCall(50, () => {
            if (boss && boss.active) {
                boss.clearTint();
                boss.setAlpha(1);
            }
        });

        const healthPercent = Math.max(0, this.bossHealth / this.bossMaxHealth);

        // --- FIXED: USE DYNAMIC WIDTH AND HEIGHT ---
        this.bossBarFill.setSize(this.bossBarWidth * healthPercent, this.bossBarHeight);

        // --- UPGRADE: TRIGGER PHASE 2 AT 5% HEALTH ---
        if (!this.phase2Triggered && this.bossHealth <= (this.bossMaxHealth * 0.05)) {
            this.triggerBossPhase2();
        }

        if (this.bossHealth <= 0) {
            this.bossActive = false;

            if (this.bossShootTimer) this.bossShootTimer.remove();
            if (this.helperShootTimer) this.helperShootTimer.remove();

            this.tweens.killTweensOf(this.boss);
            this.bossUIContainer.setVisible(false);

            this.triggerDefeatSequence();
        }
    }

    hitShield(shieldZone, laser) {
        if (!this.bossShielded) return;

        // Destroy the laser exactly where it touches the shield radius!
        if (laser && laser.active) {
            laser.destroy();

            // Flash the visual arc to show impact
            if (this.bossShieldVisual) {
                this.bossShieldVisual.setAlpha(0.4);
                this.time.delayedCall(50, () => {
                    if (this.bossShieldVisual) this.bossShieldVisual.setAlpha(1);
                });
            }
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
        this.bossActive = false;
        this.bossShielded = true;

        if (this.bossShootTimer) this.bossShootTimer.remove();

        // --- UPGRADE: CURVED SHIELD ---
        this.bossShieldVisual = this.add.graphics().setDepth(6);
        this.bossShieldVisual.lineStyle(8, 0x00ffff, 0.9); // 8px thick glowing cyan line
        this.bossShieldVisual.beginPath();

        // Draw an arc spanning the bottom of the boss (from 45 degrees to 135 degrees)
        let shieldRadius = (this.boss.displayWidth / 2) + 80;
        this.bossShieldVisual.arc(0, 0, shieldRadius, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
        this.bossShieldVisual.strokePath();

        // Anchor the graphic to the boss's position
        this.bossShieldVisual.setPosition(this.boss.x, this.boss.y);

        // --- NEW: INVISIBLE PHYSICS SHIELD ZONE ---
        // Create an invisible physics zone that is exactly the size of the shield radius
        this.bossShieldZone = this.add.zone(this.boss.x, this.boss.y, shieldRadius * 2, shieldRadius * 2);
        this.physics.add.existing(this.bossShieldZone);
        this.bossShieldZone.body.setCircle(shieldRadius);

        // Tell the physics engine: If a laser touches this zone, run the hitShield function!
        this.physics.add.overlap(this.lasers, this.bossShieldZone, this.hitShield, null, this);

        // --- UPGRADE: REGENERATE HEALTH BAR ---
        // Slowly fill the health bar back to 100% over 5 seconds while they talk
        this.tweens.addCounter({
            from: this.bossHealth,
            to: this.bossMaxHealth,
            duration: 15000,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                this.bossHealth = tween.getValue();
                const healthPercent = Math.max(0, this.bossHealth / this.bossMaxHealth);

                // --- FIXED: USE DYNAMIC SIZING ---
                this.bossBarFill.setSize(this.bossBarWidth * healthPercent, this.bossBarHeight);
            }
        });

        // 2. Trigger the HQ Dialogue
        this.dialogue.startDialogue([{
            character: 'Robbin_comms',
            text: "Stijn and James have come to help you with their spaceships! It's time to scale up with the upgrades they have brought for your spaceship!",
            waitForSpacebar: false
        }]);

        // 3. Wait 6 seconds, clear dialogue, and bring in the helper ships!
        this.time.delayedCall(6000, () => {
            if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Robbin_comms') {
                this.dialogue.next();
            }

            const cam = this.cameras.main;

            // --- UPGRADE: SCALE THE HELPER SHIPS FOR MOBILE ---
            let helperBlue = this.add.sprite(cam.width * 0.3, cam.height + 50, 'Helper ship blue boost').setDepth(9);
            helperBlue.setScale(this.entityScale);

            let helperPurple = this.add.sprite(cam.width * 0.7, cam.height + 50, 'Helper ship purple boost').setDepth(9);
            helperPurple.setScale(this.entityScale);

            this.helperShips = [helperBlue, helperPurple];

            this.tweens.add({
                targets: this.helperShips,
                y: cam.height * 0.75,
                duration: 2500,
                ease: 'Sine.easeOut',
                onComplete: () => {

                    this.tweens.add({
                        targets: this.helperShips,
                        x: '+=60',
                        duration: 2000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    this.dialogue.startDialogue([{
                        character: 'Stijn_spacesuit',
                        character2: 'James_spacesuit',
                        text: "We have stronger blasters and more powerful thrusters for your spaceship! And of course are we here to help!",
                        waitForSpacebar: false
                    }]);

                    this.time.delayedCall(5000, () => {
                        if (this.dialogue.currentMessage && this.dialogue.currentMessage.character === 'Stijn_spacesuit') {
                            this.dialogue.next();
                        }

                        // APPLY UPGRADES!
                        this.player.setTexture('player ship upgraded');
                        this.isShipUpgraded = true;
                        this.playerSpeed = 500;
                        this.hasDoubleLaser = true;

                        // DROP BOSS SHIELD
                        this.bossShieldVisual.destroy();
                        if (this.bossShieldZone) this.bossShieldZone.destroy(); // Destroy the physics hitbox!
                        this.bossShielded = false;

                        // RESUME BOSS ATTACKS
                        this.bossActive = true;
                        this.startBossAttacks();

                        // --- FIXED: PERFECTLY CENTERED BOSS DRIFT ---
                        // Instead of hardcoding 150 pixels, move 25% of the screen width!
                        let driftDistance = cam.width * 0.25;

                        // 1. Swing to the left first to start the momentum
                        this.tweens.add({
                            targets: this.boss,
                            x: cam.centerX - driftDistance,
                            duration: 1250,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                // 2. Now swing all the way across to the right, and back forever!
                                this.tweens.add({
                                    targets: this.boss,
                                    x: cam.centerX + driftDistance,
                                    duration: 2500,
                                    yoyo: true,
                                    repeat: -1,
                                    ease: 'Sine.easeInOut'
                                });
                            }
                        });

                        this.helperShootTimer = this.time.addEvent({
                            delay: 2500,
                            callback: () => {
                                if (!this.bossActive || this.bossShielded) return;

                                this.helperShips.forEach(ship => {
                                    let laser = this.lasers.get(ship.x, ship.y - 20);
                                    if (laser) {
                                        // Apply mobile scaling to helper lasers too!
                                        laser.setActive(true).setVisible(true).setScale(this.entityScale).setTint(0x00ffff);
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

        // --- NEW: FORCE BOOSTERS ON FOR THE CUTSCENE ---
        this.player.setTexture(this.isShipUpgraded ? 'player ship upgraded boost' : 'player ship boost');

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
                        character: 'Stijn_spacesuit',
                        character2: 'James_spacesuit',
                        text: "Yes!! You did it! The final wild AI boss has been scared off, time for us to head back to Earth!",
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
                    fontFamily: '"Press Start 2P", Courier, monospace',
                    fontSize: '24px',
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

    triggerGameOver() {
        // 1. Lock the game and stop everything
        this.currentPhase = 99; // Disables keyboard movement
        this.input.keyboard.enabled = false;
        this.physics.pause(); // Freezes the player, enemies, and lasers
        this.player.setTint(0xff0000); // Keep the ship visually damaged

        // Stop the enemy spawners and boss timers just in case!
        if (this.spawnerTimer) this.spawnerTimer.remove();
        if (this.bossShootTimer) this.bossShootTimer.remove();

        const cam = this.cameras.main;

        // 2. Create the Game Over UI Container
        this.gameOverContainer = this.add.container(0, 0).setDepth(300).setAlpha(0);

        // Dark semi-transparent background to dim the gameplay
        let bg = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.8).setOrigin(0, 0);

        // "GAME OVER" Title
        let title = this.add.text(cam.centerX, cam.centerY - 100, "GAME OVER", {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Display the Final Score
        let scoreText = this.add.text(cam.centerX, cam.centerY - 20, `FINAL SCORE: ${this.score}`, {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.gameOverContainer.add([bg, title, scoreText]);

        // 3. Helper function to create the buttons (Reusing your PartyScene logic!)
        const createBtn = (x, y, label, callback) => {
            let container = this.add.container(x, y);

            // Draw a blue button box with a white border
            let btnBg = this.add.rectangle(0, 0, 160, 45, 0x0088ff).setInteractive({ useHandCursor: true });
            btnBg.setStrokeStyle(2, 0xffffff);

            let text = this.add.text(0, 0, label, { fontFamily: '"Press Start 2P", Courier', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

            container.add([btnBg, text]);

            // Hover effects
            btnBg.on('pointerover', () => btnBg.setFillStyle(0x00ffff));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x0088ff));
            btnBg.on('pointerdown', () => {
                btnBg.setFillStyle(0x00aa00);
                callback();
            });

            this.gameOverContainer.add(container);
        };

        // 4. Create the two buttons
        createBtn(cam.centerX - 100, cam.centerY + 60, "TRY AGAIN", () => {
            console.log("Quick Restart Initiated from Game Over!");
            // Drop them straight back into the action!
            this.scene.start('MainScene', {
                playerName: this.playerName,
                skipTutorial: true
            });
        });

        createBtn(cam.centerX + 100, cam.centerY + 60, "EXIT GAME", () => {
            console.log("Exiting to Main Menu from Game Over...");
            // Bring the HTML Title Screen back and destroy the game session
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'flex';
            }
            this.game.destroy(true);
            window.location.reload();
        });

        // 5. Fade the entire overlay in dramatically over 1 second
        this.tweens.add({
            targets: this.gameOverContainer,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
    }

    update(time, delta) {
        this.player.setVelocity(0);
        let isMoving = false; // We are bringing this back!
        let isShooting = false;

        let currentSpeed = this.controlsReversed ? -this.playerSpeed : this.playerSpeed;

        if (this.currentPhase !== 99) {

            // --- KEYBOARD CONTROLS ---
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

                    // CHANGED: Use pointer.downX to check where the touch STARTED, 
                    // instead of pointer.x (where the finger is currently).
                    if (pointer.downX < this.cameras.main.width / 2) {

                        // Calculate how far the finger has dragged from its original tap position
                        let dragX = pointer.x - pointer.downX;
                        let dragY = pointer.y - pointer.downY;
                        let dragDistance = Math.sqrt(dragX * dragX + dragY * dragY);

                        // If they dragged their finger far enough to register intent (a 10px "deadzone")
                        if (dragDistance > 10) {
                            isMoving = true;

                            // Normalize the vector (find the direction) and multiply by player speed
                            let velocityX = (dragX / dragDistance) * this.playerSpeed;
                            let velocityY = (dragY / dragDistance) * this.playerSpeed;

                            if (this.controlsReversed) {
                                velocityX *= -1;
                                velocityY *= -1;
                            }

                            this.player.setVelocity(velocityX, velocityY);
                        } else {
                            // The finger is just resting on the tap point, so hover in place
                            this.player.setVelocity(0);
                        }
                    }

                    // Right half of the screen handles shooting
                    if (pointer.downX >= this.cameras.main.width / 2) {
                        isShooting = true;
                    }
                }
            });
        }

        // --- TUTORIAL PROGRESSION LOGIC ---
        if (this.tutorialState === 'movement') {
            if (this.isTouch) {
                // Touch Progression
                let touchingLeft = this.input.manager.pointers.some(p => p.isDown && p.x < this.cameras.main.width / 2);
                if (touchingLeft && !this.keysPressed.W) {
                    this.keysPressed.W = true; // Use W flag as a generic "moved" flag
                    this.visualKeys.leftText.setColor('#00ff00'); // Turn green

                    this.time.delayedCall(1000, () => {
                        this.tutorialState = 'shooting';
                        this.visualKeys.rightText.setVisible(true);
                        this.dialogue.startDialogue([{
                            character: 'Robbin_comms',
                            text: "Excellent maneuvering! Now tap or hold the right side to test the lasers!",
                            waitForSpacebar: false
                        }]);
                    });
                }
            } else {
                // Desktop Progression (Keep your existing WASD check here)
                if ((this.wasd.W.isDown || this.cursors.up.isDown) && !this.keysPressed.W) { this.keysPressed.W = true; this.visualKeys.W.setFillStyle(0x00ff00); }
                if ((this.wasd.A.isDown || this.cursors.left.isDown) && !this.keysPressed.A) { this.keysPressed.A = true; this.visualKeys.A.setFillStyle(0x00ff00); }
                if ((this.wasd.S.isDown || this.cursors.down.isDown) && !this.keysPressed.S) { this.keysPressed.S = true; this.visualKeys.S.setFillStyle(0x00ff00); }
                if ((this.wasd.D.isDown || this.cursors.right.isDown) && !this.keysPressed.D) { this.keysPressed.D = true; this.visualKeys.D.setFillStyle(0x00ff00); }

                if (this.keysPressed.W && this.keysPressed.A && this.keysPressed.S && this.keysPressed.D) {
                    this.tutorialState = 'shooting';
                    this.visualKeys.SPACE.setVisible(true);
                    this.tutorialUI.getAt(9).setVisible(true);
                    this.dialogue.startDialogue([{
                        character: 'Robbin_comms',
                        text: "Excellent maneuvering! Now press spacebar to test the laser blasters!",
                        waitForSpacebar: false
                    }]);
                }
            }
        } else if (this.tutorialState === 'shooting') {
            if (this.isTouch) {
                // Touch Progression
                let touchingRight = this.input.manager.pointers.some(p => p.isDown && p.x >= this.cameras.main.width / 2);
                if (touchingRight && !this.keysPressed.SPACE) {
                    this.keysPressed.SPACE = true;
                    this.tutorialState = 'done';
                    this.visualKeys.rightText.setColor('#00ff00');

                    this.time.delayedCall(2000, () => {
                        this.tutorialUI.destroy();
                        this.startGameplay();
                    });
                }
            } else {
                // Desktop Progression (Keep your existing spacebar check here)
                if (this.spacebar.isDown) {
                    this.tutorialState = 'done';
                    this.visualKeys.SPACE.setFillStyle(0x00ff00);
                    this.time.delayedCall(2000, () => {
                        this.tutorialUI.destroy();
                        this.startGameplay();
                    });
                }
            }
        }

        // --- MOVEMENT RESTRICTIONS (THE INVISIBLE BOUNDARIES) ---
        // 1. Calculate the limits based on the current canvas height
        const isMobile = this.cameras.main.width < 600;

        const minY = this.cameras.main.height * 0.45; // Cannot go higher than the top 45% mark

        // --- FIX: RAISED BOTTOM BOUNDARY FOR MOBILE ---
        // On mobile, the dialogue box is taller. We restrict the ship to the top 70% 
        // of the screen so it never slips behind the text box! On desktop, 80% is still fine.
        const maxY = isMobile ? this.cameras.main.height * 0.77 : this.cameras.main.height * 0.80;

        // --- PHASE MANAGER PROGRESSION ---
        // Phase 1 to Phase 2 (Trigger AI Cloning when 5 enemies are defeated and 10s have passed)
        if (this.currentPhase === 1 && this.spawnerTimer) {
            let timePassed = time - this.gameplayStartTime;
            if (this.enemiesDefeated >= 5 && timePassed >= 10000) {
                this.triggerAICloning();
            }
        }

        // Phase 3 to Phase 4 (Trigger Adblocker 10 seconds after Ads spawn)
        if (this.currentPhase === 3 && this.adsGivenTime > 0) {
            if (time - this.adsGivenTime >= 10000) {
                this.triggerAdblocker();
            }
        }

        // Phase 4 to Phase 5 (Trigger Virus 10 seconds after Adblocker finishes)
        // We use a delayed call inside triggerAdblocker() to start the virus, 
        // OR we can trigger it here by saving the time the adblocker started!
        // To keep it clean in the update loop, let's add a quick tracker:
        if (this.currentPhase === 4) {
            if (!this.adblockerGivenTime) this.adblockerGivenTime = time; // Save the time Phase 4 started
            if (time - this.adblockerGivenTime >= 10000) {
                this.triggerVirus(time);
            }
        }

        // Phase 5 to Phase 6 (Trigger Antivirus 10 seconds after Virus starts)
        if (this.currentPhase === 5 && this.virusGivenTime > 0) {
            if (time - this.virusGivenTime >= 10000) {
                this.triggerAntivirus();
            }
        }

        // Phase 6 to Phase 7 (Trigger Firewall 15 seconds after Antivirus)
        if (this.currentPhase === 6 && this.antivirusGivenTime > 0) {
            if (time - this.antivirusGivenTime >= 15000) {
                this.triggerFirewall();
            }
        }

        // Phase 7 to Phase 8 (Trigger Final Wave 10 seconds after Firewall)
        if (this.currentPhase === 7 && this.firewallGivenTime > 0) {
            if (time - this.firewallGivenTime >= 10000) {
                this.triggerFinalWave();
            }
        }

        // 2. Clamp the player's vertical position (ONLY IF NOT IN THE FINALE)
        if (this.currentPhase !== 99) {
            if (this.player.y < minY) {
                this.player.y = minY;
            } else if (this.player.y > maxY) {
                this.player.y = maxY;
            }
        }
        // --- NEW: DYNAMIC BOOSTER TEXTURES ---
        // ONLY update textures based on input if we are NOT in the finale!
        if (this.currentPhase !== 99) {
            if (isMoving) {
                if (this.isShipUpgraded) {
                    this.player.setTexture('player ship upgraded boost');
                } else {
                    this.player.setTexture('player ship boost');
                }
            }
            else {
                if (this.isShipUpgraded) {
                    this.player.setTexture('player ship upgraded');
                } else {
                    this.player.setTexture('player ship');
                }
            }
        }

        // --- NEW: KEEP BOSS SHIELD ATTACHED ---
        // Because the boss drifts left and right, the shield graphic and physics zone need to follow it!
        if (this.bossShielded && this.bossShieldVisual && this.boss) {
            this.bossShieldVisual.setPosition(this.boss.x, this.boss.y);

            // Move the invisible physics hitbox too!
            if (this.bossShieldZone) {
                this.bossShieldZone.setPosition(this.boss.x, this.boss.y);
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

    preload() {
        this.load.image('party_bg_1', 'assets/party_bg_1.png');
        this.load.image('party_bg_2', 'assets/party_bg_2.png');

        this.load.image('Robbin', 'assets/Robbin.png');
        this.load.image('Robbin_comms', 'assets/Robbin_comms.png'); // Maybe a holographic version?

        // Load the UI panel backgrounds if you have them ready! 
        // If not, you can leave the graphics generators for the UI in the create() method.
        // this.load.image('leaderboard_bg', 'assets/leaderboard_bg.png');
        // this.load.image('btn_bg', 'assets/btn_bg.png');
    }

    create() {
        const cam = this.cameras.main;

        // --- 1. GENERATE PLACEHOLDER TEXTURES ---
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });

        // Leaderboard Panel
        gfx.fillStyle(0x222222, 0.9).fillRoundedRect(0, 0, 600, 300, 16);
        gfx.lineStyle(4, 0x00ffff, 1).strokeRoundedRect(0, 0, 600, 300, 16);
        gfx.generateTexture('leaderboard_bg', 600, 300);
        gfx.clear();

        // Button Background
        gfx.fillStyle(0x0088ff, 1).fillRoundedRect(0, 0, 120, 40, 8);
        gfx.generateTexture('btn_bg', 200, 40);
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

        // --- NEW: SMART SCALING INSTEAD OF STRETCHING ---
        // Calculate the scale needed to cover the screen proportionally
        const scaleX = cam.width / this.bg.width;
        const scaleY = cam.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale);

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
                character: 'Robbin',
                text: "Awesome! The wild AI robots have been scared off, thank you for your help!",
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
        let title = this.add.text(0, -120, "TOP PILOTS", { fontFamily: '"Press Start 2P",Courier', fontSize: '20px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);

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
                fontFamily: '"Press Start 2P", Courier',
                fontSize: '16px',
                color: textColor,
                fontStyle: isCurrentPlayer ? 'bold' : 'normal'
            }).setOrigin(0.5);

            this.lbContainer.add(row);
        }

        // Draw a separator line
        let line = this.add.rectangle(0, 80, 300, 2, 0x555555);

        // Show the player's personal placement at the bottom
        let personalText = this.add.text(0, 110, `YOUR RANK: #${playerRank} | SCORE: ${this.finalScore}`, {
            fontFamily: '"Press Start 2P",Courier',
            fontSize: '14px',
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
                        character: 'Robbin',
                        text: "Thank you for playing!",
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
            let text = this.add.text(0, 0, label, { fontFamily: '"Press Start 2P", Courier', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

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
            navigator.clipboard.writeText(`I just scored ${this.finalScore} defending Earth with Future Ready! Can you beat me? https://thimogagliano.github.io/TechInvadersFRGame/`);
            alert("Score copied to clipboard with a link to the game! Ready to share!");
        });

        createBtn(cam.centerX, "PLAY AGAIN", () => {
            console.log("Quick Restart Initiated!");

            // Send them STRAIGHT to the action with their name and a skip flag!
            this.scene.start('MainScene', {
                playerName: this.playerName,
                skipTutorial: true
            });
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
    width: '100%',
    height: '100%',
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