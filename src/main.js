// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1024,
    height: 600,
    scene: [Load, Level],
    backgroundColor: '#18151e',
    fps: { forceSetTimeOut: true, target: 60 }
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, vfx: {}};

const game = new Phaser.Game(config);