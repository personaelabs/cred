importScripts(
  'https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDkSg6JXnjeilCW7Abx1m-VylllqSslA_k',
  authDomain: 'cred-279bb.firebaseapp.com',
  projectId: 'cred-279bb',
  storageBucket: 'cred-279bb.appspot.com',
  messagingSenderId: '972816044956',
  appId: '1:972816044956:web:f059ecf5ddd2fa6b526e59',
  measurementId: 'G-LM6NQTX3W7',
});

const messaging = firebase.messaging();

/*
messaging.setBackgroundMessageHandler(payload => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
});
console.log('firebase-messaging-sw.js loaded!');
*/

messaging.onBackgroundMessage(payload => {
  // alert('onBackgroundMessage');
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  /*
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
  */
});
