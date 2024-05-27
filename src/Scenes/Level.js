class Level extends Phaser.Scene {
    constructor() {
        super("levelScene");
    }

    init() {
        // variables and settings
        this.game_active = true;
        this.spawn = [30, 200];
        this.spawn_offset = 10;
        this.SCALE = 2;
        this.ACCELERATION = 100;
        this.MAX_VELOCITY = 100;
        this.PARTICLE_VELOCITY = 50;
        this.DRAG = 400;
        this.BOX_DRAG = 50;
        this.physics.world.gravity.y = 750;
        this.jumping = false;
        this.falling = false;
        this.box_falling = false;
        this.box_was_falling = false;
        this.on_wood = false;
        this.was_jumping = false;
        this.JUMP_ACCELERATION = -1250;
        this.JUMP_VELOCITY = -140;
        this.MAX_JUMP_VELOCITY = -215;
        this.COYOTE_TIME = 6; // frames of coyote time (allowed jumping when technically in air)
        this.coyote_counter = 0;
        this.souls_collected = 0;
        this.deaths = 0;
    }

    create() {
        // Create a new tilemap game object which uses 16x16 pixel tiles, and is
        // 96 tiles wide and 18 tiles tall.
        this.map = this.add.tilemap("tiled_level", 16, 16, 96, 18);
        this.physics.world.setBounds(0, 0, 96*16 , 18*16);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("MonochromeTileset", "tilemap_tiles");

        // Create layers
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        // Make ground collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.decorLayer = this.map.createLayer("Trees-n-Decor", this.tileset, 0, 0);

        // Sounds
        this.main_ambiance = this.sound.add('ambiance', { volume: 0.5, loop: true });
        this.main_ambiance.play();
        this.drip_ambiance = this.sound.add('drip_ambiance', { volume: 0.5, loop: true });
        this.drip_ambiance.play();
        this.ground_steps = this.sound.add('impact_ground', { volume: 0.05, delay: 0.8, loop: true });
        this.wood_steps = this.sound.add('impact_wood', { volume: 0.1, delay: 0.1, loop: true });
        this.push_box = this.sound.add('push_box', { volume: 0.2, loop: true });

        // Player
        my.sprite.player = this.physics.add.sprite(this.spawn[0], this.spawn[1], "character", "tile_01.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(this.MAX_VELOCITY, this.physics.world.gravity.y);
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Text
        this.topBar = this.add.rectangle(0, -12, game.config.width*2, 12, '#000000').setOrigin(0, 0);
        this.titleText = this.add.bitmapText(game.config.width/2, 155, "blocks", "Abercage", 12).setScrollFactor(0).setOrigin(0.5).setCenterAlign();
        this.scoreText = this.add.bitmapText(265, 150, "mini", this.souls_collected + "/8 Souls", 12).setScrollFactor(0);
        this.restartText = this.add.bitmapText(720, 150, "mini", "Restart", 12).setScrollFactor(0).setInteractive();
        this.restartText.on('pointerdown', () => {
            this.main_ambiance.stop();
            this.drip_ambiance.stop();
            this.init();
            this.scene.restart();
        });

        // Create objects
        // Spikes
        this.spikes = this.map.createFromObjects("Spikes", { name: "spike" });
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);
        this.spikeGroup = this.add.group(this.spikes);
        for (let spike of this.spikeGroup.getChildren()) {
            this.physics.add.collider(my.sprite.player, spike, (obj1, obj2) => {
                this.sound.play('land_spikes');
                this.deaths++;
                obj1.x = this.spawn[0];
                obj1.y = this.spawn[1];
            });
            spike.setTexture(undefined);
        }

        // Souls
        this.souls = this.map.createFromObjects("Souls", { name: "soul", key: "tilemap_sheet", frame: 20 });
        this.physics.world.enable(this.souls, Phaser.Physics.Arcade.STATIC_BODY); // TODO: Souls float up and down
        this.soulGroup = this.add.group(this.souls);
        // Handle collision detection with souls
        this.physics.add.overlap(my.sprite.player, this.soulGroup, (obj1, obj2) => {
            this.sound.play('collect');
            this.souls_collected++;
            this.scoreText.setText(this.souls_collected + "/8 Souls");
            obj2.destroy(); 
        });

        // Boxes
        this.boxes = this.map.createFromObjects("Boxes", { classType: Phaser.Physics.Arcade.Sprite, name: "box", key: "tilemap_sheet", frame: 10 });
        this.physics.world.enable(this.boxes, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.boxGroup = this.add.group(this.boxes);
        for (let box of this.boxGroup.getChildren()) {
            this.physics.add.collider(box, this.groundLayer);
            this.physics.add.collider(box, my.sprite.player, () => { 
                if (my.sprite.player.body.touching.down) {
                    this.on_wood = true;
                }
            });
            this.physics.add.collider(box, this.spikes);
            box.setPushable(true);
            box.setDragX(this.BOX_DRAG);
        }

        // Platform colliders
        this.colliders = this.map.createFromObjects("Colliders", { name: "collider" });
        this.physics.world.enable(this.colliders, Phaser.Physics.Arcade.STATIC_BODY);
        this.colliderGroup = this.add.group(this.colliders);
        for (let collider of this.colliderGroup.getChildren()) {
            this.physics.add.collider(collider, my.sprite.player, () => { this.on_wood = true; });
            collider.setTexture(undefined);
        }

        // Checkpoints
        this.checkpoints = this.map.createFromObjects("Checkpoints", { name: "checkpoint" });
        this.physics.world.enable(this.checkpoints, Phaser.Physics.Arcade.STATIC_BODY);
        this.checkpointGroup = this.add.group(this.checkpoints);
        for (let checkpoint of this.checkpointGroup.getChildren()) {
            this.physics.add.overlap(checkpoint, my.sprite.player, (obj1, obj2) => {
                if (this.spawn[0] < obj1.x) {
                    this.sound.play('checkpoint');
                    // TODO: PARTICLES
                    console.log("set new checkpoint");
                    this.spawn[0] = obj1.x + this.spawn_offset;
                    this.spawn[1] = obj1.y + this.spawn_offset;
                }
            });
            checkpoint.setTexture(undefined);
        }

        // VFX
        my.vfx.walk = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_05.png'],
            // TODO: Try: add random: true
            random: true,
            scale: 0.01,
            maxAliveParticles: 3,
            lifespan: 100,
            alpha: { start: 1, end: 0 }
        });
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_05.png'],
            angle: { min: -180, max: 0 },
            scale: 0.025,
            speed: 10,
            lifespan: 400,
            alpha: { start: 1, end: 0}
        });

        // Win Screen
        this.winPanel = this.add.rectangle(game.config.width/2, game.config.height/2-12, 200, 100, '#000000').setScrollFactor(0);
        this.winText = this.add.bitmapText(game.config.width/2, game.config.height/2-30, "blocks", "Level Complete", 20).setScrollFactor(0).setOrigin(0.5).setCenterAlign();
        this.deathsText = this.add.bitmapText(game.config.width/2, game.config.height/2+6, "mini", "You died "+this.deaths+" times.", 14).setScrollFactor(0).setOrigin(0.5).setCenterAlign();
        this.winPanel.visible = false;
        this.winText.visible = false;
        this.deathsText.visible = false;

        // Camera
        this.cameras.main.setBounds(0, -12, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Keys
        this.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
    }

    update() {
        if (!this.game_active) { return; }
        // ------------ LEFT/RIGHT MOVEMENT ------------ //
        if(this.left.isDown) {
            if (!my.sprite.player.body.touching.left) { this.push_box.stop(); }

            if (this.on_wood && !this.wood_steps.isPlaying && !this.was_jumping) {
                this.wood_steps.play();
                this.ground_steps.stop();
            } else if (!this.on_wood && !this.ground_steps.isPlaying && !this.was_jumping) {
                this.ground_steps.play();
                this.wood_steps.stop();
            }

            if (my.sprite.player.body.velocity.x > 0) {
                my.sprite.player.body.setAccelerationX(-this.DRAG);
            } else {
                my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            }
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            my.vfx.walk.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-1, false);
            my.vfx.walk.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down || my.sprite.player.body.touching.down) {
                my.vfx.walk.start();
            }
            

        } else if(this.right.isDown) {
            if (!my.sprite.player.body.touching.right) { this.push_box.stop(); }

            if (this.on_wood && !this.wood_steps.isPlaying && !this.was_jumping) {
                this.wood_steps.play();
                this.ground_steps.stop();
            } else if (!this.on_wood && !this.ground_steps.isPlaying && !this.was_jumping) {
                this.ground_steps.play();
                this.wood_steps.stop();
            }

            if (my.sprite.player.body.velocity.x < 0) {
                my.sprite.player.body.setAccelerationX(this.DRAG);
            } else {
                my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            }
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            my.vfx.walk.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-1, false);
            my.vfx.walk.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down || my.sprite.player.body.touching.down) {
                my.vfx.walk.start();
            }
            
        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            this.wood_steps.stop();
            this.ground_steps.stop();
            this.push_box.stop();
            my.vfx.walk.stop();
        }
        
        // ------------------ JUMPING ------------------ //
        if (my.sprite.player.body.blocked.down && !this.jumping && this.was_jumping) {
            this.coyote_counter = this.COYOTE_TIME; // Reset coyote time if on ground
            this.was_jumping = false;
        } else if (this.was_jumping && !my.sprite.player.body.touching.down) {
            my.sprite.player.anims.play('jump');
        }
        if (!my.sprite.player.body.blocked.down && !my.sprite.player.body.touching.down) {
            my.vfx.jump.stop();
            if (this.coyote_counter > 0) { this.coyote_counter--; } // Count down coyote time if in air
            if (my.sprite.player.body.velocity.y > 50) { 
                my.sprite.player.anims.play('fall'); // If falling
                this.falling = true;
                this.wood_steps.stop();
                this.ground_steps.stop();
                this.push_box.stop();
            };
        } else if (this.falling) {
            this.falling = false;
            let rand_vol = Math.random() * (1 - 0.5) + 0.2; // Random val between 0.5 and 1
            if (this.on_wood) {
                this.sound.play('impact_wood', { volume: rand_vol });
            } else {
                this.sound.play('impact_ground', { volume: rand_vol });
            }
        }
        if (((my.sprite.player.body.blocked.down || my.sprite.player.body.touching.down) || this.coyote_counter > 0) && Phaser.Input.Keyboard.JustDown(this.up)) {
            this.sound.play('jump');
            this.wood_steps.stop();
            this.ground_steps.stop();
            this.push_box.stop();
            my.vfx.walk.stop();
            my.vfx.jump.x = my.sprite.player.x;
            my.vfx.jump.y = my.sprite.player.y+5;
            my.vfx.jump.start();
            this.jumping = true;
            this.was_jumping = true;
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }
        if (!my.sprite.player.body.blocked.up && this.jumping && this.up.isDown && my.sprite.player.body.velocity.y > this.MAX_JUMP_VELOCITY) {
            my.sprite.player.body.setAccelerationY(this.JUMP_ACCELERATION);
        } else {
            my.sprite.player.body.setAccelerationY(0);
            this.jumping = false;
        }
        if (!my.sprite.player.body.touching.down && this.on_wood) { this.on_wood = false; }
        
        // ----------------- COLLISION ------------------ //
        this.box_falling = false;
        for (let box of this.boxGroup.getChildren()) {
            if (box.body.touching.up) {
                box.setPushable(false);
            } else {
                box.setPushable(true);
            }
            if (box.body.velocity.x != 0 && !this.push_box.isPlaying) {
                this.push_box.play();
            }
            if (box.body.velocity.y > 0 && !box.body.blocked.down) {
                this.box_falling = true;
                this.box_was_falling = true;
            }
        }
        if (this.box_falling == false && this.box_was_falling) {
            this.box_was_falling = false;
            this.sound.play('impact_wood');
        }

        // -------------- ANIMATED SOULS --------------- //
        for (let soul of this.soulGroup.getChildren()) {
            soul.rotation += 0.05;
        }  

        // ----------- END LEVEL CONDITION ----------- //
        if (my.sprite.player.x == 1528 && this.souls_collected == 8) {
            this.sound.play('checkpoint');
            this.deathsText.setText("You died "+this.deaths+" times.");
            this.game_active = false;
            this.winPanel.visible = true;
            this.winText.visible = true;
            this.deathsText.visible = true;
            this.ground_steps.stop();
            my.sprite.player.anims.play('idle');
            my.vfx.walk.stop();
        }
    }
}