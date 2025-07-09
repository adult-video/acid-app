import {ACIDViewer} from "../submodules/acid/js/acidViewer.js"
import {FSWrapper} from "../submodules/av/js/frontend/fsWrapper.js"

const ipc = require("electron").ipcRenderer


window.addEventListener("DOMContentLoaded",function(){
  let FILE
  let viewer = new ACIDViewer()

  const input = document.getElementById("input")
  let fs = new FSWrapper(function(){
    refresh()
  })

  ipc.on("refresh", (event,sender) => {
    refresh()
  })  
  
  function update(){
    viewer.update(FILE)
  }

  function refresh(){
    fs.update(() => {
      FILE = fs.get()
      update()
    })  
  }
})

