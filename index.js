const rp = require('request-promise');
const cheerio = require('cheerio');
const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const jquery = require('jquery');

let mainWindow;
let delay = 10;
let url = 'http://supremenewyork.com/shop/all';
let mtype = "CHANGE";
let host = 'http://supremenewyork.com';
let itemName;
let itemColor;
let currentState;
let prvState;
let updatepage;
let itemImg;
let availibleItems;
let links = [];
let currentLink = 0;


function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600,frame: false, title: "Restock Monitor"});

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.openDevTools();
}


app.on('ready', createWindow);

ipcMain.on('load:items', (event, arg) => {
    rp({
      url: url,
      transform: function(body) {
        return cheerio.load(body)
      }
    })
    .then(($) => {
      let items = [];
          for(var i = 0; i < $('.inner-article').length; i++) {
            updatepage = host + $('.inner-article').eq(i).find('a').attr('href');
            rp({
              url: updatepage,
              transform: (body) => {
                return cheerio.load(body);
              }
            }).then((response) => {
              itemName = response('h1').eq(1).text();
              itemColor = response('.style').text();
              itemImg = response('#img-main').attr('src');
              event.sender.send('get:items', [itemName, itemColor, itemImg])
            });
          }
      })
    .catch((err) => {
      console.log(err);
    });
})

ipcMain.on('start:monitor', (event, arg) => {
    delay = parseInt(arg);

    const poll = () => {
      rp({
        url: url,
        transform: function(body) {
          return cheerio.load(body)
        }
      })
      .then(($) => {
        currentState = $('#container');
        if(prvState !== undefined){
          // TODO: vergleichen mit $
          if(currentState.html() !== prvState.html()) {
            console.log('change');

            for(var i = 0; i < currentState.find('.inner-article').length; i++) {
              if(prvState.find('.inner-article a').eq(i).attr('href') === currentState.find('.inner-article a').eq(i).attr('href')) {
                //FALL 1: ITEM RESTOCK
                if(prvState.find('.inner-article').eq(i).find('.sold_out_tag').length > currentState.find('.inner-article').eq(i).find('.sold_out_tag').length) {
                  mtype = "restock"

                  updatepage = host + prvState.find('.inner-article').eq(i).find('a').attr('href');
                  rp({
                    url: updatepage,
                    transform: (body) => {
                      return cheerio.load(body);
                    }
                  }).then((response) => {
                    itemName = response('h1').eq(1).text();
                    itemColor = response('.style').text();
                    itemImg = response('#img-main').attr('src');
                    console.log(mtype + " " + itemName);
                    mainWindow.focus();
                    webContents.getFocusedWebContents().send('update', mtype, itemName, updatepage, itemColor, itemImg);
                  });

                //FALL 2: SOLD OUT ITEM
                } else if(prvState.find('.inner-article').eq(i).find('.sold_out_tag').length < currentState.find('.inner-article').eq(i).find('.sold_out_tag').length) {
                    mtype = "soldout";

                    updatepage = host + prvState.find('.inner-article').eq(i).find('a').attr('href');
                    rp({
                      url: updatepage,
                      transform: (body) => {
                        return cheerio.load(body);
                      }
                    }).then((response) => {
                      mainWindow.focus();
                      itemName = response('h1').eq(1).text();
                      itemColor = response('.style').text();
                      itemImg = response('#img-main').attr('src');

                      webContents.getFocusedWebContents().send('update', mtype, itemName, updatepage, itemColor, itemImg);

                      console.log(mtype + " " + itemName);
                    });
                }
              }
            }
          }
        } else {
          console.log('#############################');
          console.log('##########---------##########');
          console.log('##########--START--##########');
          console.log('##########---------##########');
          console.log('#############################');
        }
        prvState = currentState;

        setTimeout(() => {
          poll();
        }, delay * 1000);
        })
      .catch((err) => {
        console.log(err);
      });
    }

    poll();
});
