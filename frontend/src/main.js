import { createStore } from './state.js';
import { createViewer } from './viewer/scene.js';
import { mountChat } from './ui/chat.js';
import { mountProperties } from './ui/properties.js';

const store = createStore();
const viewer = createViewer(document.getElementById('viewer'), store, document.getElementById('overlay'));
mountChat(document.getElementById('chat-panel'), store);
mountProperties(document.getElementById('properties-panel'), store);

document.getElementById('toggle-doors').addEventListener('change', (e) => viewer.setShowDoors(e.target.checked));
document.getElementById('reset-view').addEventListener('click', () => viewer.resetView());
