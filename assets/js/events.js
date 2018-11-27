const {ipcRenderer, shell} = require('electron')

const startButton = document.getElementById('container--submit-container').getElementsByTagName('button')[0];
const delayInput = document.getElementById('container--delay-container').getElementsByTagName('input')[0];

var currentTab = 0;

changeTab(currentTab);

function changeTab(tab) {
  var x = document.getElementsByClassName('tab');
  var y = document.getElementsByClassName('nav--button')
  for(var i = 0; i < x.length; i++) {
    x[i].classList.remove('active');
  }
  for(var i = 0; i < y.length; i++) {
    y[i].classList.remove('active');
  }
  x[tab].classList.add('active');
  document.getElementById('nav--tab' + tab).classList.add('active');

  if(tab == 1) {
    loadItems();
  }
}

startButton.addEventListener('click', function() {
    ipcRenderer.send('start:monitor', delayInput.value);
});

function loadItems() {
  document.getElementsByClassName('tab')[currentTab].innerHTML = "";
  ipcRenderer.send('load:items', 'yee');
}

$('a').click((event) => {
  event.preventDefault();
  let link = event.target.closest('a').href;
  console.log(link);
  shell.openExternal(link);
});

$('.nav--button').click((event) => {
  changeTab(parseInt(event.target.getAttribute('tab')))
})

ipcRenderer.on('update', function(event, mtype, itemName, url, itemColor, itemImg) {
  $('#container--history').prepend('<div class="history--object"><a class="external" href="' + url + '">' +
      '<div class="object--img"><img src="http:' + itemImg + '" alt="iTEM"></div>' +
      '<div class="object--text">' +
        '<div class="object--status"><span class="' + mtype + '"></span></div>' +
        '<div class="object--time"><span>' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '</span></div>' +
        '<div class="object--info">' +
          '<p>' + itemName + '</p><p>' + itemColor + '</p><p>Size Large</p>' +
        '</div></div>' +
  '</a></div>')
});

ipcRenderer.on('get:items', (event, args) => {
  console.log(args);
})
