import * as THREE from 'three';

var audioLoader;
var audioPath;
export var sound;

function onButtonPressed() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.transition = 0;
    loadingScreen.classList.add('fade-out');
    loadingScreen.addEventListener('transitionend', (e) => {
        const element = e.target;
        element.remove();
    });

    // Config and play the loaded audio
    sound = new THREE.Audio( new THREE.AudioListener() );
    audioLoader.load( audioPath, function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.play(); 
    });
}

export const loadingManager = new THREE.LoadingManager(() => {
    let loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        return;
    }
    loadingScreen.transition = 0;
    loadingScreen.style.setProperty('--speed1', '0');
    loadingScreen.style.setProperty('--speed2', '0');
    loadingScreen.style.setProperty('--speed3', '0');

    let button = document.getElementById("myBtn")
    button.style.backgroundColor = 'Blue';
    button.innerHTML = 'Start';
    button.addEventListener("click", onButtonPressed);
});

function loadAudio(manager, audio)
{
  // Create ambient sound
  audioLoader = new THREE.AudioLoader(manager);
  audioPath = audio;
}

loadAudio(loadingManager, './assets/sound/minecraft.mp3');