window.onload = function ()
{
	var game = new Phaser.Game(376, 288, Phaser.AUTO, '', {preload: preload, create: create, update: update, render: render});
    var mazeManager, world, hud;

	function preload ()
	{	
		mazeManager = new MazeManager(game);
		mazeManager.preload();
        world = new World(game, mazeManager);
        world.preload();
		hud = new Hud(game, world, mazeManager);
		hud.preload();
        game.load.spritesheet('pacman', 'assets/pacman.png',15,15);
        game.load.audio('sfxAlive', 'assets/alive.wav');
        game.load.audio('sfxChomp', 'assets/chomp.wav');
        game.load.audio('sfxDead', 'assets/dead.wav');
	}

	function create ()
	{
        game.stage.backgroundColor = '#000000';
        game.world.setBounds(0,0,224,288);
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.setImpactEvents(true);
        game.physics.p2.friction = 0;
		mazeManager.create();
        world.create();
		hud.create();
	}

	function update ()
	{   
        mazeManager.update();
        world.update();
		hud.update();
	}

	function render() {
        hud.render();
    }
};