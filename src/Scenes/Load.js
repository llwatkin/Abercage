class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load character spritesheet
        this.load.atlas("character", "character_packed.png", "character.json");
        // Load tilemap information
        this.load.image("tilemap_tiles", "monochrome_tilemap_transparent_packed.png"); // Packed tilemap
        this.load.tilemapTiledJSON("tiled_level", "TiledMap.tmj"); // Tilemap in JSON
        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "monochrome_tilemap_transparent_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load audio
        this.load.setPath("./assets/audio");
        this.load.audio("ambiance", "ambiance.mp3");
        this.load.audio("drip_ambiance", "ambient_dripping.mp3");
        this.load.audio("collect", "collect.ogg");
        this.load.audio("checkpoint", "checkpoint.ogg");
        this.load.audio("impact_wood", "impact_wood.ogg");
        this.load.audio("impact_ground", "impact_ground.ogg");
        this.load.audio("jump", "jump.ogg");
        this.load.audio("push_box", "push_box.ogg");
        this.load.audio("land_spikes", "land_spikes.ogg");
        // Load fonts
        this.load.setPath("./assets/fonts");
        this.load.bitmapFont("blocks", "Kenney_Blocks.png", "Kenney_Blocks.fnt");
        this.load.bitmapFont("mini", "Kenney_Mini.png", "Kenney_Mini.fnt");
        // Load vfx
        this.load.setPath("./assets/vfx");
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            defaultTextureKey: "character",
            frames: [
                { frame: "tile_02.png" },
                { frame: "tile_03.png" },
                { frame: "tile_04.png" }
            ],
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "character",
            frames: [
                { frame: "tile_01.png" }
            ]
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "character",
            frames: [
                { frame: "tile_05.png" }
            ]
        });

        this.anims.create({
            key: 'fall',
            defaultTextureKey: "character",
            frames: [
                { frame: "tile_06.png" }
            ]
        });

        // ...and pass to the next Scene
        this.scene.start("levelScene");
    }
}