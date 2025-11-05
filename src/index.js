// index.js - entry
import './styles/main.css';
import { initRouter } from './router';
import './views/home'; // ensure modules baked in
import registerSW from '../registerServiceWorker';
import { subscribeUser, unsubscribeUser } from '../registerNotification';


// init app
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  // initial render
  if (!location.hash) location.hash = '/';
  registerSW()

  const token = localStorage.getItem('token')
  if(token){
    subscribeUser() 
  } else{
    unsubscribeUser()
  }
});
