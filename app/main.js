const DEV = true

const WindowManager = require("./js/submodules/av/js/backend/windowManager.js")
const FSManager = require("./js/submodules/av/js/backend/fsManager.js")
const MenuManager = require("./js/submodules/av/js/backend/menuManager.js")
const ActionManager = require("./js/submodules/av/js/backend/actionManager.js")

const defaultfile = require("./js/templates/file.js")
const menu = require("./js/templates/menu.js")

const {app, ipcMain, dialog,globalShortcut} = require("electron")


const wm = new WindowManager()
const ah = new ActionManager({
    Left: () => {
      fs.setKeyToValue("settings.general.alignTextCenter",false)
      wm.refresh()
    },
    Center: () => {
      fs.setKeyToValue("settings.general.alignTextCenter",true)
      wm.refresh()
    },
    ZoomIn: () => {
      let v = fs.getValueForKey("settings.general.fontsize")
      v++
      fs.setKeyToValue("settings.general.fontsize",Math.min(48,v))
      wm.refresh()
    },
    ZoomOut: () => {
      let v = fs.getValueForKey("settings.general.fontsize")
      v--
      fs.setKeyToValue("settings.general.fontsize",Math.max(8,v))
      wm.refresh()
    },
    OpenViewer: () => {
      wm.open("viewer",{devTools:DEV})
    },
    OpenEditor: () => {
      wm.open("editor",{devTools:DEV})
    },
    Settings: () => {
      wm.open("settings",{
        devTools:DEV,
        resizable: false,
        width: 800,
        height: 800
      })
    },
    Open: () => {
      wm.getOpenFilepath(fs.type,(data) => {
        fs.openFromDiskWithPath(data,(error) => {
          if(error){
            wm.alert("Error",error)
          }
          else{
            wm.refresh()
          }
        })
      })
    },
    Save: () => {
      wm.getSaveFilepathFor(fs.name,fs.type,(data) => {
        fs.saveToDiskWithPath(data,(error) => {
          if(error){
            wm.alert("Error",error)
          }
        })
      })
    },
    FocusWorkspace: () => {
      wm.focus("index")
    },
    SwitchWindow: () => {
      wm.switch()
    }
  },
  (f) => {
    wm.send(f)
  }
)

const fs = new FSManager(app.name.toLowerCase(),defaultfile)


app.whenReady().then(() => {
  const mm = new MenuManager(menu,ah)
  ipcMain.on('refresh', (event,sender) => {
    fs.refresh()
    wm.refresh(sender)
  })
  
  wm.open("index",{devTools:DEV,onclose: () => {
    app.quit()
  }})
 
  app.on("gpu-process-crashed", () => {
    console.log("ERROR 64 - App GPU process has crashed")
    app.quit()
  })
  process.on("uncaughtException", function (err) {
    console.log("ERROR 60 - process thrown exception")
    console.log(err)
    app.quit()
  })
})

app.on('window-all-closed', function () {
  if(process.platform !== 'darwin'){
    app.quit()
  }
})